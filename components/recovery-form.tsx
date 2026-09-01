'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, KeyRound, LoaderCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { restoreFromRecoveryCode } from '@/lib/cloud-backup';

export function RecoveryForm() {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [restored, setRestored] = useState<number | null>(null);

  async function submit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const posts = await restoreFromRecoveryCode(code);
      setRestored(posts.length);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Those notes could not be restored.');
    } finally {
      setBusy(false);
    }
  }

  if (restored !== null) {
    return <div className="recovery-success"><ShieldCheck /><h2>{restored ? `${restored} private ${restored === 1 ? 'note' : 'notes'} restored.` : 'Recovery complete.'}</h2><p>{restored ? 'They are now stored in this browser again.' : 'This identity does not have any cloud-backed notes yet.'}</p><Link className="primary-link" href="/">Return to Emotion Center <ArrowRight /></Link></div>;
  }

  return (
    <form className="recovery-form" onSubmit={submit}>
      <span className="cloud-backup-icon"><KeyRound /></span>
      <div><p className="eyebrow mb-3">Private recovery</p><h1 className="section-title">Bring your encrypted notes back.</h1></div>
      <p className="prose-copy">The code is processed in this browser. Only an authentication derivative is sent to the server; the recovery secret and decryption key stay here.</p>
      <label className="field-label" htmlFor="recovery-code">Recovery code</label>
      <Input autoCapitalize="none" autoComplete="off" className="h-12 bg-white/70 px-4 font-mono text-sm" id="recovery-code" onChange={(event) => setCode(event.target.value)} placeholder="ecr1.…" spellCheck={false} value={code} />
      <Button className="h-12 rounded-full px-6" disabled={busy || !code.trim()} type="submit">{busy ? <LoaderCircle className="animate-spin" /> : <KeyRound />} Restore my notes</Button>
      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
    </form>
  );
}
