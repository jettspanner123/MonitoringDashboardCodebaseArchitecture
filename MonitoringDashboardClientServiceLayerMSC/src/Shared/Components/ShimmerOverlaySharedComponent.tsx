import React, { useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useAnimationFrame, useTransform } from 'motion/react';

export interface ShimmerOverlaySharedComponentProps {
  isLoading: boolean;
  children: React.ReactNode;
  // Full shine-sweep cycle, in seconds - matches ShimmeringTextSharedComponent's
  // own `speed` prop naming/units.
  speed?: number;
  className?: string;
}

// Same shine-sweep technique as ShimmeringTextSharedComponent, generalized to
// cover arbitrary element content instead of just text. The real content
// underneath is always rendered at its natural size - this only ever adds an
// absolutely-positioned overlay on top, so nothing it wraps ever shifts
// position or size while "loading" toggles on and off.
export default function ShimmerOverlaySharedComponent({
  isLoading,
  children,
  speed = 1.4,
  className = '',
}: ShimmerOverlaySharedComponentProps): React.JSX.Element {
  const progress = useMotionValue(0);
  const elapsedRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const durationMs = speed * 1000;

  useAnimationFrame((time) => {
    if (!isLoading) {
      lastTimeRef.current = null;
      return;
    }
    if (lastTimeRef.current === null) {
      lastTimeRef.current = time;
      return;
    }
    const delta = time - lastTimeRef.current;
    lastTimeRef.current = time;
    elapsedRef.current = (elapsedRef.current + delta) % durationMs;
    progress.set((elapsedRef.current / durationMs) * 100);
  });

  // Same mapping ShimmeringTextSharedComponent uses: p=0 -> shine off right,
  // p=100 -> shine off left, sweeping across in between.
  const backgroundPosition = useTransform(progress, (p) => `${150 - p * 2}% center`);

  return (
    <div className={`relative ${className}`}>
      {children}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-10 overflow-hidden rounded-[inherit] pointer-events-none bg-slate-100/85 dark:bg-zinc-900/85"
          >
            <motion.div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'linear-gradient(100deg, transparent 20%, rgba(255,255,255,0.65) 50%, transparent 80%)',
                backgroundSize: '200% 100%',
                backgroundPosition,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
