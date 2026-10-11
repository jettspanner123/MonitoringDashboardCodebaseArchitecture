import React, { useEffect, useRef, useState, useLayoutEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  isDestructive?: boolean;
  divider?: boolean;
  shortcut?: string;
}

export interface ContextMenuSharedComponentProps {
  isOpen: boolean;
  x: number;
  y: number;
  onClose: () => void;
  items: ContextMenuItem[];
  header?: React.ReactNode;
  minWidth?: number;
}

export default function ContextMenuSharedComponent({
  isOpen,
  x,
  y,
  onClose,
  items,
  header,
  minWidth = 190,
}: ContextMenuSharedComponentProps): React.JSX.Element {
  const menuRef = useRef<HTMLDivElement>(null);

  const calculatePosition = useCallback((posX: number, posY: number) => {
    if (typeof window === 'undefined') return { left: posX, top: posY };
    const padding = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const estimatedWidth = menuRef.current?.offsetWidth || minWidth;
    const estimatedHeight =
      menuRef.current?.offsetHeight || items.length * 36 + (header ? 40 : 0) + 16;

    let left = posX;
    let top = posY;

    // Flip left if overflowing right edge
    if (posX + estimatedWidth + padding > viewportWidth) {
      left = Math.max(padding, posX - estimatedWidth);
    }

    // Flip up if overflowing bottom edge
    if (posY + estimatedHeight + padding > viewportHeight) {
      top = Math.max(padding, posY - estimatedHeight);
    }

    // Guard bounds
    left = Math.max(padding, Math.min(left, viewportWidth - estimatedWidth - padding));
    top = Math.max(padding, Math.min(top, viewportHeight - estimatedHeight - padding));

    return { left, top };
  }, [minWidth, items.length, header]);

  const [position, setPosition] = useState<{ left: number; top: number }>(() =>
    calculatePosition(x, y)
  );

  useLayoutEffect(() => {
    if (isOpen) {
      setPosition(calculatePosition(x, y));
    }
  }, [isOpen, x, y, calculatePosition]);

  // Global dismissal listeners: click outside, window scroll, and Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleScroll = () => {
      onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          role="menu"
          aria-orientation="vertical"
          initial={{ opacity: 0, scale: 0.94, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 4 }}
          transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'fixed',
            left: `${position.left}px`,
            top: `${position.top}px`,
            minWidth: `${minWidth}px`,
            zIndex: 9999,
          }}
          className="bg-white/95 dark:bg-[#0c0c0e]/95 backdrop-blur-md border border-slate-200/90 dark:border-white/10 rounded-xl shadow-xl shadow-slate-900/10 dark:shadow-black/60 p-1.5 overflow-hidden text-xs select-none"
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Optional Menu Header */}
          {header && (
            <div className="px-2.5 py-1.5 mb-1 border-b border-slate-100 dark:border-zinc-800/80 text-[11px] font-medium text-slate-400 dark:text-zinc-500 truncate">
              {header}
            </div>
          )}

          {/* Menu Items */}
          <div className="space-y-0.5">
            {items.map((item) => (
              <React.Fragment key={item.id}>
                {item.divider && (
                  <div className="h-px bg-slate-100 dark:bg-zinc-800/80 my-1 mx-1" />
                )}
                <button
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                    item.onClick?.();
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-2.5 py-1.5 rounded-lg font-medium text-left transition-colors cursor-pointer ${
                    item.disabled
                      ? 'opacity-40 cursor-not-allowed'
                      : item.isDestructive
                      ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 active:bg-rose-100 dark:active:bg-rose-900/50'
                      : 'text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/70 active:bg-slate-200/70 dark:active:bg-zinc-700/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.icon && (
                      <span
                        className={`shrink-0 ${
                          item.isDestructive
                            ? 'text-rose-500 dark:text-rose-400'
                            : 'text-slate-400 dark:text-zinc-400'
                        }`}
                      >
                        {item.icon}
                      </span>
                    )}
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.shortcut && (
                    <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 tracking-wider">
                      {item.shortcut}
                    </span>
                  )}
                </button>
              </React.Fragment>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
