import { requireSession } from '@/lib/server/auth';
import { getDb } from '@/lib/server/db';
import { eventStatement } from '@/lib/server/events';
import { ApiError, assertSameOrigin, jsonError, noStoreHeaders } from '@/lib/server/http';

export async function GET(request: Request, { params }: { params: Promise<{ credentialId: string }> }) {
  try {
    const session = await requireSession(request);
    const { credentialId } = await params;
    const db = await getDb();
    const now = Date.now();
    const credential = await db.prepare(`SELECT credential_id, wrap_iv, wrapped_identity_key
      FROM recovery_credentials
      WHERE credential_id = ? AND identity_id = ? AND rotated_from = ?
        AND is_revoked = 0 AND (expires_at IS NULL OR expires_at > ?)
      LIMIT 1`)
      .bind(credentialId, session.identityId, session.credentialId, now)
      .first<{ credential_id: string; wrap_iv: string; wrapped_identity_key: string }>();
    if (!credential) throw new ApiError(404, 'not_found');
    return Response.json(credential, { headers: noStoreHeaders() });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ credentialId: string }> }) {
  try {
    assertSameOrigin(request);
    const session = await requireSession(request);
    const { credentialId } = await params;
    if (credentialId === session.credentialId) throw new ApiError(409, 'current_credential');
    const db = await getDb();
    const result = await db.prepare(`DELETE FROM recovery_credentials
      WHERE credential_id = ? AND identity_id = ? AND rotated_from = ?
        AND is_revoked = 0
        AND NOT EXISTS (
          SELECT 1 FROM sessions
          WHERE credential_id = ? AND identity_id = ?
            AND revoked_at IS NULL AND expires_at > ?
        )`)
      .bind(credentialId, session.identityId, session.credentialId, credentialId, session.identityId, Date.now())
      .run();
    if (Number(result.meta.changes ?? 0) !== 1) {
      const target = await db.prepare('SELECT credential_id FROM recovery_credentials WHERE credential_id = ? AND identity_id = ?')
        .bind(credentialId, session.identityId).first();
      if (!target) return new Response(null, { status: 204, headers: noStoreHeaders() });
      throw new ApiError(409, 'credential_in_use');
    }
    await eventStatement(db, session, 'recovery_credential_discarded', 'credential', credentialId).run();
    return new Response(null, { status: 204, headers: noStoreHeaders() });
  } catch (error) {
    return jsonError(error);
  }
}
