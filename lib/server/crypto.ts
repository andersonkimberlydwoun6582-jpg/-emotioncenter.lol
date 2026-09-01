import { getBindings } from '@/lib/server/db';

const encoder = new TextEncoder();

function buffer(bytes: Uint8Array) {
  return Uint8Array.from(bytes).buffer;
}

export function bytesToBase64Url(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

export function base64UrlToBytes(value: string) {
  if (!/^[A-Za-z0-9_-]+$/u.test(value)) throw new Error('invalid_base64url');
  const padded = value.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function requireEncodedBytes(value: unknown, bytes: number, field: string) {
  if (typeof value !== 'string') throw new Error(`invalid_${field}`);
  const decoded = base64UrlToBytes(value);
  if (decoded.byteLength !== bytes) throw new Error(`invalid_${field}`);
  return value;
}

export async function sha256(value: string | Uint8Array) {
  const input = typeof value === 'string' ? encoder.encode(value) : value;
  return bytesToBase64Url(new Uint8Array(await crypto.subtle.digest('SHA-256', buffer(input))));
}

export async function hashAuthToken(authToken: string) {
  const pepper = getBindings().AUTH_PEPPER_V1;
  if (!pepper || pepper.length < 32) throw new Error('auth_not_configured');
  const key = await crypto.subtle.importKey('raw', encoder.encode(pepper), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, buffer(base64UrlToBytes(authToken)));
  return bytesToBase64Url(new Uint8Array(signature));
}

export function randomToken(bytes = 32) {
  return bytesToBase64Url(crypto.getRandomValues(new Uint8Array(bytes)));
}

export function constantTimeEqual(left: string, right: string) {
  const a = new TextEncoder().encode(left);
  const b = new TextEncoder().encode(right);
  let difference = a.byteLength ^ b.byteLength;
  const length = Math.max(a.byteLength, b.byteLength);
  for (let index = 0; index < length; index += 1) difference |= (a[index] ?? 0) ^ (b[index] ?? 0);
  return difference === 0;
}
