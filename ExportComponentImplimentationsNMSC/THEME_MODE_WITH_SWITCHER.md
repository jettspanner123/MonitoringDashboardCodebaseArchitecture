# Theme Mode With Switcher

A fully self-contained build recipe for a dark/light theme system with an animated toggle, in a Vite + React 19 + TypeScript + Tailwind v4 project. This is a faithful port of the pattern already shipped identically in the AssetSphere and SignForge codebases — nothing here is invented; every value and every line of logic below is copied from that real, working implementation. Follow this file with no other reference and you will reproduce the same system.

## What you get

- A theme that defaults to **dark**, persisted per-tab (`sessionStorage`) with a cross-tab bootstrap fallback (`localStorage`).
- A complete light/dark color token set, applied via a single `.dark` class on `<html>`/`<body>`, consumed through Tailwind v4's dark variant.
- Three toggle UI components (AssetSphere/SignForge ship all three; which one you use is a per-screen choice, not a hierarchy):
  1. **`ThemeToggleSharedComponent`** — a standalone icon button, usable anywhere (nav bar, a bare test page, etc). No animation wired by default.
  2. **`ThemeModeSegmentedToggleSharedComponent`** — a full-width two-segment Light/Dark pill, animated via `executeAnimatedThemeToggle`. This is the variant used on the **login, signup, and forgot-password pages** in both AssetSphere and SignForge — in those real codebases it's copy-pasted inline on each screen rather than extracted; this recipe extracts it into one reusable component instead, since duplication isn't a requirement of the pattern, just an artifact of how it was originally written. **This is the variant currently live-mounted in this repo's test page (`RootViewController.tsx`).**
  3. **`ProfileDropdownStaticComponent`**-hosted segmented pill toggle — a visually similar but distinct "Theme Mode" labeled switch (different background shade, different label text, different sizing) that lives inside a profile/account dropdown menu specifically. Not built live in this repo yet (no profile/dropdown UI exists here) — documented for when one does.
- A shared animated-toggle mechanism using the View Transitions API: clicking the toggle expands a circular reveal from the clicked point across the whole page, with a graceful instant-switch fallback in browsers that don't support `document.startViewTransition`.
- AssetSphere additionally has a fourth variant upstream, `AnimatedThemeToggleSharedComponent` — a single icon button with a self-contained, configurable animation (`variant`: circle/square/triangle/diamond/hexagon/rectangle/star), independent of `ApplicationThemeUtility`. Noted here for completeness; not ported into this project since it wasn't requested.

## 1. Install dependencies

```bash
npm install tailwindcss@^4.1.14 @tailwindcss/vite@^4.1.14 lucide-react@^0.546.0 motion@^12.23.24
```

## 2. Wire Tailwind v4 into Vite

`vite.config.ts`:

```typescript
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

## 3. File placement

Following the project's `*CON` (constants) / `*Utility` (singleton helper) / `*SharedComponent` (global shared component) conventions:

```
src/Constants/ApplicationThemeCON.ts
src/Constants/ColorFactoryCON.ts
src/Utilities/ApplicationThemeUtility.ts
src/Shared/Components/ThemeToggleSharedComponent.tsx
src/index.css                                          (theme tokens added here)
src/Features/Navigation/Components/static/ProfileDropdownStaticComponent.tsx   (if/when a profile menu exists)
```

`src/Shared/Components/` is the correct location for a component that isn't tied to any one feature — confirmed against AssetSphere/SignForge's real folder structure, not `src/Components/Shared/`.

## 4. Constants

`src/Constants/ApplicationThemeCON.ts`:

```typescript
export default class ApplicationThemeCON {
  public static readonly LIGHT: string = 'light';
  public static readonly DARK: string = 'dark';
}
```

`src/Constants/ColorFactoryCON.ts` — raw JS-accessible color values (for anywhere outside CSS that needs a literal color string, e.g. inline SVG fills or canvas drawing):

```typescript
export default class ColorFactoryCON {
  // Theme-aware tokens
  public static readonly CANVAS_LIGHT: string = '#ffffff';
  public static readonly CANVAS_DARK: string = '#000000';

