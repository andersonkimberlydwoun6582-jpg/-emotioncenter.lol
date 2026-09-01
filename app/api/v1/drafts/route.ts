import { requireSession } from '@/lib/server/auth';
import { sha256 } from '@/lib/server/crypto';
import { getDb } from '@/lib/server/db';
import { ApiError, assertSameOrigin, jsonError, noStoreHeaders, requireIdempotencyKey } from '@/lib/server/http';

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    const db = await getDb();
    const result = await db.prepare(`SELECT d.id, d.version, d.updated_at,
      EXISTS(SELECT 1 FROM cloud_backups b WHERE b.draft_id = d.id) AS has_cloud_backup
      FROM drafts d WHERE d.identity_id = ? ORDER BY d.updated_at DESC`)
      .bind(session.identityId).all<{ id: string; version: number; updated_at: number; has_cloud_backup: number }>();
    return Response.json({ drafts: result.results.map((draft) => ({
      id: draft.id,
      version: Number(draft.version),
      has_cloud_backup: Boolean(draft.has_cloud_backup),
      updated_at: new Date(Number(draft.updated_at)).toISOString(),
    })) }, { headers: noStoreHeaders() });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const session = await requireSession(request);
    const idempotencyKey = requireIdempotencyKey(request);
    const db = await getDb();
    const now = Date.now();
    const scope = `draft_create:${session.identityId}`;
    const requestHash = await sha256('emotioncenter:draft-create:v1');
    const proposedDraftId = crypto.randomUUID();
    await db.prepare(`INSERT OR IGNORE INTO idempotency_records
      (scope, idempotency_key, request_hash, response_identity_id, response_resource_id, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .bind(scope, idempotencyKey, requestHash, session.identityId, proposedDraftId, now, now + 86_400_000).run();
    const record = await db.prepare(`SELECT request_hash, response_identity_id, response_resource_id
      FROM idempotency_records WHERE scope = ? AND idempotency_key = ? AND expires_at > ?`)
      .bind(scope, idempotencyKey, now)
      .first<{ request_hash: string; response_identity_id: string; response_resource_id: string }>();
    if (!record || record.request_hash !== requestHash || record.response_identity_id !== session.identityId) {
      throw new ApiError(409, 'idempotency_conflict');
    }
    await db.prepare(`INSERT OR IGNORE INTO drafts (id, identity_id, version, created_at, updated_at)
      VALUES (?, ?, 1, ?, ?)`).bind(record.response_resource_id, session.identityId, now, now).run();
    const draft = await db.prepare(`SELECT id, version, updated_at FROM drafts
      WHERE id = ? AND identity_id = ?`).bind(record.response_resource_id, session.identityId)
      .first<{ id: string; version: number; updated_at: number }>();
    if (!draft) throw new ApiError(409, 'idempotency_conflict');
    return Response.json({ id: draft.id, version: Number(draft.version), updated_at: new Date(Number(draft.updated_at)).toISOString() }, {
      status: draft.id === proposedDraftId ? 201 : 200,
      headers: noStoreHeaders({ ETag: `"${draft.version}"` }),
    });
  } catch (error) {
    return jsonError(error);
  }
}
