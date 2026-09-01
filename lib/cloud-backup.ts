import type { CommunityPost } from '@/lib/community-data';
import { createRecoveryBundle, decryptPost, encryptPost, parseRecoveryCode, type DownloadedBackup } from '@/lib/client-crypto';
import { deleteSetting, getSetting, saveLocalPosts, setSetting } from '@/lib/indexed-community';

const apiBase = '/api/v1';

export type CloudIdentity = { credentialId: string; identityKey: string };
export type DraftSync = { draftId: string; version: number; hasBackup?: boolean };
type SyncMap = Record<string, DraftSync>;
type RecoveryBundle = Awaited<ReturnType<typeof createRecoveryBundle>>;
type PendingEnrollment = RecoveryBundle & { idempotencyKey: string; createdAt: number };

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
