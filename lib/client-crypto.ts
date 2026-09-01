import type { CommunityPost } from '@/lib/community-data';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function buffer(bytes: Uint8Array) {
  return Uint8Array.from(bytes).buffer;
}

export function encodeBase64Url(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

export function decodeBase64Url(value: string) {
  if (!/^[A-Za-z0-9_-]+$/u.test(value)) throw new Error('That recovery code is not valid.');
  const padded = value.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - (value.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

async function digest(bytes: Uint8Array) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', buffer(bytes)));
}

async function derive(recoverySecret: Uint8Array, credentialId: Uint8Array, info: string) {
  const material = await crypto.subtle.importKey('raw', buffer(recoverySecret), 'HKDF', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: buffer(credentialId), info: buffer(encoder.encode(info)) }, material, 256);
  return new Uint8Array(bits);
}

async function aesEncrypt(keyBytes: Uint8Array, iv: Uint8Array, aad: string, plaintext: Uint8Array) {
  const key = await crypto.subtle.importKey('raw', buffer(keyBytes), 'AES-GCM', false, ['encrypt']);
  return new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: buffer(iv), additionalData: buffer(encoder.encode(aad)), tagLength: 128 }, key, buffer(plaintext)));
}

async function aesDecrypt(keyBytes: Uint8Array, iv: Uint8Array, aad: string, ciphertext: Uint8Array) {
  const key = await crypto.subtle.importKey('raw', buffer(keyBytes), 'AES-GCM', false, ['decrypt']);
  return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: buffer(iv), additionalData: buffer(encoder.encode(aad)), tagLength: 128 }, key, buffer(ciphertext)));
}

export async function createRecoveryBundle() {
  const credentialId = crypto.getRandomValues(new Uint8Array(16));
  const recoverySecret = crypto.getRandomValues(new Uint8Array(32));
  const identityKey = crypto.getRandomValues(new Uint8Array(32));
  const credentialIdText = encodeBase64Url(credentialId);
  const secretText = encodeBase64Url(recoverySecret);
  const authToken = await derive(recoverySecret, credentialId, 'emotioncenter/auth/v1');
  const wrapKey = await derive(recoverySecret, credentialId, 'emotioncenter/wrap/v1');
  const wrapIv = crypto.getRandomValues(new Uint8Array(12));
  const wrappedIdentityKey = await aesEncrypt(wrapKey, wrapIv, `emotioncenter:identity-wrap:v1:${credentialIdText}`, identityKey);
  const prefix = `ecr1.${credentialIdText}.${secretText}`;
  const checksum = encodeBase64Url((await digest(encoder.encode(prefix))).slice(0, 6));
  return {
    recoveryCode: `${prefix}.${checksum}`,
    identityKey: encodeBase64Url(identityKey),
    credentialId: credentialIdText,
    enrollment: {
      credential_id: credentialIdText,
      auth_token: encodeBase64Url(authToken),
      wrap_iv: encodeBase64Url(wrapIv),
      wrapped_identity_key: encodeBase64Url(wrappedIdentityKey),
      derivation_version: 1,
      crypto_version: 1,
    },
  };
}

export async function parseRecoveryCode(code: string) {
  const parts = code.trim().split('.');
  if (parts.length !== 4 || parts[0] !== 'ecr1') throw new Error('That recovery code is not valid.');
  const credentialId = decodeBase64Url(parts[1]);
  const recoverySecret = decodeBase64Url(parts[2]);
  if (credentialId.byteLength !== 16 || recoverySecret.byteLength !== 32) throw new Error('That recovery code is not valid.');
  const expected = encodeBase64Url((await digest(encoder.encode(parts.slice(0, 3).join('.')))).slice(0, 6));
  if (expected !== parts[3]) throw new Error('Check the recovery code and try again.');
  const authToken = await derive(recoverySecret, credentialId, 'emotioncenter/auth/v1');
  const wrapKey = await derive(recoverySecret, credentialId, 'emotioncenter/wrap/v1');
  return { credentialId: parts[1], authToken: encodeBase64Url(authToken), wrapKey };
}

export async function encryptPost(post: CommunityPost, draftId: string, contentVersion: number, identityKeyText: string) {
  const identityKey = decodeBase64Url(identityKeyText);
  const draftKey = crypto.getRandomValues(new Uint8Array(32));
  const contentIv = crypto.getRandomValues(new Uint8Array(12));
  const draftKeyIv = crypto.getRandomValues(new Uint8Array(12));
  const payload = encoder.encode(JSON.stringify({ schema_version: 1, post }));
  const ciphertext = await aesEncrypt(draftKey, contentIv, `emotioncenter:content:v1:${draftId}:${contentVersion}`, payload);
  const wrappedDraftKey = await aesEncrypt(identityKey, draftKeyIv, `emotioncenter:draft-key-wrap:v1:${draftId}`, draftKey);
  return {
    content_version: contentVersion,
    ciphertext: encodeBase64Url(ciphertext),
    content_iv: encodeBase64Url(contentIv),
    wrapped_draft_key: encodeBase64Url(wrappedDraftKey),
    draft_key_iv: encodeBase64Url(draftKeyIv),
    crypto_version: 1,
  };
}

export type DownloadedBackup = {
  content_version: number;
  ciphertext: string;
  content_iv: string;
  wrapped_draft_key: string;
  draft_key_iv: string;
  wrapped_identity_key: string;
  identity_wrap_iv: string;
  crypto_version: number;
};

export async function decryptPost(backup: DownloadedBackup, draftId: string, credentialId: string, wrapKey: Uint8Array) {
  const identityKey = await aesDecrypt(
    wrapKey,
    decodeBase64Url(backup.identity_wrap_iv),
    `emotioncenter:identity-wrap:v1:${credentialId}`,
    decodeBase64Url(backup.wrapped_identity_key),
  );
  const draftKey = await aesDecrypt(
    identityKey,
    decodeBase64Url(backup.draft_key_iv),
    `emotioncenter:draft-key-wrap:v1:${draftId}`,
    decodeBase64Url(backup.wrapped_draft_key),
  );
  const plaintext = await aesDecrypt(
    draftKey,
    decodeBase64Url(backup.content_iv),
    `emotioncenter:content:v1:${draftId}:${backup.content_version}`,
    decodeBase64Url(backup.ciphertext),
  );
  const parsed = JSON.parse(decoder.decode(plaintext)) as { schema_version: number; post: CommunityPost };
  if (parsed.schema_version !== 1 || !parsed.post?.id) throw new Error('This backup uses an unsupported format.');
  return { post: { ...parsed.post, isMine: true }, identityKey: encodeBase64Url(identityKey) };
}
