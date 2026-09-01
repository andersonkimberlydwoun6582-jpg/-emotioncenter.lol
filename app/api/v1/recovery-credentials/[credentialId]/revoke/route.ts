import { requireSession } from '@/lib/server/auth';
import { getDb } from '@/lib/server/db';
import { ApiError, assertSameOrigin, jsonError } from '@/lib/server/http';

export async function POST(request: Request, { params }: { params: Promise<{ credentialId: string }> }) {
  try {
    assertSameOrigin(request);
    const session = await requireSession(request);
    const { credentialId } = await params;
    if (credentialId === session.credentialId) throw new ApiError(409, 'must_use_another_credential');
    const db = await getDb();
    const now = Date.now();
    const eventId = crypto.randomUUID();
    const results = await db.batch([
      db.prepare(`UPDATE recovery_credentials SET is_revoked = 1, revoked_at = ?
        WHERE credential_id = ? AND identity_id = ? AND is_revoked = 0
          AND (expires_at IS NULL OR expires_at > ?)
          AND (SELECT COUNT(*) FROM recovery_credentials
            WHERE identity_id = ? AND is_revoked = 0
              AND (expires_at IS NULL OR expires_at > ?)) >= 2`)
        .bind(now, credentialId, session.identityId, now, session.identityId, now),
      db.prepare(`UPDATE sessions SET revoked_at = ?
        WHERE credential_id = ? AND identity_id = ? AND revoked_at IS NULL
          AND EXISTS (SELECT 1 FROM recovery_credentials
            WHERE credential_id = ? AND identity_id = ? AND is_revoked = 1 AND revoked_at = ?)`)
        .bind(now, credentialId, session.identityId, credentialId, session.identityId, now),
      db.prepare(`INSERT INTO security_events
        (id, identity_id, event_type, object_type, object_id, created_at)
        SELECT ?, ?, 'recovery_credential_revoked', 'credential', ?, ?
        WHERE EXISTS (SELECT 1 FROM recovery_credentials
          WHERE credential_id = ? AND identity_id = ? AND is_revoked = 1 AND revoked_at = ?)`)
        .bind(eventId, session.identityId, credentialId, now, credentialId, session.identityId, now),
    ]);
    if (Number(results[0].meta.changes ?? 0) !== 1) {
      const target = await db.prepare(`SELECT is_revoked FROM recovery_credentials
        WHERE credential_id = ? AND identity_id = ?`).bind(credentialId, session.identityId).first<{ is_revoked: number }>();
      if (!target) throw new ApiError(404, 'not_found');
      if (target.is_revoked) return new Response(null, { status: 204 });
      throw new ApiError(409, 'last_credential');
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    return jsonError(error);
  }
}
