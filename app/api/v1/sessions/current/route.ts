import { requireSession } from '@/lib/server/auth';
import { getDb } from '@/lib/server/db';
import { eventStatement } from '@/lib/server/events';
import { assertSameOrigin, clearSessionCookie, jsonError, noStoreHeaders } from '@/lib/server/http';

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const session = await requireSession(request);
    const db = await getDb();
    const now = Date.now();
    await db.batch([
      db.prepare('UPDATE sessions SET revoked_at = ? WHERE id = ? AND identity_id = ?').bind(now, session.sessionId, session.identityId),
      eventStatement(db, session, 'session_revoked', 'session', session.sessionId, now),
    ]);
    return new Response(null, { status: 204, headers: noStoreHeaders({ 'Set-Cookie': clearSessionCookie() }) });
  } catch (error) {
    return jsonError(error);
  }
}
