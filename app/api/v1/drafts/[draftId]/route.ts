import { requireSession } from '@/lib/server/auth';
import { getDb } from '@/lib/server/db';
import { ApiError, assertSameOrigin, jsonError, requireIfMatch } from '@/lib/server/http';

export async function DELETE(request: Request, { params }: { params: Promise<{ draftId: string }> }) {
  try {
    assertSameOrigin(request);
    const expectedVersion = requireIfMatch(request);
    const session = await requireSession(request);
    const { draftId } = await params;
    const db = await getDb();
    const now = Date.now();
    const writeToken = crypto.randomUUID();
    const results = await db.batch([
      db.prepare(`UPDATE drafts SET write_token = ?
        WHERE id = ? AND identity_id = ? AND version = ?`)
        .bind(writeToken, draftId, session.identityId, expectedVersion),
      db.prepare(`INSERT INTO security_events
        (id, identity_id, event_type, object_type, object_id, created_at)
        SELECT ?, ?, 'draft_deleted', 'draft', ?, ?
        WHERE EXISTS (SELECT 1 FROM drafts WHERE id = ? AND identity_id = ? AND write_token = ?)`)
        .bind(crypto.randomUUID(), session.identityId, draftId, now, draftId, session.identityId, writeToken),
      db.prepare(`DELETE FROM cloud_backups WHERE draft_id IN
        (SELECT id FROM drafts WHERE id = ? AND identity_id = ? AND write_token = ?)`)
        .bind(draftId, session.identityId, writeToken),
      db.prepare(`DELETE FROM drafts WHERE id = ? AND identity_id = ? AND write_token = ?`)
        .bind(draftId, session.identityId, writeToken),
    ]);
    if (Number(results[0].meta.changes ?? 0) !== 1) {
      const current = await db.prepare('SELECT version FROM drafts WHERE id = ? AND identity_id = ?')
        .bind(draftId, session.identityId).first<{ version: number }>();
      if (!current) throw new ApiError(404, 'not_found');
      throw new ApiError(409, 'backup_conflict', `Current version is ${current.version}.`);
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    return jsonError(error);
  }
}