  public static readonly SURFACE_CARD_LIGHT: string = '#f8fafc';
  public static readonly SURFACE_CARD_DARK: string = '#0a0a0c';

  public static readonly SURFACE_ELEVATED_LIGHT: string = '#f1f5f9';
  public static readonly SURFACE_ELEVATED_DARK: string = '#101012';

  public static readonly SURFACE_DEEP_LIGHT: string = '#f8fafc';
  public static readonly SURFACE_DEEP_DARK: string = '#06060a';

  public static readonly HAIRLINE_LIGHT: string = 'rgba(0, 0, 0, 0.08)';
  public static readonly HAIRLINE_DARK: string = 'rgba(255, 255, 255, 0.06)';

  public static readonly HAIRLINE_STRONG_LIGHT: string = 'rgba(0, 0, 0, 0.16)';
  public static readonly HAIRLINE_STRONG_DARK: string = 'rgba(255, 255, 255, 0.14)';

  public static readonly INK_LIGHT: string = '#09090b';
  public static readonly INK_DARK: string = '#fcfdff';

  public static readonly BODY_LIGHT: string = '#334155';
  public static readonly BODY_DARK: string = 'rgba(252, 253, 255, 0.86)';

  public static readonly MUTE_LIGHT: string = '#64748b';
  public static readonly MUTE_DARK: string = '#a1a4a5';
}
```

## 5. CSS custom properties

Add to the top of `src/index.css` (adjust/merge with whatever else already lives in that file):

```css
@import "tailwindcss";

@variant dark (&:where(.dark, .dark *));

:root {
  --color-canvas: #ffffff;
  --color-surface-card: #f8fafc;
  --color-surface-elevated: #f1f5f9;
  --color-surface-deep: #f8fafc;
  --color-hairline: rgba(0, 0, 0, 0.08);
  --color-hairline-strong: rgba(0, 0, 0, 0.16);
  --color-ink: #09090b;
  --color-body: #334155;
  --color-mute: #64748b;
}

.dark {
  --color-canvas: #000000;
  --color-surface-card: #0a0a0c;
  --color-surface-elevated: #101012;
  --color-surface-deep: #06060a;
  --color-hairline: rgba(255, 255, 255, 0.06);
  --color-hairline-strong: rgba(255, 255, 255, 0.14);
  --color-ink: #fcfdff;
  --color-body: rgba(252, 253, 255, 0.86);
  --color-mute: #a1a4a5;
}

@layer base {
  html, body {
    background-color: var(--color-canvas);
    color: var(--color-ink);
    transition: background-color 0.25s cubic-bezier(0.16, 1, 0.3, 1), color 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }
}

.hairline-border {
  border: 1px solid var(--color-hairline);
}

.hairline-border-strong {
  border: 1px solid var(--color-hairline-strong);
}
```

Use tokens in markup either via Tailwind's arbitrary-value syntax (`className="bg-(--color-canvas) text-(--color-ink)"`) or via plain Tailwind dark-variant utility classes (`bg-white dark:bg-black`) — both coexist in the real codebase; the CSS variables are the single source of truth either way.

## 6. The persistence + toggle engine

`src/Utilities/ApplicationThemeUtility.ts` — a singleton (per this project's convention: `ClassName.current`), no external state library required:

```typescript
import ApplicationThemeCON from '../Constants/ApplicationThemeCON';

export default class ApplicationThemeUtility {
  public static current: ApplicationThemeUtility = new ApplicationThemeUtility();

  private themeKey: string = 'monitoring_dashboard_theme_preference';

