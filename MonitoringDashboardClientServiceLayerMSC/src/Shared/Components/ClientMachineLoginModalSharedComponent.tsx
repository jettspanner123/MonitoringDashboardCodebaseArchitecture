import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import ModalSharedComponent from './ModalSharedComponent';
import ButtonSharedComponent from './ButtonSharedComponent';
import ClientMachineAuthService from '../../Services/ClientMachineAuthService';
import ClientMachineTokenStorageUtility from '../../Utilities/ClientMachineTokenStorageUtility';

export interface ClientMachineLoginModalSharedComponentProps {
  isOpen: boolean;
  onClose: () => void;
  // Fires only once the real net use credential check has succeeded and
  // tokens are already stored - the caller just needs to proceed with
  // whatever navigation was waiting on this (PRD section 3a).
  onSuccess: () => void;
}

export default function ClientMachineLoginModalSharedComponent({
  isOpen,
  onClose,
  onSuccess,
}: ClientMachineLoginModalSharedComponentProps): React.JSX.Element {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClose = (): void => {
    setErrorMessage(null);
    setPassword('');
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const tokens = await ClientMachineAuthService.current.login(username, password);
      ClientMachineTokenStorageUtility.current.setTokens(tokens);
      setPassword('');
      onSuccess();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not log in with those credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalSharedComponent
      isOpen={isOpen}
      onClose={handleClose}
      title="Client Machines Login"
      subtitle="Enter the daily VM credentials to continue"
      maxWidth="sm"
    >
      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-600 dark:text-zinc-400">Username</label>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="hostname\accountname"
            autoFocus
            required
            className="w-full h-10 px-3 text-sm rounded-lg bg-slate-50 dark:bg-[#0a0a0c] text-slate-900 dark:text-zinc-100 border border-slate-200/80 dark:border-zinc-800 focus:outline-none focus:border-zinc-900 dark:focus:border-white transition-colors font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-600 dark:text-zinc-400">Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Today's password"
            required
            className="w-full h-10 px-3 text-sm rounded-lg bg-slate-50 dark:bg-[#0a0a0c] text-slate-900 dark:text-zinc-100 border border-slate-200/80 dark:border-zinc-800 focus:outline-none focus:border-zinc-900 dark:focus:border-white transition-colors font-mono"
          />
        </div>

        {errorMessage && (
          <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-lg px-3 py-2">
            {errorMessage}
          </p>
        )}

        <ButtonSharedComponent
          type="submit"
          variant="primary"
          fullWidth
          isLoading={isSubmitting}
          disabled={isSubmitting}
          icon={<Lock className="w-3.5 h-3.5" />}
        >
          Log In
        </ButtonSharedComponent>
      </form>
    </ModalSharedComponent>
  );
}
