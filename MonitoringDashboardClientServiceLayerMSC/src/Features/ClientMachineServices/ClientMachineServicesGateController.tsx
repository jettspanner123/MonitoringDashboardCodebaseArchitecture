import React, { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import ClientMachineLoginModalSharedComponent from '../../Shared/Components/ClientMachineLoginModalSharedComponent';
import ClientMachineServicesScreenController from './ClientMachineServicesScreenController';
import ClientMachineAuthService from '../../Services/ClientMachineAuthService';
import ClientMachineTokenStorageUtility from '../../Utilities/ClientMachineTokenStorageUtility';
import ApplicationRouteCON from '../../Constants/ApplicationRouteCON';

type ClientMachineGateStatus = 'checking' | 'authenticated' | 'needs-login';

// Guards the Client Machines page itself (not just the nav click) - covers
// both "clicked the nav item" and "opened/refreshed a bookmarked
// ?app=client-machines URL directly". On mount, silently re-validates any
// stored session against the real VM login (PRD section 3a, step 5); only
// shows the login modal when there's no valid session left.
export default function ClientMachineServicesGateController(): React.JSX.Element {
  const navigate = useNavigate();
  const [status, setStatus] = useState<ClientMachineGateStatus>('checking');

  useEffect(() => {
    let isCancelled = false;

    const verify = async (): Promise<void> => {
      const tokens = ClientMachineTokenStorageUtility.current.getTokens();
      if (!tokens) {
        if (!isCancelled) setStatus('needs-login');
        return;
      }

      try {
        const refreshed = await ClientMachineAuthService.current.refresh(tokens.refreshToken);
        ClientMachineTokenStorageUtility.current.setTokens(refreshed);
        if (!isCancelled) setStatus('authenticated');
      } catch {
        ClientMachineTokenStorageUtility.current.clearTokens();
        if (!isCancelled) setStatus('needs-login');
      }
    };

    void verify();
    return () => {
      isCancelled = true;
    };
  }, []);

  const handleLoginCancelled = (): void => {
    // No valid session and the user backed out of logging in - there's
    // nothing sensible to show on this page, so return to the default view
    // rather than leaving them stuck looking at an empty gate.
    navigate({
      to: '.',
      search: (prev) => ({ ...prev, [ApplicationRouteCON.PARAM_APP]: undefined }),
    });
  };

  if (status === 'checking') {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 rounded-full border-2 border-slate-300 dark:border-zinc-700 border-t-slate-900 dark:border-t-zinc-100 animate-spin" />
      </div>
    );
  }

  if (status === 'needs-login') {
    return (
      <>
        <div className="flex items-center justify-center py-24 text-sm text-slate-400 dark:text-zinc-500">
          Log in to view Client Machines.
        </div>
        <ClientMachineLoginModalSharedComponent
          isOpen
          onClose={handleLoginCancelled}
          onSuccess={() => setStatus('authenticated')}
        />
      </>
    );
  }

  return <ClientMachineServicesScreenController />;
}