  public getSavedTheme(): string {
    if (typeof window !== 'undefined') {
      try {
        // Tab-scoped theme check
        const sessionTheme = sessionStorage.getItem(this.themeKey);
        if (sessionTheme === ApplicationThemeCON.DARK || sessionTheme === ApplicationThemeCON.LIGHT) {
          return sessionTheme;
        }

        // Smart Bootstrap: If new tab has no sessionTheme, inherit from localStorage
        const localTheme = localStorage.getItem(this.themeKey);
        if (localTheme === ApplicationThemeCON.DARK || localTheme === ApplicationThemeCON.LIGHT) {
          sessionStorage.setItem(this.themeKey, localTheme);
          return localTheme;
        }
      } catch {
        // Ignore storage access errors
      }
    }
    return ApplicationThemeCON.DARK; // Default to Dark Mode
  }

  public applyTheme(theme: string): void {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(this.themeKey, theme);
      localStorage.setItem(this.themeKey, theme);
    } catch {
      // Ignore storage access errors
    }
    if (theme === ApplicationThemeCON.DARK) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }

  public toggleTheme(currentTheme: string): string {
    const nextTheme =
      currentTheme === ApplicationThemeCON.LIGHT
        ? ApplicationThemeCON.DARK
        : ApplicationThemeCON.LIGHT;
    this.applyTheme(nextTheme);
    return nextTheme;
  }

  public executeAnimatedThemeToggle(
    targetElement: HTMLElement | null,
    toggleCallback: () => void,
    duration: number = 450
  ): void {
    if (
      typeof window === 'undefined' ||
      typeof document === 'undefined' ||
      !(document as any).startViewTransition
    ) {
      toggleCallback();
      return;
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = viewportWidth / 2;
    let y = viewportHeight / 2;

    if (targetElement) {
      const { top, left, width, height } = targetElement.getBoundingClientRect();
      x = left + width / 2;
      y = top + height / 2;
    }

    const maxRadius = Math.hypot(
      Math.max(x, viewportWidth - x),
      Math.max(y, viewportHeight - y)
    );

    const toX = (px: number) => `${(px / viewportWidth) * 100}%`;
    const toY = (py: number) => `${(py / viewportHeight) * 100}%`;
    const toRadius = (r: number) =>
      `${(r / (Math.hypot(viewportWidth, viewportHeight) / Math.SQRT2)) * 100}%`;
    const point = `${toX(x)} ${toY(y)}`;

    const clipPath = [
      `circle(0% at ${point})`,
      `circle(${toRadius(maxRadius)} at ${point})`,
    ];

    const root = document.documentElement;
    root.dataset.magicuiThemeVt = 'active';
    root.style.setProperty('--magicui-theme-toggle-vt-duration', `${duration}ms`);
    root.style.setProperty('--magicui-theme-vt-clip-from', clipPath[0]);

    const cleanup = () => {
      clearTimeout(safetyTimer);
      delete root.dataset.magicuiThemeVt;
      root.style.removeProperty('--magicui-theme-toggle-vt-duration');
      root.style.removeProperty('--magicui-theme-vt-clip-from');
    };

    // Failsafe: if the View Transition never finishes (e.g. navigation mid-animation),
    // force cleanup so the page doesn't stay clipped to circle(0%).
    const safetyTimer = setTimeout(cleanup, duration + 200);

    const transition = (document as any).startViewTransition(() => {
      toggleCallback();
    });

    if (transition?.finished?.finally) {
      transition.finished.finally(cleanup).catch(() => {});
    } else {
      cleanup();
    }

    const ready = transition?.ready;
    if (ready && typeof ready.then === 'function') {
      ready
        .then(() => {
          document.documentElement.animate(
            { clipPath },
            {
              duration,
              easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
              fill: 'forwards',
              pseudoElement: '::view-transition-new(root)',
            }
          );
        })
        .catch(() => {});
    }
  }
}
```

Add this to `src/index.css` to keep the transition visually clean (prevents the browser's default cross-fade from fighting the circular clip-path reveal):

```css
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}
```

## 7. Top-level wiring (in whatever component owns page/route state)

There is no Context/Provider — the real codebase prop-drills `currentTheme` / `onToggleTheme` from the top of the component tree down to wherever a toggle is rendered:

```typescript
const [currentTheme, setCurrentTheme] = useState<string>(() => {
  const saved = ApplicationThemeUtility.current.getSavedTheme();
  ApplicationThemeUtility.current.applyTheme(saved);
  return saved;
});

