import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Sun, Moon, LogOut, Trash2, AlertTriangle } from 'lucide-react';
import ApplicationThemeCON from '../../../../Constants/ApplicationThemeCON';
import ApplicationThemeUtility from '../../../../Utilities/ApplicationThemeUtility';
import ApplicationHapticsUtility from '../../../../Utilities/ApplicationHapticsUtility';
import ConfirmationModalSharedComponent from '../../../../Shared/Components/ConfirmationModalSharedComponent';
import DataManagementService from '../../../../Services/DataManagementService';
import NavigationCON from '../../Constants/NavigationCON';

export interface ProfileDropdownStaticComponentProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: string;
  onToggleTheme: () => void;
}

export default function ProfileDropdownStaticComponent({
  isOpen,
  onClose,
  currentTheme,
  onToggleTheme,
}: ProfileDropdownStaticComponentProps): React.JSX.Element {
  const isDark = currentTheme === ApplicationThemeCON.DARK;
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = React.useState<boolean>(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = React.useState<boolean>(false);
  const [deleteAllConfirmInput, setDeleteAllConfirmInput] = React.useState<string>('');
  const [isDeletingAllData, setIsDeletingAllData] = React.useState<boolean>(false);
  const [deleteAllError, setDeleteAllError] = React.useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handlePointerDown);
      document.addEventListener('touchstart', handlePointerDown);
    }, 10);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isOpen, onClose]);

  const handleInitiateSignOut = () => {
    onClose();
    setIsSignOutModalOpen(true);
  };

  const handleConfirmSignOut = () => {
    setIsSignOutModalOpen(false);
  };

  const handleInitiateDeleteAllData = () => {
    onClose();
    setDeleteAllConfirmInput('');
    setDeleteAllError(null);
    setIsDeleteAllModalOpen(true);
  };

  const handleCloseDeleteAllModal = () => {
    if (isDeletingAllData) return;
    setIsDeleteAllModalOpen(false);
    setDeleteAllConfirmInput('');
    setDeleteAllError(null);
  };

  const handleConfirmDeleteAllData = async () => {
    setIsDeletingAllData(true);
    setDeleteAllError(null);
    try {
      await DataManagementService.current.wipeAllData();
      // Full reload so every part of the app (nav included) reflects the now-
      // empty database, not just whatever's currently mounted under here.
      window.location.reload();
    } catch (error) {
      setDeleteAllError(error instanceof Error ? error.message : 'Failed to delete all data.');
      setIsDeletingAllData(false);
    }
  };

  return (
    <React.Fragment>
      <AnimatePresence>
        {isOpen && (
          <React.Fragment>
            {/* Full Screen Transparent Backdrop Overlay */}
            <div
              onClick={onClose}
              className="fixed inset-0 z-40 bg-transparent cursor-default pointer-events-auto"
            />

            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, scale: 0.96, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -6 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-x-3 top-20 sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-80 z-50 bg-white dark:bg-[#0c0c0e] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-4 text-xs select-none space-y-4"
            >
              {/* 1. Header: User Identity */}
              <div className="flex items-center gap-3 pb-3.5 border-b border-slate-100 dark:border-zinc-800/80">
                <div className="w-10 h-10 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center font-bold font-serif-headline text-sm shadow-xs shrink-0">
                  {NavigationCON.PROFILE_INITIALS}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-slate-900 dark:text-white font-serif-headline text-sm truncate leading-tight">
                    {NavigationCON.PROFILE_DISPLAY_NAME}
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500 truncate mt-0.5 font-mono">
                    {NavigationCON.PROFILE_DISPLAY_ROLE}
                  </p>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-zinc-400 font-mono mt-0.5 truncate">
                    <Mail className="w-3 h-3 shrink-0 text-slate-400" />
                    <span className="truncate">{NavigationCON.PROFILE_DISPLAY_EMAIL}</span>
                  </div>
                </div>
              </div>

              {/* 2. Preferences & Controls */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-mono font-semibold tracking-wider text-slate-400 dark:text-zinc-500 block px-1">
                  Preferences & Controls
                </span>

                {/* Theme Mode Control Block */}
                <div className="space-y-2 p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800/80">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-200 font-medium">
                    {isDark ? (
                      <Moon className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                      <Sun className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className="font-semibold text-xs">Theme Mode</span>
                  </div>

                  <div className="flex items-center p-1 rounded-xl bg-slate-200/80 dark:bg-zinc-800 border border-slate-300/60 dark:border-zinc-700/60 h-11 sm:h-9 w-full">
                    <button
                      type="button"
                      onPointerDown={() => ApplicationHapticsUtility.current.triggerHapticFeedback(12)}
                      onClick={(e) =>
                        isDark &&
                        ApplicationThemeUtility.current.executeAnimatedThemeToggle(e.currentTarget, onToggleTheme)
                      }
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1 h-9 sm:h-7 rounded-lg sm:rounded-md text-xs font-bold transition-all cursor-pointer ${
                        !isDark
                          ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5" />
                      <span>Light Mode</span>
                    </button>
                    <button
                      type="button"
                      onPointerDown={() => ApplicationHapticsUtility.current.triggerHapticFeedback(12)}
                      onClick={(e) =>
                        !isDark &&
                        ApplicationThemeUtility.current.executeAnimatedThemeToggle(e.currentTarget, onToggleTheme)
                      }
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1 h-9 sm:h-7 rounded-lg sm:rounded-md text-xs font-bold transition-all cursor-pointer ${
                        isDark
                          ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5" />
                      <span>Dark Mode</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Footer: Destructive Actions + Sign Out */}
              <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 space-y-0.5">
                <button
                  type="button"
                  onPointerDown={() => ApplicationHapticsUtility.current.triggerHapticFeedback(12)}
                  onClick={handleInitiateDeleteAllData}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer font-bold text-xs"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete All Data</span>
                </button>
                <button
                  type="button"
                  onPointerDown={() => ApplicationHapticsUtility.current.triggerHapticFeedback(12)}
                  onClick={handleInitiateSignOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer font-bold text-xs"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </React.Fragment>
        )}
      </AnimatePresence>

      <ConfirmationModalSharedComponent
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        onConfirm={handleConfirmSignOut}
        title={NavigationCON.SIGN_OUT_TITLE}
        subtitle={NavigationCON.SIGN_OUT_SUBTITLE}
        description={NavigationCON.SIGN_OUT_DESCRIPTION}
        confirmText="Sign Out"
        cancelText="Cancel"
        variant="danger"
        maxWidth="md"
      />

      <ConfirmationModalSharedComponent
        isOpen={isDeleteAllModalOpen}
        onClose={handleCloseDeleteAllModal}
        onConfirm={handleConfirmDeleteAllData}
        title={NavigationCON.DELETE_ALL_DATA_TITLE}
        subtitle={NavigationCON.DELETE_ALL_DATA_SUBTITLE}
        description={NavigationCON.DELETE_ALL_DATA_DESCRIPTION}
        confirmText="Delete Everything"
        cancelText="Cancel"
        variant="danger"
        maxWidth="md"
        isLoading={isDeletingAllData}
        confirmDisabled={deleteAllConfirmInput.trim() !== NavigationCON.DELETE_ALL_DATA_CONFIRM_PHRASE}
        additionalContent={
          <div className="space-y-2.5">
            <div>
              <span className="text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5 block">
                Type <span className="font-mono font-bold text-slate-900 dark:text-zinc-100">
                  {NavigationCON.DELETE_ALL_DATA_CONFIRM_PHRASE}
                </span> to confirm
              </span>
              <input
                type="text"
                value={deleteAllConfirmInput}
                onChange={(e) => setDeleteAllConfirmInput(e.target.value)}
                disabled={isDeletingAllData}
                placeholder={NavigationCON.DELETE_ALL_DATA_CONFIRM_PHRASE}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                className="w-full h-10 px-3 text-sm font-mono rounded-lg bg-slate-50 dark:bg-[#08080a] text-slate-900 dark:text-zinc-100 placeholder:text-slate-300 dark:placeholder:text-zinc-700 border border-slate-300 dark:border-zinc-800 focus:outline-none focus:border-rose-500 dark:focus:border-rose-500 transition-colors disabled:opacity-60"
              />
            </div>
            {deleteAllError && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{deleteAllError}</span>
              </div>
            )}
          </div>
        }
      />
    </React.Fragment>
  );
}
