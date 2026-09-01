'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Cloud, CloudOff, Copy, KeyRound, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CommunityPost } from '@/lib/community-data';
import { backUpPost, cloudStatusFor, deleteCloudBackup } from '@/lib/cloud-backup';

export function CloudBackupPanel({ post }: { post: CommunityPost }) {
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState<number | null>(null);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void cloudStatusFor(post.id).then((status) => setVersion(status?.version ?? null));
  }, [post.id]);

  async function backup() {
    setBusy(true);
    setError('');
    try {
      const result = await backUpPost(post, setRecoveryCode);
      setVersion(result.version);
      if (result.recoveryCode) setRecoveryCode(result.recoveryCode);
    } catch (caught) {
      const cloudError = caught as Error & { code?: string };
      setError(cloudError.code === 'session_expired' ? 'Your private session expired. Restore with your recovery code, then try again.' : cloudError.message);
    } finally {
      setBusy(false);
    }
  }

  async function copyCode() {
    if (!recoveryCode) return;
    await navigator.clipboard.writeText(recoveryCode);
    setCopied(true);
  }

  async function removeBackup() {
    if (!window.confirm('Delete only the encrypted cloud copy? Your local note will stay in this browser.')) return;
    setBusy(true);
    setError('');
    try {
      await deleteCloudBackup(post.id);
      setVersion(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The cloud copy could not be deleted.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="cloud-backup-panel" aria-label="Private cloud backup">
      <div className="cloud-backup-heading">
        <span className="cloud-backup-icon">{version ? <Check /> : <Cloud />}</span>
        <div>
          <p className="eyebrow">Optional · encrypted before upload</p>
          <h2>{version ? 'This note has a private cloud copy.' : 'Keep this note if this browser is cleared.'}</h2>
        </div>
      </div>
      <p className="cloud-backup-copy">Your title and words are encrypted in this browser. Emotion Center stores ciphertext and cannot read the note.</p>
      <div className="cloud-backup-actions">
        <Button className="rounded-full" disabled={busy} onClick={backup} type="button">
          {busy ? <LoaderCircle className="animate-spin" /> : <Cloud />}
          {version ? 'Update encrypted copy' : 'Create encrypted backup'}
        </Button>
        {version && <Button className="rounded-full" disabled={busy} onClick={removeBackup} type="button" variant="ghost"><CloudOff /> Delete cloud copy</Button>}
        <Link className="recovery-link" href="/recover"><KeyRound /> Restore on another device</Link>
      </div>
      {recoveryCode && (
        <output className="recovery-code-box">
          <strong>Save this recovery code now.</strong>
          <p>It is shown only this time. Anyone with it can restore your encrypted notes.</p>
          <code>{recoveryCode}</code>
          <Button className="rounded-full" onClick={copyCode} type="button" variant="outline"><Copy /> {copied ? 'Copied' : 'Copy recovery code'}</Button>
        </output>
      )}
      {version && !recoveryCode && <p className="cloud-success"><Check /> Encrypted copy saved · version {version}</p>}
      {error && <p className="text-sm text-red-700" role="alert">{error} <Link className="underline" href="/recover">Open recovery</Link></p>}
    </aside>
  );
}
