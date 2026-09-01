import { requireEncodedBytes } from '@/lib/server/crypto';
import { ApiError } from '@/lib/server/http';

export type CredentialInput = {
  credential_id: string;
  auth_token: string;
  wrap_iv: string;
  wrapped_identity_key: string;
  derivation_version: number;
  crypto_version: number;
};

export type BackupInput = {
  content_version: number;
  ciphertext: string;
  content_iv: string;
  wrapped_draft_key: string;
  draft_key_iv: string;
  crypto_version: number;
};

export function validateCredentialInput(input: unknown): CredentialInput {
  if (!input || typeof input !== 'object') throw new ApiError(422, 'validation_error');
  const value = input as Record<string, unknown>;
  try {
    requireEncodedBytes(value.credential_id, 16, 'credential_id');
    requireEncodedBytes(value.auth_token, 32, 'auth_token');
    requireEncodedBytes(value.wrap_iv, 12, 'wrap_iv');
    requireEncodedBytes(value.wrapped_identity_key, 48, 'wrapped_identity_key');
  } catch {
    throw new ApiError(422, 'validation_error');
  }
  if (value.derivation_version !== 1 || value.crypto_version !== 1) throw new ApiError(422, 'validation_error');
  return value as CredentialInput;
}

export function validateLoginInput(input: unknown) {
  if (!input || typeof input !== 'object') throw new ApiError(422, 'validation_error');
  const value = input as Record<string, unknown>;
  try {
    requireEncodedBytes(value.credential_id, 16, 'credential_id');
    requireEncodedBytes(value.auth_token, 32, 'auth_token');
  } catch {
    throw new ApiError(401, 'invalid_credentials');
  }
  return { credentialId: value.credential_id as string, authToken: value.auth_token as string };
}

export function validateBackupInput(input: unknown, expectedVersion: number): BackupInput {
  if (!input || typeof input !== 'object') throw new ApiError(422, 'validation_error');
  const value = input as Record<string, unknown>;
  try {
    requireEncodedBytes(value.content_iv, 12, 'content_iv');
    requireEncodedBytes(value.wrapped_draft_key, 48, 'wrapped_draft_key');
    requireEncodedBytes(value.draft_key_iv, 12, 'draft_key_iv');
    if (typeof value.ciphertext !== 'string' || value.ciphertext.length < 22 || value.ciphertext.length > 350_000) throw new Error('ciphertext');
  } catch {
    throw new ApiError(422, 'validation_error');
  }
  if (value.crypto_version !== 1 || value.content_version !== expectedVersion + 1) throw new ApiError(422, 'invalid_content_version');
  return value as BackupInput;
}
