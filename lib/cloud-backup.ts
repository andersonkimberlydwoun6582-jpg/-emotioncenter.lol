import type { CommunityPost } from '@/lib/community-data';
import { createRecoveryBundle, createRecoveryCredential, decryptPost, encryptPost, parseRecoveryCode, verifyRecoveryCredential, type DownloadedBackup } from '@/lib/client-crypto';
import { deleteSetting, getSetting, saveLocalPosts, setSetting } from '@/lib/indexed-community';

const apiBase = '/api/v1';

export type CloudIdentity = { credentialId: string; identityKey: string };
export type DraftSync = { draftId: string; version: number; hasBackup?: boolean };
type SyncMap = Record<string, DraftSync>;
type RecoveryBundle = Awaited<ReturnType<typeof createRecoveryBundle>>;
type PendingEnrollment = RecoveryBundle & { idempotencyKey: string; createdAt: number };

export type BackupManagementState =
  | { status: 'no_backup' }
  | { status: 'locked' }
  | { status: 'ready'; identity: CloudIdentity; currentCredentialId: string };

export type RotationResult = {
  recoveryCode: string;
  oldCredentialId: string;
  oldCredentialRevoked: boolean;
  localSaveWarning: boolean;
};

async function api<T>(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    credentials: 'same-origin',
    headers,
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: { code?: string; message?: string } } | null;
    const error = new Error(payload?.error?.message ?? 'Cloud backup failed.') as Error & { code?: string; status?: number };
    error.code = payload?.error?.code;
    error.status = response.status;
    throw error;
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function enableCloudBackup() {
  const existing = await getSetting<CloudIdentity>('cloud-identity');
  if (existing) return { identity: existing, recoveryCode: null };
  const savedPending = await getSetting<PendingEnrollment>('pending-enrollment');
  const pending = savedPending && Date.now() - savedPending.createdAt < 24 * 60 * 60 * 1000
    ? savedPending
    : { ...await createRecoveryBundle(), idempotencyKey: crypto.randomUUID(), createdAt: Date.now() };
  if (!savedPending || pending !== savedPending) await setSetting('pending-enrollment', pending);
  await api('/enroll', {
    method: 'POST',
    headers: { 'Idempotency-Key': pending.idempotencyKey },
    body: JSON.stringify(pending.enrollment),
  });
  const identity = { credentialId: pending.credentialId, identityKey: pending.identityKey };
  await setSetting('cloud-identity', identity);
  await deleteSetting('pending-enrollment');
  return { identity, recoveryCode: pending.recoveryCode };
}

export async function backUpPost(post: CommunityPost, onRecoveryCode?: (code: string) => void) {
  const { identity, recoveryCode } = await enableCloudBackup();
  if (recoveryCode) onRecoveryCode?.(recoveryCode);
  const syncMap = await getSetting<SyncMap>('draft-sync') ?? {};
  let sync = syncMap[post.id];
  if (!sync) {
    const created = await api<{ id: string; version: number }>('/drafts', {
      method: 'POST',
      headers: { 'Idempotency-Key': crypto.randomUUID() },
      body: '{}',
    });
    sync = { draftId: created.id, version: created.version };
  }
  const nextVersion = sync.version + 1;
  const encrypted = await encryptPost(post, sync.draftId, nextVersion, identity.identityKey);
  const updated = await api<{ version: number }>(`/drafts/${sync.draftId}/cloud-backup`, {
    method: 'PUT',
    headers: { 'If-Match': `"${sync.version}"` },
    body: JSON.stringify(encrypted),
  });
  syncMap[post.id] = { draftId: sync.draftId, version: updated.version, hasBackup: true };
  await setSetting('draft-sync', syncMap);
  return { recoveryCode, version: updated.version };
}

export async function restoreFromRecoveryCode(recoveryCode: string) {
  const credentials = await parseRecoveryCode(recoveryCode);
  await api('/sessions', {
    method: 'POST',
    body: JSON.stringify({ credential_id: credentials.credentialId, auth_token: credentials.authToken }),
  });
  const directory = await api<{ drafts: Array<{ id: string; version: number; has_cloud_backup: boolean }> }>('/drafts');
  const encryptedDrafts = directory.drafts.filter((item) => item.has_cloud_backup);
  const recoveredDrafts = await Promise.all(encryptedDrafts.map(async (draft) => {
    const backup = await api<DownloadedBackup>(`/drafts/${draft.id}/cloud-backup`);
    const recovered = await decryptPost(backup, draft.id, credentials.credentialId, credentials.wrapKey);
    return { draft, recovered };
  }));
  const posts: CommunityPost[] = [];
  const syncMap: SyncMap = {};
  let identityKey = '';
  for (const { draft, recovered } of recoveredDrafts) {
    posts.push(recovered.post);
    identityKey ||= recovered.identityKey;
    syncMap[recovered.post.id] = { draftId: draft.id, version: draft.version, hasBackup: true };
  }
  await saveLocalPosts(posts);
  await setSetting('draft-sync', syncMap);
  if (identityKey) await setSetting<CloudIdentity>('cloud-identity', { credentialId: credentials.credentialId, identityKey });
  return posts;
}