useEffect(() => {
  ApplicationThemeUtility.current.applyTheme(currentTheme);
}, [currentTheme]);

const handleToggleTheme = () => {
  const next = ApplicationThemeUtility.current.toggleTheme(currentTheme);
  setCurrentTheme(next);
};
```

Pass `currentTheme` and `handleToggleTheme` down as props to wherever a toggle component is rendered.

## 8. Toggle UI — Variant A: standalone icon button

`src/Shared/Components/ThemeToggleSharedComponent.tsx` — a simple, controlled component. Use this anywhere a lightweight toggle is needed (nav bar, a bare test page, etc). This variant does its own click → toggle with no animation by default:

```tsx
import React from 'react';
import { motion } from 'motion/react';
import { Sun, Moon } from 'lucide-react';
import ApplicationThemeCON from '../../Constants/ApplicationThemeCON';

export interface ThemeToggleSharedComponentProps {
  currentTheme: string;
  onToggle: () => void;
}

export default function ThemeToggleSharedComponent({
  currentTheme,
  onToggle,
}: ThemeToggleSharedComponentProps): React.JSX.Element {
  const isDark = currentTheme === ApplicationThemeCON.DARK;

  return (
    <motion.button
      onClick={onToggle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 hairline-border hover:bg-slate-200 dark:hover:bg-zinc-700/80 transition-colors cursor-pointer"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400" />
      ) : (
        <Moon className="w-4 h-4 text-slate-600" />
      )}
    </motion.button>
  );
}
```

Usage:

```tsx
<ThemeToggleSharedComponent currentTheme={currentTheme} onToggle={handleToggleTheme} />
```

## 9. Toggle UI — Variant B: login/signup/forgot-password page segmented pill (with animation) — currently live in this repo

Full-width two-segment Light/Dark pill, used on AssetSphere's and SignForge's login, signup, and forgot-password screens (identical on both, positioned directly above the SSO button in the form's normal vertical flow — not floating/cornered). Uses `ApplicationThemeUtility.current.executeAnimatedThemeToggle` (from Step 6), so clicking triggers the circular View Transition reveal anchored at the clicked segment. Each segment only fires when it's *not* already active.

`src/Shared/Components/ThemeModeSegmentedToggleSharedComponent.tsx`:

```tsx
import React from 'react';
import { Sun, Moon } from 'lucide-react';
import ApplicationThemeCON from '../../Constants/ApplicationThemeCON';
import ApplicationThemeUtility from '../../Utilities/ApplicationThemeUtility';

export interface ThemeModeSegmentedToggleSharedComponentProps {
  currentTheme: string;
  onToggle: () => void;
}

export default function ThemeModeSegmentedToggleSharedComponent({
  currentTheme,
  onToggle,
}: ThemeModeSegmentedToggleSharedComponentProps): React.JSX.Element {
  const isDark = currentTheme === ApplicationThemeCON.DARK;

  return (
    <div
      style={{ viewTransitionName: 'auth-theme-toggle' } as React.CSSProperties}
      className="w-full"
    >
      <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 h-11 sm:h-9 w-full">
        <button
          type="button"
          onClick={(e) => {
            if (isDark) {
              ApplicationThemeUtility.current.executeAnimatedThemeToggle(e.currentTarget, onToggle);
            }
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 h-full rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            !isDark
              ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 dark:text-zinc-400'
          }`}
        >
          <Sun className="w-4 h-4" />
          Light
        </button>
        <button
          type="button"
          onClick={(e) => {
            if (!isDark) {
              ApplicationThemeUtility.current.executeAnimatedThemeToggle(e.currentTarget, onToggle);
            }
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 h-full rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            isDark
              ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 dark:text-zinc-400'
          }`}
        >
          <Moon className="w-4 h-4" />
          Dark
        </button>
      </div>
    </div>
  );
}
```

Usage:

```tsx
<div className="max-w-sm w-full">
  <ThemeModeSegmentedToggleSharedComponent currentTheme={currentTheme} onToggle={handleToggleTheme} />
