import React, { useRef } from 'react';
import SegmentedControlSharedComponent, { type SegmentedControlOption } from './SegmentedControlSharedComponent';
import ApplicationThemeUtility from '../../Utilities/ApplicationThemeUtility';

export interface ControllBlockSharedComponentProps<T extends string> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: SegmentedControlOption<T>[];
  layoutId: string;
  // Plays the same circle-wipe transition the theme toggle uses, originating
  // from whichever option button was actually clicked. Set false for a
  // future control that shouldn't have that flourish.
  animatedTransition?: boolean;
}

// A labeled preference block: an icon (mirroring whichever option is
// currently active) + label above a SegmentedControlSharedComponent pill.
// Used by every toggle in the profile dropdown's Preferences & Controls
// section (Theme Mode, Gradient Backgrounds, ...) so they all share one
// pill implementation instead of each hand-rolling its own.
export default function ControllBlockSharedComponent<T extends string>({
  label,
  value,
  onChange,
  options,
  layoutId,
  animatedTransition = true,
}: ControllBlockSharedComponentProps<T>): React.JSX.Element {
  const clickedElementRef = useRef<HTMLElement | null>(null);
  const activeOption = options.find((option) => option.value === value);

  const handleCaptureClick = (event: React.MouseEvent<HTMLDivElement>): void => {
    clickedElementRef.current = (event.target as HTMLElement).closest('button');
  };

  const handleChange = (nextValue: T): void => {
    if (nextValue === value) return;
    if (animatedTransition) {
      ApplicationThemeUtility.current.executeAnimatedThemeToggle(clickedElementRef.current, () => onChange(nextValue));
    } else {
      onChange(nextValue);
    }
  };

  return (
    <div className="space-y-2 p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800/80">
      <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-200 font-medium">
        {activeOption?.icon}
        <span className="font-semibold text-xs">{label}</span>
      </div>

      <div onClickCapture={handleCaptureClick}>
        <SegmentedControlSharedComponent
          value={value}
          onChange={handleChange}
          options={options}
          layoutId={layoutId}
          alwaysFullWidth
          hapticFeedback
          activeTextClassName="text-slate-900 dark:text-white font-bold"
          inactiveTextClassName="text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
        />
      </div>
    </div>
  );
}
