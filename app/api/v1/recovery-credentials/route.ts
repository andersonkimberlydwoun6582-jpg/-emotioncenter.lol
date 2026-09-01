import { requireSession } from '@/lib/server/auth';
import { validateCredentialInput } from '@/lib/server/contracts';
import { hashAuthToken } from '@/lib/server/crypto';
import { getDb } from '@/lib/server/db';
import { eventStatement } from '@/lib/server/events';
import { ApiError, assertSameOrigin, jsonError, readJson } from '@/lib/server/http';

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const session = await requireSession(request);
    const input = validateCredentialInput(await readJson(request));
    const db = await getDb();
    const authTokenHash = await hashAuthToken(input.auth_token);
    const now = Date.now();
    const existing = await db.prepare('SELECT identity_id FROM recovery_credentials WHERE credential_id = ?')
      .bind(input.credential_id).first<{ identity_id: string }>();
    if (existing) throw new ApiError(409, 'credential_conflict');
    await db.batch([
      db.prepare(`INSERT INTO recovery_credentials
        (credential_id, identity_id, auth_token_hash, pepper_version, derivation_version,
         wrap_iv, wrapped_identity_key, crypto_version, created_at, rotated_from)
        VALUES (?, ?, ?, 1, 1, ?, ?, 1, ?, ?)`)
        .bind(input.credential_id, session.identityId, authTokenHash, input.wrap_iv, input.wrapped_identity_key, now, session.credentialId),
      eventStatement(db, session, 'recovery_credential_added', 'credential', input.credential_id, now),
    ]);
    return Response.json({ credential_id: input.credential_id, created_at: new Date(now).toISOString() }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