</div>
```

("Full width" only makes sense inside a narrow login card in the real app — give it a `max-w-*` wrapper anywhere else, e.g. a bare test page, so it doesn't stretch edge-to-edge.)

SignForge's version is byte-identical except it omits the `viewTransitionName` inline style — harmless to include either way, so this recipe keeps it.

## 10. Toggle UI — Variant C: profile-dropdown segmented pill (with animation)

A visually distinct sibling of Variant B — a two-segment Light/Dark pill living inside a profile/account dropdown menu, using the same `ApplicationThemeUtility.current.executeAnimatedThemeToggle` (from Step 6) so the click triggers the circular View Transition reveal, anchored at the clicked segment.

The relevant block, extracted from `ProfileDropdownStaticComponent.tsx` (props include `currentTheme: string` and `onToggleTheme: () => void`, same as Variant A):

```tsx
const isDark = currentTheme === ApplicationThemeCON.DARK;

// ...inside the dropdown's JSX, in a "Preferences & Controls" section:

<div className="space-y-2 p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800/80">
  <div className="flex items-center gap-2 text-sm sm:text-xs text-slate-700 dark:text-zinc-200 font-medium">
    {isDark ? (
      <Moon className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
    ) : (
      <Sun className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
    )}
    <span>Theme Mode</span>
  </div>

  <div className="flex items-center p-1 rounded-lg bg-slate-200/80 dark:bg-zinc-800 border border-slate-300/60 dark:border-zinc-700/60 h-11 sm:h-8 w-full">
    <button
      onClick={(e) =>
        isDark &&
        ApplicationThemeUtility.current.executeAnimatedThemeToggle(
          e.currentTarget,
          onToggleTheme
        )
      }
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 sm:py-1 h-9 sm:h-6 rounded-lg sm:rounded-md text-sm sm:text-xs font-medium transition-all cursor-pointer ${
        !isDark
          ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-xs font-bold'
          : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
      }`}
    >
      <Sun className="w-4 h-4 sm:w-3 sm:h-3" />
      <span>Light Mode</span>
    </button>
    <button
      onClick={(e) =>
        !isDark &&
        ApplicationThemeUtility.current.executeAnimatedThemeToggle(
          e.currentTarget,
          onToggleTheme
        )
      }
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 sm:py-1 h-9 sm:h-6 rounded-lg sm:rounded-md text-sm sm:text-xs font-medium transition-all cursor-pointer ${
        isDark
          ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-xs font-bold'
          : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
      }`}
    >
      <Moon className="w-4 h-4 sm:w-3 sm:h-3" />
      <span>Dark Mode</span>
    </button>
  </div>
</div>
```

Notes on this variant:
- Each segment only fires when it's *not* already the active one (`isDark && ...` / `!isDark && ...`), so clicking the already-active segment does nothing.
- `e.currentTarget` (the clicked button) is passed as the animation's origin point, so the circular reveal expands from wherever the user clicked, not from the screen center.
- This block is normally nested inside a larger dropdown shell (backdrop overlay + a `motion.div` popover positioned relative to a profile avatar button) — the segmented pill itself is what's reusable; the surrounding dropdown chrome (user avatar, name, sign-out, etc.) is specific to whatever profile system exists in the target app and isn't part of the theme system itself.

## 11. Verifying it works

1. `npm run dev`, open the app.
2. Confirm it loads in **dark mode** by default (no prior storage) — black canvas, off-white text.
3. Click the toggle — canvas and text should animate to light (white canvas, dark text) via the expanding-circle transition (or an instant swap if the browser lacks View Transitions support, e.g. Firefox).
4. Reload the page — the choice must persist (reads back from `sessionStorage`, falling back to `localStorage`).
5. Open a second tab to the same origin without any `sessionStorage` yet — it should inherit the `localStorage` value on first load (the "smart bootstrap" behavior in `getSavedTheme()`).
