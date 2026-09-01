import { requireSession } from '@/lib/server/auth';
import { validateBackupInput } from '@/lib/server/contracts';
import { getDb } from '@/lib/server/db';
import { ApiError, assertSameOrigin, jsonError, noStoreHeaders, readJson, requireIfMatch } from '@/lib/server/http';

export async function GET(request: Request, { params }: { params: Promise<{ draftId: string }> }) {
  try {
    const session = await requireSession(request);
    const { draftId } = await params;
    const db = await getDb();
    const row = await db.prepare(`SELECT d.version, b.ciphertext, b.content_iv, b.wrapped_draft_key,
      b.draft_key_iv, b.crypto_version, c.wrapped_identity_key, c.wrap_iv
      FROM drafts d
      JOIN cloud_backups b ON b.draft_id = d.id
      JOIN recovery_credentials c ON c.credential_id = ? AND c.identity_id = d.identity_id
      WHERE d.id = ? AND d.identity_id = ? AND c.is_revoked = 0
        AND (c.expires_at IS NULL OR c.expires_at > ?)
      LIMIT 1`).bind(session.credentialId, draftId, session.identityId, Date.now())
      .first<{ version: number; ciphertext: string; content_iv: string; wrapped_draft_key: string; draft_key_iv: string; crypto_version: number; wrapped_identity_key: string; wrap_iv: string }>();
    if (!row) throw new ApiError(404, 'not_found');
    return Response.json({
      content_version: Number(row.version),
      ciphertext: row.ciphertext,
      content_iv: row.content_iv,
      wrapped_draft_key: row.wrapped_draft_key,
      draft_key_iv: row.draft_key_iv,
      wrapped_identity_key: row.wrapped_identity_key,
      identity_wrap_iv: row.wrap_iv,
      derivation_version: 1,
      crypto_version: Number(row.crypto_version),
    }, { headers: noStoreHeaders({ ETag: `"${row.version}"` }) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ draftId: string }> }) {
  try {
    assertSameOrigin(request);
    const expectedVersion = requireIfMatch(request);
    const session = await requireSession(request);
    const { draftId } = await params;
    const input = validateBackupInput(await readJson(request), expectedVersion);
    const db = await getDb();
    const now = Date.now();
    const writeToken = crypto.randomUUID();
    const results = await db.batch([
      db.prepare(`UPDATE drafts SET version = ?, encrypted_size = ?, updated_at = ?, write_token = ?
        WHERE id = ? AND identity_id = ? AND version = ?`)
        .bind(input.content_version, input.ciphertext.length, now, writeToken, draftId, session.identityId, expectedVersion),
      db.prepare(`INSERT INTO cloud_backups
        (draft_id, ciphertext, content_iv, wrapped_draft_key, draft_key_iv, crypto_version, created_at, updated_at)
        SELECT id, ?, ?, ?, ?, ?, ?, ? FROM drafts
        WHERE id = ? AND identity_id = ? AND write_token = ?
        ON CONFLICT(draft_id) DO UPDATE SET
          ciphertext = excluded.ciphertext,
          content_iv = excluded.content_iv,
          wrapped_draft_key = excluded.wrapped_draft_key,
          draft_key_iv = excluded.draft_key_iv,
          crypto_version = excluded.crypto_version,
          updated_at = excluded.updated_at`)
        .bind(input.ciphertext, input.content_iv, input.wrapped_draft_key, input.draft_key_iv, input.crypto_version, now, now, draftId, session.identityId, writeToken),
      db.prepare(`INSERT INTO security_events
        (id, identity_id, event_type, object_type, object_id, created_at)
        SELECT ?, ?, 'cloud_backup_updated', 'draft', ?, ?
        WHERE EXISTS (SELECT 1 FROM drafts WHERE id = ? AND identity_id = ? AND write_token = ?)`)
        .bind(crypto.randomUUID(), session.identityId, draftId, now, draftId, session.identityId, writeToken),
      db.prepare('UPDATE drafts SET write_token = NULL WHERE id = ? AND identity_id = ? AND write_token = ?')
        .bind(draftId, session.identityId, writeToken),
    ]);
    if (Number(results[0].meta.changes ?? 0) !== 1) {
      const current = await db.prepare('SELECT version FROM drafts WHERE id = ? AND identity_id = ?')
        .bind(draftId, session.identityId).first<{ version: number }>();
      if (!current) throw new ApiError(404, 'not_found');
      throw new ApiError(409, 'backup_conflict', `Current version is ${current.version}.`);
    }
    return Response.json({ id: draftId, version: input.content_version, updated_at: new Date(now).toISOString() }, {
      headers: noStoreHeaders({ ETag: `"${input.content_version}"` }),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ draftId: string }> }) {
  try {
    assertSameOrigin(request);
    const expectedVersion = requireIfMatch(request);
    const session = await requireSession(request);
    const { draftId } = await params;
    const db = await getDb();
    const now = Date.now();
    const nextVersion = expectedVersion + 1;
    const writeToken = crypto.randomUUID();
    const results = await db.batch([
      db.prepare(`UPDATE drafts SET version = ?, encrypted_size = NULL, updated_at = ?, write_token = ?
        WHERE id = ? AND identity_id = ? AND version = ?
          AND EXISTS (SELECT 1 FROM cloud_backups WHERE draft_id = ?)`)
        .bind(nextVersion, now, writeToken, draftId, session.identityId, expectedVersion, draftId),
      db.prepare(`DELETE FROM cloud_backups WHERE draft_id IN
        (SELECT id FROM drafts WHERE id = ? AND identity_id = ? AND write_token = ?)`)
        .bind(draftId, session.identityId, writeToken),
      db.prepare(`INSERT INTO security_events
        (id, identity_id, event_type, object_type, object_id, created_at)
        SELECT ?, ?, 'cloud_backup_deleted', 'draft', ?, ?
        WHERE EXISTS (SELECT 1 FROM drafts WHERE id = ? AND identity_id = ? AND write_token = ?)`)
        .bind(crypto.randomUUID(), session.identityId, draftId, now, draftId, session.identityId, writeToken),
      db.prepare('UPDATE drafts SET write_token = NULL WHERE id = ? AND identity_id = ? AND write_token = ?')
        .bind(draftId, session.identityId, writeToken),
    ]);
    if (Number(results[0].meta.changes ?? 0) !== 1) {
      const current = await db.prepare(`SELECT d.version,
        EXISTS(SELECT 1 FROM cloud_backups b WHERE b.draft_id = d.id) AS has_backup
        FROM drafts d WHERE d.id = ? AND d.identity_id = ?`)
        .bind(draftId, session.identityId).first<{ version: number; has_backup: number }>();
      if (!current || !current.has_backup) throw new ApiError(404, 'not_found');
      throw new ApiError(409, 'backup_conflict', `Current version is ${current.version}.`);
    }
    return new Response(null, { status: 204, headers: { ETag: `"${nextVersion}"` } });
  } catch (error) {
    return jsonError(error);
  }
}
