'use client';

import { AlertTriangle, Check, Cloud, Copy, KeyRound, LoaderCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getBackupManagementState, revokeRecoveryCredential, rotateRecoveryCode, type BackupManagementState, type RotationResult } from '@/lib/cloud-backup';

type Phase = 'confirm' | 'rotating' | 'success' | 'error';

export function BackupManager({ firstNoteHref }: { firstNoteHref?: string }) {
  const [management, setManagement] = useState<BackupManagementState | null>(null);
  const [loadError, setLoadError] = useState('');
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('confirm');
  const [rotation, setRotation] = useState<RotationResult | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    void getBackupManagementState()
      .then(setManagement)
      .catch((caught) => setLoadError(caught instanceof Error ? caught.message : 'Backup status is unavailable.'));
  }, []);

  function startRotation() {
    setPhase('confirm');
    setRotation(null);
    setError('');
    setCopied(false);
    setOpen(true);
  }

  function closeRotation() {
    if (phase === 'rotating') return;
    setOpen(false);
    setRotation(null);
    setCopied(false);
    setError('');
    setPhase('confirm');
  }

  async function rotate() {
    setPhase('rotating');
    setError('');
    try {
      const result = await rotateRecoveryCode();
      setRotation(result);
      setPhase('success');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The recovery code could not be changed. Your current code still works.');
      setPhase('error');
    }
  }

  async function copyCode() {
    if (!rotation) return;
    await navigator.clipboard.writeText(rotation.recoveryCode);
    setCopied(true);
  }

  async function retryRevocation() {
    if (!rotation) return;
    setRevoking(true);
    setError('');
    try {
      await revokeRecoveryCredential(rotation.oldCredentialId);
      setRotation({ ...rotation, oldCredentialRevoked: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The old code is still active. Your new code already works; try revoking the old one again.');
    } finally {
      setRevoking(false);
    }
  }

  return (
    <section className="backup-manager" aria-label="Encrypted backup management">
      <div className="backup-manager-copy">
        <span className="backup-manager-icon"><KeyRound aria-hidden="true" /></span>
        <div>
          <p className="eyebrow">Encrypted backup</p>
          <h2>Manage recovery access</h2>
          <p>Change the recovery code without re-encrypting your private notes.</p>
        </div>
      </div>

      {!management && !loadError ? <span className="backup-manager-status"><LoaderCircle className="animate-spin" /> Checking backup…</span> : null}
      {loadError ? <p className="backup-manager-error" role="alert">{loadError}</p> : null}
      {management?.status === 'no_backup' ? (
        <Link className="backup-manager-link" href={firstNoteHref ?? '/vent#write'}><Cloud /> Create encrypted backup</Link>
      ) : null}
      {management?.status === 'locked' ? (
        <div className="backup-manager-locked">
          <Button className="rounded-full" disabled type="button"><KeyRound /> Unlock to rotate recovery code</Button>
          <Link href="/recover">Open recovery</Link>
        </div>
      ) : null}
      {management?.status === 'ready' ? (
        <Button className="rounded-full" onClick={startRotation} type="button"><RefreshCw /> Generate new recovery code</Button>
      ) : null}

      <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) closeRotation(); }}>
        <DialogContent className="recovery-rotation-dialog sm:max-w-lg" overlayClassName="bg-[#17211e]/55" showCloseButton={phase !== 'rotating' && phase !== 'success'}>
          {phase === 'confirm' ? (
            <>
              <DialogHeader>
                <DialogTitle>Generate a new recovery code?</DialogTitle>
                <DialogDescription>This will invalidate your current recovery code. Your notes stay encrypted. You&apos;ll get a new code to keep safe. Emotion Center never stores your code.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={closeRotation} type="button" variant="outline">Cancel</Button>
                <Button onClick={rotate} type="button">Continue</Button>
              </DialogFooter>
            </>
          ) : null}

          {phase === 'rotating' ? (
            <div className="recovery-rotation-progress" aria-live="polite">
              <LoaderCircle className="animate-spin" />
              <DialogTitle>Re-encrypting your backup key…</DialogTitle>
              <DialogDescription>Your notes are not being changed. Keep this window open for a moment.</DialogDescription>
            </div>
          ) : null}

          {phase === 'error' ? (
            <>
              <DialogHeader>
                <AlertTriangle className="recovery-rotation-alert" />
                <DialogTitle>The recovery code was not changed.</DialogTitle>
                <DialogDescription>{error || 'Your current recovery code still works. Please try again.'}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={closeRotation} type="button" variant="outline">Close</Button>
                <Button onClick={rotate} type="button"><RefreshCw /> Try again</Button>
              </DialogFooter>
            </>
          ) : null}

          {phase === 'success' && rotation ? (
            <>
              <DialogHeader>
                <Check className="recovery-rotation-check" />
                <DialogTitle>Your new recovery code is ready.</DialogTitle>
                <DialogDescription className="recovery-code-warning">This is the only time you&apos;ll see this code. Save it now.</DialogDescription>
              </DialogHeader>
              <code className="recovery-rotation-code">{rotation.recoveryCode}</code>
              <Button className="recovery-copy-button" onClick={copyCode} type="button" variant="outline"><Copy /> {copied ? 'Copied' : 'Copy recovery code'}</Button>
              {!rotation.oldCredentialRevoked ? (
                <div className="recovery-revoke-warning" role="alert">
                  <AlertTriangle />
                  <div><strong>Your new code works, but the old code is still active.</strong><p>Nothing is locked. Retry to finish invalidating the old code.</p></div>
                  <Button disabled={revoking} onClick={retryRevocation} type="button" variant="outline">{revoking ? <LoaderCircle className="animate-spin" /> : <RefreshCw />} Retry revocation</Button>
                </div>
              ) : <p className="cloud-success"><Check /> The previous recovery code is now invalid.</p>}
              {rotation.localSaveWarning ? <p className="backup-manager-error" role="alert">The new code works, but this browser could not update its local backup status. Keep the new code safe and restore with it before your next backup.</p> : null}
              {error ? <p className="backup-manager-error" role="alert">{error}</p> : null}
              <DialogFooter>
                <Button onClick={closeRotation} type="button">I&apos;ve saved it</Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