export async function cloudStatusFor(postId: string) {
  const syncMap = await getSetting<SyncMap>('draft-sync') ?? {};
  const sync = syncMap[postId];
  return sync?.hasBackup === false ? null : sync ?? null;
}

export async function deleteCloudBackup(postId: string) {
  const syncMap = await getSetting<SyncMap>('draft-sync') ?? {};
  const sync = syncMap[postId];
  if (!sync) return;
  await api(`/drafts/${sync.draftId}/cloud-backup`, {
    method: 'DELETE',
    headers: { 'If-Match': `"${sync.version}"` },
  });
  syncMap[postId] = { ...sync, version: sync.version + 1, hasBackup: false };
  await setSetting('draft-sync', syncMap);
}

export async function deleteDraftEverywhere(postId: string) {
  const syncMap = await getSetting<SyncMap>('draft-sync') ?? {};
  const sync = syncMap[postId];
  if (!sync) return;
  await api(`/drafts/${sync.draftId}`, {
    method: 'DELETE',
    headers: { 'If-Match': `"${sync.version}"` },
  });
  delete syncMap[postId];
  await setSetting('draft-sync', syncMap);
}

export async function getBackupManagementState(): Promise<BackupManagementState> {
  const syncMap = await getSetting<SyncMap>('draft-sync') ?? {};
  if (!Object.values(syncMap).some((sync) => sync.hasBackup !== false)) return { status: 'no_backup' };
  const identity = await getSetting<CloudIdentity>('cloud-identity');
  if (!identity?.identityKey) return { status: 'locked' };
  try {
    const session = await api<{ credential_id: string }>('/sessions/current');
    return { status: 'ready', identity, currentCredentialId: session.credential_id };
  } catch (error) {
    if ((error as Error & { code?: string }).code === 'session_expired') return { status: 'locked' };
    throw error;
  }
}

export async function rotateRecoveryCode(): Promise<RotationResult> {
  const state = await getBackupManagementState();
  if (state.status !== 'ready') throw new Error(state.status === 'no_backup' ? 'Create an encrypted backup first.' : 'Restore with your recovery code to unlock this backup first.');

  const next = await createRecoveryCredential(state.identity.identityKey);
  let uploaded = false;
  try {
    await api('/recovery-credentials', { method: 'POST', body: JSON.stringify(next.enrollment) });
    uploaded = true;
    const readBack = await api<{ credential_id: string; wrap_iv: string; wrapped_identity_key: string }>(`/recovery-credentials/${next.credentialId}`);
    const verified = readBack.credential_id === next.credentialId
      && await verifyRecoveryCredential(state.identity.identityKey, next.credentialId, next.wrapKey, readBack);
    if (!verified) throw new Error('The uploaded recovery key did not pass verification. Your current recovery code still works.');
    await api('/sessions', {
      method: 'POST',
      body: JSON.stringify({ credential_id: next.credentialId, auth_token: next.enrollment.auth_token }),
    });
  } catch (error) {
    if (uploaded) {
      try {
        await api(`/recovery-credentials/${next.credentialId}`, { method: 'DELETE' });
      } catch {
        // The current credential remains valid even if best-effort cleanup cannot remove the unused new credential.
      }
    }
    throw error;
  }

  let localSaveWarning = false;
  try {
    await setSetting<CloudIdentity>('cloud-identity', { credentialId: next.credentialId, identityKey: state.identity.identityKey });
  } catch {
    localSaveWarning = true;
  }

  let oldCredentialRevoked = false;
  try {
    await revokeRecoveryCredential(state.currentCredentialId);
    oldCredentialRevoked = true;
  } catch {
    // Keep both credentials active: the new code works, and the old code remains a fallback until retry succeeds.
  }
  return {
    recoveryCode: next.recoveryCode,
    oldCredentialId: state.currentCredentialId,
    oldCredentialRevoked,
    localSaveWarning,
  };
}

export async function revokeRecoveryCredential(credentialId: string) {
  await api(`/recovery-credentials/${credentialId}/revoke`, { method: 'POST', body: '{}' });
}
