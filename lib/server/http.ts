import { sha256 } from '@/lib/server/crypto';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message = code) {
    super(message);
  }
}

export function jsonError(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json({ error: { code: error.code, message: error.message } }, { status: error.status });
  }
  console.error('Emotion Center API error:', error instanceof Error ? error.message : 'unknown_error');
  const code = error instanceof Error && error.message === 'database_unavailable' ? 'database_unavailable' : 'internal_error';
  const status = code === 'database_unavailable' ? 503 : 500;
  return Response.json({ error: { code, message: code === 'database_unavailable' ? 'Cloud backup is temporarily unavailable.' : 'Something went wrong.' } }, { status });
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) throw new ApiError(403, 'invalid_origin');
}

export async function readJson<T>(request: Request): Promise<T> {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) throw new ApiError(400, 'invalid_request');
  try {
    return await request.json() as T;
  } catch {
    throw new ApiError(400, 'invalid_request');
  }
}

export function getCookie(request: Request, name: string) {
  const cookie = request.headers.get('cookie') ?? '';
  for (const part of cookie.split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key === name) return value.join('=');
  }
  return null;
}

export async function getSessionTokenHash(request: Request) {
  const token = getCookie(request, '__Host-ec_session');
  if (!token) throw new ApiError(401, 'session_expired');
  return sha256(token);
}

export function sessionCookie(rawToken: string, maxAge = 604800) {
  return `__Host-ec_session=${rawToken}; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}

export function clearSessionCookie() {
  return '__Host-ec_session=; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=0';
}

export function requireIdempotencyKey(request: Request) {
  const value = request.headers.get('idempotency-key');
  if (!value || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value)) {
    throw new ApiError(400, 'invalid_idempotency_key');
  }
  return value.toLowerCase();
}

export function requireIfMatch(request: Request) {
  const value = request.headers.get('if-match');
  const match = value?.match(/^"([1-9][0-9]*)"$/u);
  if (!match) throw new ApiError(428, 'precondition_required');
  const version = Number(match[1]);
  if (!Number.isSafeInteger(version)) throw new ApiError(400, 'invalid_version');
  return version;
}

export function noStoreHeaders(extra: HeadersInit = {}) {
  return { 'Cache-Control': 'no-store', ...Object.fromEntries(new Headers(extra).entries()) };
}
