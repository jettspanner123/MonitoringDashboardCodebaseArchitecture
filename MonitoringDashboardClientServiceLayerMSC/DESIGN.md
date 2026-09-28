# Monitoring Dashboard Canonical Design System & UI/UX Architecture Specification

> **Version**: 2.2.0 (Complete Enterprise Component Library Edition)  
> **Target Package**: `MonitoringDashboardClientServiceLayerMSC`  
> **Provenance**: Adapted from AssetSphere's canonical design system (the source-of-truth design language shared across the AssetSphere/SignForge application family), so this dashboard reads as part of the same application chain rather than a one-off.

---

## 1. Executive Philosophy: "Enterprise Editorial Precision"

Monitoring Dashboard pairs the authoritative, high-craft editorial posture of print journalism (**Playfair Display** serif display headlines) with an uncompromising, ultra-crisp developer-grade engineering canvas (**JetBrains Mono** data tags, **Inter** UI, `#0C2086` signature sapphire blue accents, and translucent hairline borders).

```
   ┌────────────────────────────────────────────────────────────────────────┐
   │                                                                        │
   │   Playfair Display Editorial Serif (Headlines, Page & Modal Titles)    │
   │                                   +                                    │
   │       Inter / Plus Jakarta Sans (Operational UI, Forms & Controls)     │
   │                                   +                                    │
   │     JetBrains Mono (Identifiers, Serial Numbers, Currencies & Dates)   │
   │                                   +                                    │
   │   #0C2086 Signature Sapphire Accent & Translucent Hairline Depth       │
   │                                                                        │
   └────────────────────────────────────────────────────────────────────────┘
```

### Core Design Pillars
1. **Zero Decorative Chrome & Zero Fake Filler Data**: Every metric, tag, badge, and card is grounded 100% in real backend database state. If the database holds 0 entities, the UI displays dedicated `EmptyStateSharedComponent` layouts rather than synthetic mock placeholders.
2. **Dual-Canvas Theming**: Light Mode is a crisp, clean alabaster slate (`#ffffff` canvas, `#f8fafc` cards, `#09090b` text). Dark Mode is a deep, luminous obsidian space (`#000000` canvas, `#0a0a0c` / `#121216` cards, `#fcfdff` text).
3. **Intentional Physics & Predictable Motion**: Modals and cards respond with physics-driven spatial transitions (`exitDirection="down"` for top triggers, `exitDirection="up"` for bottom actions).

---

## 2. Typography System & The Tri-Font Hierarchy

Monitoring Dashboard strictly enforces a **Tri-Font Architecture**. Fonts are loaded globally via Google Fonts in `src/index.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:ital,wght@0,400;0,500;0,600;1,400&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
```

```
┌─────────────────────────┬───────────────────────────────┬──────────────────────────────────────────┐
│ Font Family             │ CSS Variable / Class          │ Application Scope                        │
├─────────────────────────┼───────────────────────────────┼──────────────────────────────────────────┤
│ Playfair Display (Serif)│ --font-serif                  │ Page H1s, section H2/H3s, card titles,   │
│                         │ .font-serif-headline          │ modal header titles, stats hero numbers  │
├─────────────────────────┼───────────────────────────────┼──────────────────────────────────────────┤
│ Inter / Plus Jakarta    │ --font-sans                   │ UI controls, form labels, button labels, │
│ Sans (Sans-Serif)       │ .font-sans                    │ body copy, tooltips, toasts, tables      │
├─────────────────────────┼───────────────────────────────┼──────────────────────────────────────────┤
│ JetBrains Mono          │ --font-mono                   │ Asset tags, serial codes, currencies,    │
│ (Monospace)             │ .font-mono / .font-code       │ dates, licenses, IP addresses, badges    │
└─────────────────────────┴───────────────────────────────┴──────────────────────────────────────────┘
```

### Type Scale & Hierarchy Reference Table

| Semantic Role | Font Family | Size | Weight | Line Height | Tracking | Tailwind Utility |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Page Title (Display XL)** | Playfair Display | `28px–32px` | `700` (Bold) | `1.15` | `-0.02em` | `text-2xl sm:text-3xl font-bold font-serif-headline` |
| **Section Header (Display LG)**| Playfair Display | `20px–24px` | `600` (Semibold)| `1.25` | `-0.01em` | `text-xl sm:text-2xl font-semibold font-serif-headline` |
| **Card / Modal Title (MD)** | Playfair Display | `16px–18px` | `600` (Semibold)| `1.3` | `normal` | `text-base sm:text-lg font-semibold font-serif-headline`|
| **Section Eyebrow Label** | JetBrains Mono | `11px–12px` | `700` (Bold) | `1.0` | `+0.05em` | `text-xs font-bold uppercase tracking-wider font-mono` |
| **UI Body / Inputs** | Inter / Sans | `13px–14px` | `400` (Regular) | `1.5` | `normal` | `text-xs sm:text-sm font-normal text-slate-600 dark:text-zinc-300` |
| **Field Labels** | Inter / Sans | `12px` | `500` (Medium) | `1.2` | `normal` | `text-xs font-medium text-slate-700 dark:text-zinc-300` |
| **Technical Metadata** | JetBrains Mono | `11px–12px` | `500`/`600` | `1.4` | `tight` | `text-xs font-mono text-slate-500 dark:text-zinc-400` |
| **Micro Badges / Chips** | JetBrains Mono | `10px` | `700` (Bold) | `1.0` | `wide` | `text-[10px] font-mono font-bold uppercase` |

---

## 3. Color Palette & Dual-Canvas Token Specification

Monitoring Dashboard employs CSS variables coupled with Tailwind `@variant dark (&:where(.dark, .dark *))` to maintain flawless theme switching without layout recalculation.

```
                  ┌────────────────────────────────────────┐
                  │       LIGHT MODE CANADIAN SLATE        │
                  │   Canvas: #ffffff  │  Card: #f8fafc    │
                  │   Ink:    #09090b  │  Body: #334155    │
                  └───────────────────┬────────────────────┘
                                      │
                         [ THEME SWITCH DYNAMICS ]
                                      │
                  ┌───────────────────┴────────────────────┐
                  │       DARK MODE OBSIDIAN SPACE         │
                  │   Canvas: #000000  │  Card: #0a0a0c    │
                  │   Ink:    #fcfdff  │  Body: 86% White  │
                  └────────────────────────────────────────┘
```

### 1. Canvas & Surface Tokens

| Token Name | Light Mode Value | Dark Mode Value | Usage Context |
| :--- | :--- | :--- | :--- |
| `--color-canvas` | `#ffffff` | `#000000` | Global viewport body background |
| `--color-surface-card` | `#f8fafc` | `#0a0a0c` | Standard cards, list items, sidebars |
| `--color-surface-elevated`| `#f1f5f9` | `#101012` | Nested cards, hover states, table rows |
| `--color-surface-deep` | `#f8fafc` | `#06060a` | Deep inset panels, code blocks, terminal |

### 2. Typography & Ink Tokens

| Token Name | Light Mode Value | Dark Mode Value | Usage Context |
| :--- | :--- | :--- | :--- |
| `--color-ink` | `#09090b` (Slate 950) | `#fcfdff` (Off-white) | High-contrast headings, active text |
| `--color-body` | `#334155` (Slate 700) | `rgba(252,253,255,0.86)`| Primary reading body text |
| `--color-charcoal` | `#475569` (Slate 600) | `rgba(252,253,255,0.70)`| Secondary text, table cells |
| `--color-mute` | `#64748b` (Slate 500) | `#a1a4a5` | Muted labels, timestamps, icons |
| `--color-ash` | `#94a3b8` (Slate 400) | `#888e90` | Placeholder text, subtle borders |
| `--color-stone` | `#cbd5e1` (Slate 300) | `#464a4d` | Inactive checkboxes, dividers |

### 3. Signature Brand Sapphire Accent & Interactive States

```
   Brand Sapphire:       #0C2086  (rgb(12, 32, 134))
   Brand Hover:          #081765  (rgb(8, 23, 101))
   Focus Glow (Light):   rgba(12, 32, 134, 0.15)
   Focus Glow (Dark):    rgba(59, 130, 246, 0.30)
```

- **Primary Action Utility**: `!bg-[#0C2086] hover:!bg-[#081765] !text-white border-none shadow-sm font-semibold`
- **White Text/Icon Invariant**: All primary brand buttons **MUST** declare `!text-white` on text labels and icon SVGs to prevent dark-mode CSS inheritance bugs.

---

## 4. Borders, Dividers, & Hairlines

Monitoring Dashboard avoids heavy solid borders, utilizing micro-translucent hairlines that illuminate subtly against obsidian in Dark Mode and create crisp structure in Light Mode.

```css
/* Hairline border utilities in index.css */
.hairline-border {
  border: 1px solid var(--color-hairline);
}
.hairline-border-strong {
  border: 1px solid var(--color-hairline-strong);
}
```

```
┌───────────────────────────────┬───────────────────────────────┬──────────────────────────────────────────┐
│ Border Level                  │ Light Mode Tailwind           │ Dark Mode Tailwind                       │
├───────────────────────────────┼───────────────────────────────┼──────────────────────────────────────────┤
│ Outer Container / Modal Box   │ border-slate-200              │ border-zinc-800                          │
│ Inner Sub-divider / Section   │ border-slate-100              │ border-zinc-800/80                       │
│ Table Cell Bottom Divider     │ border-slate-200/60           │ border-zinc-800/60                       │
│ Interactive Hover Border      │ hover:border-slate-300        │ dark:hover:border-zinc-700               │
│ Active / Selected Outline     │ border-[#0C2086]              │ dark:border-blue-500                     │
└───────────────────────────────┴───────────────────────────────┴──────────────────────────────────────────┘
```

---

## 5. Container Geometry, Radii, Shadows & Elevation

### Standard Radii Vocabulary
- **`rounded-2xl` (16px)**: Page cards, root modal dialog containers, floating toolbars.
- **`rounded-xl` (12px)**: Item rows, roster cards, inner info groups, dropdown menus.
- **`rounded-lg` (8px)**: Buttons, form input text boxes, select trigger boxes.
- **`rounded-md` (6px)**: Status badges, department chips, code pills.
- **`rounded-full` (9999px)**: Avatar initials circles, status dot indicators, counter pills.

### Elevation & Shadows
- **Light Mode**: Ultra-crisp, diffuse elevation using `shadow-xs` / `shadow-sm` (`rgba(0, 0, 0, 0.04)` to `rgba(0, 0, 0, 0.08)`).
- **Dark Mode**: `shadow-none` with luminous hairline border containment (`border-zinc-800` / `border-white/10`).

---

## 6. Modal Architecture & Backdrop Physics

All modal dialogs throughout the application **MUST** build upon [`ModalSharedComponent.tsx`](file:///c:/Users/UddeshyaSingh/Development/MonitoringDashboardCodebaseArchitecture/MonitoringDashboardClientServiceLayerMSC/src/Shared/Components/ModalSharedComponent.tsx). Never build bespoke `<AnimatePresence>` modal overlays in screens.

```
   ┌────────────────────────────────────────────────────────────────────────┐
   │                                                                        │
   │   Backdrop: bg-slate-900/60 (Light) │ bg-black/80 (Dark)               │
   │   Backdrop Filter: backdrop-blur-md                                    │
   │   Container: bg-white dark:bg-[#0c0c0e] border border-slate-200/80...  │
   │                                                                        │
   │   Header (Sticky / Border-b)                                           │
   │   ├── Title (Playfair Display font-serif-headline)                     │
   │   └── Close Button (X icon) ───[ Triggers EXIT DOWN ]                  │
   │                                                                        │
   │   Body: Multi-section forms (scrollMode="backdrop")                    │
   │   ├── Section 1 (Title + 2-Column Input Grid)                          │
   │   ├── Section 2 (mt-[15px] + Eyebrow Header + 2-Column Grid)           │
   │   └── Section 3 (mt-[15px] + Commercials & Terms)                      │
   │                                                                        │
   │   Footer (Sticky / Border-t / mt-6 pt-4 gap-3)                         │
   │   ├── Cancel / Back Button (size="sm" outline) ──[ Triggers EXIT UP ]  │
   │   └── Primary Action (size="sm" #0C2086) ────────[ Triggers EXIT UP ]  │
   │                                                                        │
   └────────────────────────────────────────────────────────────────────────┘
```

### Modal Specifications
1. **Backdrop Atmosphere**: `bg-slate-900/60` (Light) / `bg-black/80` (Dark) with `backdrop-blur-md`.
2. **Max Width Tiers**:
   - `max-w-md` (448px): Confirmation modals, delete prompts, single-field inputs.
   - `max-w-2xl` (672px): Quick assign modals, QR scanners, single-step dialogs.
   - `max-w-3xl` / `max-w-4xl` (768px–896px): Multi-step wizards, comprehensive Asset / Employee / Software Detail sheets.
3. **Scroll Mode Invariant**: Multi-section forms **MUST** use `scrollMode="backdrop"` to allow natural document scrolling without double scrollbar glitches.
4. **Section Spacing Invariant (`mt-[15px]`)**: Sections 2, 3, 4+ inside modals must declare `mt-[15px]`:
   ```tsx
   <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-zinc-800 mt-[15px]">
     <Icon className="w-3.5 h-3.5 text-blue-500" />
     2. Section Title
   </h4>
   ```

---

## 7. Modal Exit Physics Invariant (`exitDirection`)

Monitoring Dashboard modals follow **Physical Spatial Directionality** based on user intent and trigger origin.

```
             ▲  SLIDE UP EXIT  ▲
   ┌───────────────────────────────────┐
   │                                   │
   │   Triggered By:                   │
   │   • Footer "Cancel" Button        │
   │   • Footer "Close" Button         │
   │   • Form "Submit" / "Register"    │
   │   • "Resolve Ticket" / Actions    │
   │   • Deep Backdrop Click (y > 40)  │
   │                                   │
   └───────────────────────────────────┘

   ┌───────────────────────────────────┐
   │                                   │
   │   Triggered By:                   │
   │   • Header "X" Button             │
   │   • Top Backdrop Click (y <= 40)  │
   │                                   │
   └───────────────────────────────────┘
             ▼ SLIDE DOWN EXIT ▼
```

---

## 8. Button Design System & Micro-Interactions

Buttons in Monitoring Dashboard use spring micro-scaling via `motion/react` with precise tokenized variants.

```tsx
<motion.button
  whileHover={{ scale: 1.01 }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
/>
```

```
┌──────────────┬─────────────────────────────────────────────────────────────────────────────┐
│ Variant      │ Tokenized Style & Purpose                                                   │
├──────────────┼─────────────────────────────────────────────────────────────────────────────┤
│ Primary      │ !bg-[#0C2086] hover:!bg-[#081765] !text-white border-none shadow-sm        │
│ (Brand CTA)  │ Explicit white text & icon invariant: <span className="!text-white">        │
├──────────────┼─────────────────────────────────────────────────────────────────────────────┤
│ Outline      │ border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900     │
│ (Secondary)  │ text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 │
├──────────────┼─────────────────────────────────────────────────────────────────────────────┤
│ Ghost        │ text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800│
│ (Subtle)     │ hover:text-slate-900 dark:hover:text-white                                  │
├──────────────┼─────────────────────────────────────────────────────────────────────────────┤
│ Danger       │ !text-rose-600 dark:!text-rose-400 hover:!bg-rose-50 dark:hover:!bg-rose-950│
│ (Destructive)│ border-rose-200/80 dark:border-rose-900/60                                  │
└──────────────┴─────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Categorized Component Library (100% Complete Production Source Code)

The following sections provide 100% copy-pasteable TypeScript implementations organized into 5 functional modules.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    MONITORING DASHBOARD COMPONENT CATALOG MODULES                   │
├────────────────────────────────────────────────────────────────────────────┤
│ MODULE 1: MODALS & DIALOGS                                                 │
│ • ModalSharedComponent.tsx                                                 │
│ • ConfirmationModalSharedComponent.tsx                                     │
│                                                                            │
│ MODULE 2: SELECTION & INPUTS                                               │
│ • CustomSelectSharedComponent.tsx                                          │
│ • CreatableCustomSelectSharedComponent.tsx                                 │
│ • InputSharedComponent.tsx                                                 │
│                                                                            │
│ MODULE 3: ACTIONS & BUTTONS                                                │
│ • ButtonSharedComponent.tsx                                                │
│ • PrimaryActionButtonSharedComponent.tsx                                   │
│                                                                            │
│ MODULE 4: STATES, SECURITY & BADGES                                        │
│ • BadgeSharedComponent.tsx                                                 │
│ • EmptyStateSharedComponent.tsx                                            │
│ • PermissionGuardSharedComponent.tsx                                       │
│                                                                            │
│ MODULE 5: THEMING & VIEW TRANSITIONS                                       │
│ • ThemeToggleSharedComponent.tsx                                           │
│ • AnimatedThemeToggleSharedComponent.tsx                                   │
└────────────────────────────────────────────────────────────────────────────┘
```

---

### Module 1: Modals & Dialogs

#### 1.1 `ModalSharedComponent.tsx`
- **File**: `src/Shared/Components/ModalSharedComponent.tsx`
- **Export**: `default function ModalSharedComponent`

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

export interface ModalSharedComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  minHeight?: string;
  scrollMode?: 'backdrop' | 'body';
  animationType?: 'scale' | 'slide-up';
  exitDirection?: 'down' | 'up';
  headerCloseDirection?: 'down' | 'up';
  zIndex?: number;
}

export default function ModalSharedComponent({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = '2xl',
  minHeight,
  scrollMode = 'backdrop',
  animationType = 'slide-up',
  exitDirection: exitDirectionProp = 'down',
  headerCloseDirection = 'down',
  zIndex = 50,
}: ModalSharedComponentProps): React.JSX.Element {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dialogCardRef = useRef<HTMLDivElement>(null);
  const [internalExitDirection, setInternalExitDirection] = useState<'down' | 'up'>(exitDirectionProp);
  const prevOpenRef = useRef(isOpen);

  useEffect(() => {
    setInternalExitDirection(exitDirectionProp);
  }, [exitDirectionProp]);

  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      setInternalExitDirection(exitDirectionProp || 'down');
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, exitDirectionProp]);

  const getScrollAwareDirection = (): 'down' | 'up' => {
    if (scrollMode === 'backdrop' && scrollContainerRef.current) {
      return scrollContainerRef.current.scrollTop > 40 ? 'up' : 'down';
    }
    return 'down';
  };

  const handleBackdropClick = () => {
    const direction = getScrollAwareDirection();
    setInternalExitDirection(direction);
    setTimeout(() => onClose(), 0);
  };

  const handleEscapeKey = () => {
    const direction = getScrollAwareDirection();
    setInternalExitDirection(direction);
    setTimeout(() => onClose(), 0);
  };

  const handleHeaderClose = () => {
    setInternalExitDirection(headerCloseDirection);
    setTimeout(() => onClose(), 0);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleEscapeKey();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  let widthClass = 'max-w-2xl';
  if (maxWidth === 'sm') widthClass = 'max-w-sm';
  if (maxWidth === 'md') widthClass = 'max-w-md';
  if (maxWidth === 'lg') widthClass = 'max-w-lg';
  if (maxWidth === 'xl') widthClass = 'max-w-xl';
  if (maxWidth === '2xl') widthClass = 'max-w-2xl';
  if (maxWidth === '3xl') widthClass = 'max-w-3xl';
  if (maxWidth === '4xl') widthClass = 'max-w-4xl';
  if (maxWidth === '5xl') widthClass = 'max-w-5xl';

  const isSlideUp = animationType === 'slide-up';
  const activeExitDirection: 'down' | 'up' =
    exitDirectionProp === 'up' || internalExitDirection === 'up' ? 'up' : 'down';

  const getExitDistance = (dir: 'down' | 'up'): number => {
    if (typeof window === 'undefined') return dir === 'up' ? -1800 : 1800;
    const vh = window.innerHeight || 800;
    const cardHeight = dialogCardRef.current?.offsetHeight || 800;
    const scrollTop = scrollContainerRef.current?.scrollTop || 0;
    return dir === 'up' ? -(cardHeight + vh + scrollTop + 400) : cardHeight + vh + 400;
  };

  const modalVariants = {
    initial: {
      y: isSlideUp ? (typeof window !== 'undefined' ? window.innerHeight + 1000 : '150vh') : 8,
      opacity: isSlideUp ? 1 : 0,
      scale: isSlideUp ? 1 : 0.96,
    },
    animate: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
    },
    exit: (customDir?: 'down' | 'up') => {
      const dir = customDir || activeExitDirection;
      const distance = getExitDistance(dir);
      return {
        y: isSlideUp ? distance : 8,
        opacity: isSlideUp ? 1 : 0,
        scale: isSlideUp ? 1 : 0.96,
        transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] as const },
      };
    },
  };

  return (
    <AnimatePresence custom={activeExitDirection}>
      {isOpen && (
        <div
          ref={scrollContainerRef}
          style={{ zIndex }}
          className="fixed inset-0 flex items-start justify-center p-4 sm:p-6 overflow-y-auto overflow-x-hidden"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
            onClick={handleBackdropClick}
            className="fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            ref={dialogCardRef}
            custom={activeExitDirection}
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`relative w-full ${widthClass} bg-white dark:bg-[#0a0a0c] hairline-border-strong rounded-xl shadow-2xl z-10 my-auto sm:my-8 flex flex-col shrink-0`}
          >
            {(title || subtitle) && (
              <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800/80 flex items-center justify-between shrink-0">
                <div>
                  {title && (
                    <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-zinc-100 font-serif-headline">
                      {title}
                    </h2>
                  )}
                  {subtitle && (
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                      {subtitle}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleHeaderClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            <div className={`p-6 flex-1 ${scrollMode === 'body' ? 'max-h-[85vh] overflow-y-auto' : ''} ${minHeight ? minHeight : ''}`}>
              {children}
            </div>

            {footer && (
              <div className="px-6 py-4 border-t border-slate-200 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-[#08080a] shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
```

---

#### 1.2 `ConfirmationModalSharedComponent.tsx`
- **File**: `src/Shared/Components/ConfirmationModalSharedComponent.tsx`
- **Export**: `default function ConfirmationModalSharedComponent`

```tsx
import React from 'react';
import ModalSharedComponent from './ModalSharedComponent';
import ButtonSharedComponent from './ButtonSharedComponent';

export type ConfirmationVariant = 'danger' | 'warning' | 'primary';

export interface ConfirmationModalSharedComponentProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  subtitle?: string;
  description: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmationVariant;
  isLoading?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  additionalContent?: React.ReactNode;
}

export default function ConfirmationModalSharedComponent({
  isOpen,
  onClose,
  onConfirm,
  title,
  subtitle,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
  maxWidth = 'md',
  additionalContent,
}: ConfirmationModalSharedComponentProps): React.JSX.Element {
  const [exitDirection, setExitDirection] = React.useState<'down' | 'up'>('down');
  const prevIsOpenRef = React.useRef(isOpen);

  React.useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setExitDirection('down');
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  const handleCancel = () => {
    setExitDirection('up');
    setTimeout(() => onClose(), 0);
  };

  const handleConfirm = async () => {
    setExitDirection('up');
    setTimeout(async () => {
      await onConfirm();
    }, 0);
  };

  const getConfirmButtonClasses = () => {
    if (variant === 'danger') {
      return '!bg-rose-600 hover:!bg-rose-700 active:!bg-rose-800 !text-white border-none shadow-sm font-semibold';
    }
    if (variant === 'warning') {
      return '!bg-amber-600 hover:!bg-amber-700 active:!bg-amber-800 !text-white border-none shadow-sm font-semibold';
    }
    return '!bg-[#0C2086] hover:!bg-[#081765] active:!bg-[#051047] !text-white border-none shadow-sm font-semibold';
  };

  return (
    <ModalSharedComponent
      isOpen={isOpen}
      onClose={onClose}
      exitDirection={exitDirection}
      title={title}
      subtitle={subtitle}
      maxWidth={maxWidth}
    >
      <div className="flex flex-col justify-between h-full text-xs">
        <div className="space-y-4 py-1">
          <div className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed font-normal">
            {description}
          </div>
          {additionalContent && <div>{additionalContent}</div>}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 mt-6 border-t border-slate-200 dark:border-zinc-800 shrink-0">
          <ButtonSharedComponent
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={isLoading}
          >
            {cancelText}
          </ButtonSharedComponent>
          <ButtonSharedComponent
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            disabled={isLoading}
            onClick={handleConfirm}
            className={getConfirmButtonClasses()}
            icon={
              isLoading ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
              ) : undefined
            }
          >
            <span className="!text-white font-medium">{confirmText}</span>
          </ButtonSharedComponent>
        </div>
      </div>
    </ModalSharedComponent>
  );
}
```

---

### Module 2: Selection & Inputs

#### 2.1 `CustomSelectSharedComponent.tsx`
- **File**: `src/Shared/Components/CustomSelectSharedComponent.tsx`
- **Export**: `default function CustomSelectSharedComponent`

```tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Check, Search } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
}

export interface SelectFooterAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
}

export interface CustomSelectSharedComponentProps {
  label?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  dropdownClassName?: string;
  size?: 'sm' | 'md';
  searchable?: boolean;
  searchPlaceholder?: string;
  footerAction?: SelectFooterAction;
}

export default function CustomSelectSharedComponent({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select option...',
  className = 'w-full',
  triggerClassName,
  dropdownClassName,
  size = 'md',
  searchable = false,
  searchPlaceholder = 'Search options...',
  footerAction,
}: CustomSelectSharedComponentProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      return;
    }
    if (searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
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
  }, [isOpen, searchable]);

  const filteredOptions = React.useMemo(() => {
    if (!searchable || !searchTerm.trim()) return options;
    const term = searchTerm.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(term) ||
        opt.value.toLowerCase().includes(term) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(term))
    );
  }, [options, searchable, searchTerm]);

  const heightClass = size === 'sm' ? 'h-9 px-2.5' : 'h-10 px-3';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1 block">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${className.includes('w-') ? 'w-full' : ''} ${heightClass} rounded-lg bg-white dark:bg-[#0a0a0c] text-slate-900 dark:text-zinc-100 border border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors focus:outline-none text-xs flex items-center justify-between gap-2 cursor-pointer select-none ${triggerClassName || ''}`}
      >
        <div className="flex items-center gap-2 truncate font-medium">
          {selectedOption?.icon}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-slate-700 dark:text-zinc-200' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 4 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute left-0 right-0 min-w-[200px] top-full mt-1.5 z-50 bg-white dark:bg-[#0c0c0e] border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl p-1 text-xs space-y-0.5 max-h-64 overflow-y-auto ${dropdownClassName || ''}`}
          >
            {searchable && (
              <div className="p-1.5 border-b border-slate-100 dark:border-zinc-800/80 mb-1">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-hidden focus:ring-1 focus:ring-[#0C2086] transition-all"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}

            {filteredOptions.length === 0 ? (
              <div className="py-3 px-2 text-center text-xs text-slate-400 dark:text-zinc-500">
                No results found
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer text-left ${
                      isSelected
                        ? 'bg-slate-100 dark:bg-zinc-800/90 text-slate-900 dark:text-white font-bold'
                        : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                      {option.icon}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{option.label}</div>
                        {option.sublabel && (
                          <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono mt-0.5">
                            {option.sublabel}
                          </div>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-indigo-500 shrink-0" />
                    )}
                  </button>
                );
              })
            )}

            {footerAction && (
              <div className="pt-1 mt-1 border-t border-slate-100 dark:border-zinc-800/80">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                    footerAction.onClick();
                  }}
                  className="w-full flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#0C2086] dark:text-sky-400 hover:bg-blue-50 dark:hover:bg-sky-950/40 transition-colors cursor-pointer text-left"
                >
                  {footerAction.icon}
                  <span className="truncate">{footerAction.label}</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

---

#### 2.2 `CreatableCustomSelectSharedComponent.tsx`
- **File**: `src/Shared/Components/CreatableCustomSelectSharedComponent.tsx`
- **Export**: `default function CreatableCustomSelectSharedComponent`
- **Purpose**: Enables users to either pick an existing option or dynamically type a novel custom value directly into the search input.

```tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Check, Search, Plus, Sparkles } from 'lucide-react';

export interface CreatableSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
}

export interface CreatableCustomSelectSharedComponentProps {
  label?: string;
  value: string;
  options: CreatableSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  dropdownClassName?: string;
  size?: 'sm' | 'md';
  searchPlaceholder?: string;
  enableSearch?: boolean;
  enableCustomCreation?: boolean;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
}

export default function CreatableCustomSelectSharedComponent({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select or type custom value...',
  className = 'w-full',
  triggerClassName,
  dropdownClassName,
  size = 'md',
  searchPlaceholder = 'Search options or type custom value...',
  enableSearch = true,
  enableCustomCreation = true,
  required = false,
  disabled = false,
  helperText,
}: CreatableCustomSelectSharedComponentProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : value;

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      return;
    }
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
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
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const term = searchTerm.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(term) ||
        opt.value.toLowerCase().includes(term) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(term))
    );
  }, [options, searchTerm]);

  const exactMatchExists = options.some(
    (opt) =>
      opt.label.toLowerCase().trim() === searchTerm.toLowerCase().trim() ||
      opt.value.toLowerCase().trim() === searchTerm.toLowerCase().trim()
  );

  const handleSelectOption = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleApplyCustomValue = () => {
    if (!searchTerm.trim()) return;
    onChange(searchTerm.trim());
    setIsOpen(false);
  };

  const heightClass = size === 'sm' ? 'h-9 px-2.5' : 'h-10 px-3';

  return (
    <div className={`space-y-1.5 ${className}`} ref={dropdownRef}>
      {label && (
        <label className="text-xs font-medium text-slate-600 dark:text-zinc-400 flex items-center justify-between">
          <span>
            {label} {required && <span className="text-rose-500 font-bold">*</span>}
          </span>
          {enableCustomCreation && value && !selectedOption && (
            <span className="text-[10px] font-mono text-[#0C2086] dark:text-blue-400 flex items-center gap-1 font-semibold">
              <Sparkles className="w-2.5 h-2.5" />
              Custom Value
            </span>
          )}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between text-xs rounded-xl bg-white dark:bg-zinc-900/80 border border-slate-300 dark:border-zinc-700/80 text-slate-900 dark:text-zinc-100 hover:border-slate-400 dark:hover:border-zinc-600 transition-all shadow-2xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#0C2086]/50 ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          } ${heightClass} ${triggerClassName || ''}`}
        >
          <div className="flex items-center gap-2 truncate min-w-0 pr-2">
            {selectedOption?.icon}
            {displayLabel ? (
              <span className="truncate font-medium">{displayLabel}</span>
            ) : (
              <span className="text-slate-400 dark:text-zinc-500 truncate">{placeholder}</span>
            )}
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#0C2086] dark:text-blue-400' : ''
            }`}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className={`absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl p-1.5 max-h-72 overflow-hidden flex flex-col ${
                dropdownClassName || ''
              }`}
            >
              {enableSearch && (
                <div className="p-1 border-b border-slate-100 dark:border-zinc-800/80 mb-1">
                  <div className="relative flex items-center">
                    <Search className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute left-2.5" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (filteredOptions.length === 1) {
                            handleSelectOption(filteredOptions[0].value);
                          } else if (enableCustomCreation && searchTerm.trim()) {
                            handleApplyCustomValue();
                          }
                        }
                      }}
                      placeholder={searchPlaceholder}
                      className="w-full h-8 pl-8 pr-2.5 text-xs bg-slate-50 dark:bg-zinc-800/70 border border-slate-200 dark:border-zinc-700/60 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#0C2086]/50 focus:border-[#0C2086]"
                    />
                  </div>
                </div>
              )}

              <div className={`overflow-y-auto space-y-0.5 ${enableSearch ? 'max-h-52' : 'max-h-60'} pr-0.5`}>
                {enableCustomCreation && searchTerm.trim().length > 0 && !exactMatchExists && (
                  <button
                    type="button"
                    onClick={handleApplyCustomValue}
                    className="w-full flex items-center gap-2 p-2 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 text-[#0C2086] dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors text-left font-medium mb-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 shrink-0 text-[#0C2086] dark:text-blue-400" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold">
                        Use custom: <span className="underline italic">"{searchTerm.trim()}"</span>
                      </div>
                      <div className="text-[10px] text-blue-600/70 dark:text-blue-400/70 font-mono">
                        Press Enter or click to apply
                      </div>
                    </div>
                  </button>
                )}

                {filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelectOption(opt.value)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                        isSelected
                          ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-bold'
                          : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate min-w-0 pr-2">
                        {opt.icon}
                        <div className="truncate min-w-0">
                          <div className="truncate font-medium">{opt.label}</div>
                          {opt.sublabel && (
                            <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                              {opt.sublabel}
                            </div>
                          )}
                        </div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#0C2086] dark:text-blue-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {helperText && (
        <p className="text-[11px] text-slate-400 dark:text-zinc-500">{helperText}</p>
      )}
    </div>
  );
}
```

---

#### 2.3 `InputSharedComponent.tsx`
- **File**: `src/Shared/Components/InputSharedComponent.tsx`
- **Export**: `default function InputSharedComponent`

```tsx
import React from 'react';

export interface InputSharedComponentProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
  placeholder?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  required?: boolean;
  disabled?: boolean;
  name?: string;
}

export default function InputSharedComponent({
  label,
  error,
  icon,
  fullWidth = true,
  className = '',
  placeholder = '',
  value = '',
  onChange,
  type = 'text',
  min,
  max,
  step,
  required = false,
  disabled = false,
  name,
}: InputSharedComponentProps): React.JSX.Element {
  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <div className={`flex flex-col gap-1.5 ${widthStyle}`}>
      {label && (
        <label className="text-xs font-medium text-slate-600 dark:text-zinc-400">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3 text-slate-400 dark:text-zinc-500 pointer-events-none flex items-center">
            {icon}
          </div>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          required={required}
          disabled={disabled}
          className={`h-10 text-sm px-3 py-2 rounded-md bg-white dark:bg-[#0a0a0c] text-slate-900 dark:text-zinc-100 hairline-border-strong focus:outline-none focus:border-zinc-900 dark:focus:border-white transition-colors duration-200 ${
            icon ? 'pl-9' : ''
          } ${error ? 'border-red-500 dark:border-red-500' : ''} ${className} ${widthStyle}`}
        />
      </div>
      {error && <span className="text-xs text-rose-500 mt-0.5">{error}</span>}
    </div>
  );
}
```

---

### Module 3: Actions & Buttons

#### 3.1 `ButtonSharedComponent.tsx`
- **File**: `src/Shared/Components/ButtonSharedComponent.tsx`
- **Export**: `default function ButtonSharedComponent`

```tsx
import React from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';

export interface ButtonSharedComponentProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  loadingText?: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  title?: string;
}

export default function ButtonSharedComponent({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon,
  rightIcon,
  fullWidth = false,
  disabled = false,
  isLoading = false,
  loadingText,
  type = 'button',
  className = '',
  title,
}: ButtonSharedComponentProps): React.JSX.Element {
  let baseStyles =
    'inline-flex items-center justify-center font-medium rounded-md cursor-pointer select-none transition-colors duration-200 focus:outline-none whitespace-nowrap';

  let sizeStyles = '';
  if (size === 'sm') {
    sizeStyles = 'px-3 py-1.5 text-xs h-8 gap-1.5';
  } else if (size === 'lg') {
    sizeStyles = 'px-5 py-2.5 text-sm h-11 gap-2.5';
  } else {
    sizeStyles = 'px-4 py-2 text-sm h-9 gap-2';
  }

  let variantStyles = '';
  if (variant === 'primary') {
    variantStyles =
      'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white shadow-sm';
  } else if (variant === 'ghost') {
    variantStyles =
      'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 hairline-border';
  } else if (variant === 'outline') {
    variantStyles =
      'bg-transparent text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800/60 hairline-border-strong';
  } else if (variant === 'danger') {
    variantStyles = 'bg-red-600 text-white hover:bg-red-700 shadow-sm';
  }

  const widthStyle = fullWidth ? 'w-full' : '';
  const isButtonDisabled = disabled || isLoading;
  const disabledStyle = isButtonDisabled ? 'opacity-70 cursor-not-allowed pointer-events-none' : '';

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isButtonDisabled}
      title={title}
      whileHover={isButtonDisabled ? {} : { scale: 1.01 }}
      whileTap={isButtonDisabled ? {} : { scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${widthStyle} ${disabledStyle} ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-current" />
      ) : (
        icon && <span className="inline-flex items-center shrink-0">{icon}</span>
      )}
      <span className="inline-flex items-center whitespace-nowrap">{isLoading && loadingText ? loadingText : children}</span>
      {!isLoading && rightIcon && (
        <span className="inline-flex items-center shrink-0">{rightIcon}</span>
      )}
    </motion.button>
  );
}
```

---

#### 3.2 `PrimaryActionButtonSharedComponent.tsx`
- **File**: `src/Shared/Components/PrimaryActionButtonSharedComponent.tsx`
- **Export**: `default function PrimaryActionButtonSharedComponent`
- **Purpose**: Canonical primary CTA button wrapper enforcing the `#0C2086` brand sapphire palette and white text/icon contrast.

```tsx
import React from 'react';
import { Plus } from 'lucide-react';
import ButtonSharedComponent from './ButtonSharedComponent';

export interface PrimaryActionButtonSharedComponentProps {
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  isLoading?: boolean;
  loadingText?: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export default function PrimaryActionButtonSharedComponent({
  label,
  onClick,
  icon = <Plus className="w-3.5 h-3.5 !text-white" />,
  disabled = false,
  isLoading = false,
  loadingText,
  type = 'button',
  className = '',
}: PrimaryActionButtonSharedComponentProps): React.JSX.Element {
  return (
    <ButtonSharedComponent
      variant="primary"
      size="sm"
      type={type}
      onClick={onClick}
      disabled={disabled}
      isLoading={isLoading}
      loadingText={loadingText}
      className={`!bg-[#0C2086] hover:!bg-[#081765] !text-white border-none shadow-sm font-semibold shrink-0 ${className}`}
      icon={icon}
    >
      <span className="!text-white font-medium">{label}</span>
    </ButtonSharedComponent>
  );
}
```

---

### Module 4: States, Security & Badges

#### 4.1 `BadgeSharedComponent.tsx`
- **File**: `src/Shared/Components/BadgeSharedComponent.tsx`
- **Export**: `default function BadgeSharedComponent`

```tsx
import React from 'react';

export interface BadgeSharedComponentProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  showDot?: boolean;
  className?: string;
}

export default function BadgeSharedComponent({
  children,
  variant = 'neutral',
  size = 'md',
  showDot = false,
  className = '',
}: BadgeSharedComponentProps): React.JSX.Element {
  let baseStyles = 'inline-flex items-center font-mono font-medium rounded-full';
  
  let sizeStyles = size === 'sm' ? 'text-[10px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5';

  let variantStyles = '';
  let dotStyles = '';

  switch (variant) {
    case 'success':
      variantStyles = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      dotStyles = 'bg-emerald-500';
      break;
    case 'warning':
      variantStyles = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
      dotStyles = 'bg-amber-500';
      break;
    case 'danger':
      variantStyles = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
      dotStyles = 'bg-rose-500';
      break;
    case 'info':
      variantStyles = 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20';
      dotStyles = 'bg-sky-500';
      break;
    case 'neutral':
    default:
      variantStyles = 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700';
      dotStyles = 'bg-slate-400 dark:bg-zinc-500';
      break;
  }

  return (
    <span className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}>
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotStyles} animate-pulse shrink-0`} />
      )}
      {children}
    </span>
  );
}
```

---

#### 4.2 `EmptyStateSharedComponent.tsx`
- **File**: `src/Shared/Components/EmptyStateSharedComponent.tsx`
- **Export**: `default function EmptyStateSharedComponent`

```tsx
import React from 'react';
import { motion } from 'motion/react';

export interface EmptyStateSharedComponentProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionButton?: React.ReactNode;
  className?: string;
}

export default function EmptyStateSharedComponent({
  icon,
  title,
  description,
  actionButton,
  className = '',
}: EmptyStateSharedComponentProps): React.JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`py-12 px-6 rounded-xl bg-white dark:bg-[#0d0d10] border border-slate-300/90 dark:border-zinc-800 shadow-sm dark:shadow-2xs text-center flex flex-col items-center justify-center select-none ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700/60 shadow-2xs flex items-center justify-center mb-3 text-slate-400 dark:text-zinc-500 shrink-0">
        {icon}
      </div>

      <h3 className="text-lg font-semibold text-slate-700 dark:text-zinc-300 font-serif-headline tracking-tight">
        {title}
      </h3>

      <p className="text-xs text-slate-400 dark:text-zinc-500 max-w-sm mx-auto leading-relaxed mt-1.5 font-sans">
        {description}
      </p>

      {actionButton && <div className="mt-4">{actionButton}</div>}
    </motion.div>
  );
}
```

---

#### 4.3 `PermissionGuardSharedComponent.tsx`
- **File**: `src/Shared/Components/PermissionGuardSharedComponent.tsx`
- **Export**: `default function PermissionGuardSharedComponent`

```tsx
import React from 'react';
import { UserRoleType } from '@/src/Types';
import useAuthenticationStateStore from '@/src/Store/AuthenticationStateStore';
import ApplicationPermissionService from '@/src/Services/ApplicationPermissionService';

export interface PermissionGuardSharedComponentProps {
  permission: Set<UserRoleType>;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Declarative component that conditionally renders its children only if
 * the current authenticated user's role is included in the allowed permission set.
 */
export default function PermissionGuardSharedComponent({
  permission,
  children,
  fallback = null,
}: PermissionGuardSharedComponentProps): React.JSX.Element | null {
  const userRole = useAuthenticationStateStore((state) => state.user?.role);
  const hasAccess = ApplicationPermissionService.current.hasPermission(permission);

  if (!hasAccess) {
    return fallback ? <React.Fragment>{fallback}</React.Fragment> : null;
  }

  return <React.Fragment>{children}</React.Fragment>;
}
```

---

### Module 5: Theming & View Transitions

#### 5.1 `ThemeToggleSharedComponent.tsx`
- **File**: `src/Shared/Components/ThemeToggleSharedComponent.tsx`
- **Export**: `default function ThemeToggleSharedComponent`

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

---

#### 5.2 `AnimatedThemeToggleSharedComponent.tsx`
- **File**: `src/Shared/Components/AnimatedThemeToggleSharedComponent.tsx`
- **Export**: `default function AnimatedThemeToggleSharedComponent`
- **Key Capabilities**: Native CSS View Transitions API (`startViewTransition`) executing spatial polygon clip-path expansions (`circle`, `square`, `triangle`, `diamond`, `hexagon`, `rectangle`, `star`) anchored from the clicked toggle button position across the entire viewport.

```tsx
import React, { useCallback, useEffect, useRef } from 'react';
import { Moon, Sun } from 'lucide-react';
import { flushSync } from 'react-dom';
import ApplicationThemeCON from '../../Constants/ApplicationThemeCON';

export type TransitionVariant =
  | 'circle'
  | 'square'
  | 'triangle'
  | 'diamond'
  | 'hexagon'
  | 'rectangle'
  | 'star';

export interface AnimatedThemeToggleSharedComponentProps {
  currentTheme?: string;
  onToggleTheme?: () => void;
  duration?: number;
  variant?: TransitionVariant;
  fromCenter?: boolean;
  className?: string;
}

function polygonCollapsed(point: string, vertexCount: number): string {
  const pairs = Array.from({ length: vertexCount }, () => point).join(', ');
  return `polygon(${pairs})`;
}

function getThemeTransitionClipPaths(
  variant: TransitionVariant,
  cx: number,
  cy: number,
  maxRadius: number,
  viewportWidth: number,
  viewportHeight: number
): [string, string] {
  const toX = (x: number) => `${(x / viewportWidth) * 100}%`;
  const toY = (y: number) => `${(y / viewportHeight) * 100}%`;
  const point = (x: number, y: number) => `${toX(x)} ${toY(y)}`;
  const toRadius = (r: number) =>
    `${(r / (Math.hypot(viewportWidth, viewportHeight) / Math.SQRT2)) * 100}%`;

  switch (variant) {
    case 'circle':
      return [
        `circle(0% at ${point(cx, cy)})`,
        `circle(${toRadius(maxRadius)} at ${point(cx, cy)})`,
      ];
    case 'square': {
      const halfW = Math.max(cx, viewportWidth - cx);
      const halfH = Math.max(cy, viewportHeight - cy);
      const halfSide = Math.max(halfW, halfH) * 1.05;
      const end = [
        point(cx - halfSide, cy - halfSide),
        point(cx + halfSide, cy - halfSide),
        point(cx + halfSide, cy + halfSide),
        point(cx - halfSide, cy + halfSide),
      ].join(', ');
      return [polygonCollapsed(point(cx, cy), 4), `polygon(${end})`];
    }
    case 'triangle': {
      const scale = maxRadius * 2.2;
      const dx = (Math.sqrt(3) / 2) * scale;
      const verts = [
        point(cx, cy - scale),
        point(cx + dx, cy + 0.5 * scale),
        point(cx - dx, cy + 0.5 * scale),
      ].join(', ');
      return [polygonCollapsed(point(cx, cy), 3), `polygon(${verts})`];
    }
    case 'diamond': {
      const R = maxRadius * Math.SQRT2;
      const end = [
        point(cx, cy - R),
        point(cx + R, cy),
        point(cx, cy + R),
        point(cx - R, cy),
      ].join(', ');
      return [polygonCollapsed(point(cx, cy), 4), `polygon(${end})`];
    }
    case 'hexagon': {
      const R = maxRadius * Math.SQRT2;
      const verts: string[] = [];
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 3;
        verts.push(point(cx + R * Math.cos(a), cy + R * Math.sin(a)));
      }
      return [polygonCollapsed(point(cx, cy), 6), `polygon(${verts.join(', ')})`];
    }
    case 'rectangle': {
      const halfW = Math.max(cx, viewportWidth - cx);
      const halfH = Math.max(cy, viewportHeight - cy);
      const end = [
        point(cx - halfW, cy - halfH),
        point(cx + halfW, cy - halfH),
        point(cx + halfW, cy + halfH),
        point(cx - halfW, cy + halfH),
      ].join(', ');
      return [polygonCollapsed(point(cx, cy), 4), `polygon(${end})`];
    }
    case 'star': {
      const R = maxRadius * Math.SQRT2 * 1.03;
      const innerRatio = 0.42;
      const starPolygon = (radius: number) => {
        const verts: string[] = [];
        for (let i = 0; i < 5; i++) {
          const outerA = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
          verts.push(
            point(cx + radius * Math.cos(outerA), cy + radius * Math.sin(outerA))
          );
          const innerA = outerA + Math.PI / 5;
          verts.push(
            point(
              cx + radius * innerRatio * Math.cos(innerA),
              cy + radius * innerRatio * Math.sin(innerA)
            )
          );
        }
        return `polygon(${verts.join(', ')})`;
      };
      const startR = Math.max(2, R * 0.025);
      return [starPolygon(startR), starPolygon(R)];
    }
    default:
      return [
        `circle(0% at ${point(cx, cy)})`,
        `circle(${toRadius(maxRadius)} at ${point(cx, cy)})`,
      ];
  }
}

export default function AnimatedThemeToggleSharedComponent({
  currentTheme,
  onToggleTheme,
  duration = 450,
  variant = 'circle',
  fromCenter = false,
  className = '',
}: AnimatedThemeToggleSharedComponentProps): React.JSX.Element {
  const isDark = currentTheme === ApplicationThemeCON.DARK;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isTransitioningRef = useRef<boolean>(false);
  const activeAnimRef = useRef<Animation | null>(null);

  const cancelAnim = useCallback(() => {
    activeAnimRef.current?.cancel();
    activeAnimRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      cancelAnim();
      const root = document.documentElement;
      if (root.dataset.magicuiThemeVt !== 'active') return;
      delete root.dataset.magicuiThemeVt;
      root.style.removeProperty('--magicui-theme-toggle-vt-duration');
      root.style.removeProperty('--magicui-theme-vt-clip-from');
    };
  }, [cancelAnim]);

  const handleToggle = useCallback(() => {
    const button = buttonRef.current;
    if (
      !button ||
      isTransitioningRef.current ||
      document.documentElement.dataset.magicuiThemeVt === 'active'
    ) {
      onToggleTheme?.();
      return;
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x: number;
    let y: number;
    if (fromCenter) {
      x = viewportWidth / 2;
      y = viewportHeight / 2;
    } else {
      const { top, left, width, height } = button.getBoundingClientRect();
      x = left + width / 2;
      y = top + height / 2;
    }

    const maxRadius = Math.hypot(
      Math.max(x, viewportWidth - x),
      Math.max(y, viewportHeight - y)
    );

    const applyTheme = () => {
      onToggleTheme?.();
    };

    if (
      typeof document === 'undefined' ||
      !(document as any).startViewTransition
    ) {
      applyTheme();
      return;
    }

    const clipPath = getThemeTransitionClipPaths(
      variant,
      x,
      y,
      maxRadius,
      viewportWidth,
      viewportHeight
    );

    const root = document.documentElement;
    root.dataset.magicuiThemeVt = 'active';
    root.style.setProperty('--magicui-theme-toggle-vt-duration', `${duration}ms`);
    root.style.setProperty('--magicui-theme-vt-clip-from', clipPath[0]);

    const cleanup = () => {
      clearTimeout(safetyTimer);
      isTransitioningRef.current = false;
      delete root.dataset.magicuiThemeVt;
      root.style.removeProperty('--magicui-theme-toggle-vt-duration');
      root.style.removeProperty('--magicui-theme-vt-clip-from');
      cancelAnim();
    };

    const safetyTimer = setTimeout(cleanup, duration + 200);

    isTransitioningRef.current = true;
    const transition = (document as any).startViewTransition(() => {
      flushSync(applyTheme);
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
          const anim = document.documentElement.animate(
            {
              clipPath,
            },
            {
              duration,
              easing: variant === 'star' ? 'linear' : 'cubic-bezier(0.16, 1, 0.3, 1)',
              fill: 'forwards',
              pseudoElement: '::view-transition-new(root)',
            }
          );
          activeAnimRef.current = anim;
        })
        .catch(() => {});
    }
  }, [variant, fromCenter, duration, onToggleTheme, cancelAnim]);

  return (
    <button
      type="button"
      ref={buttonRef}
      onClick={handleToggle}
      aria-label="Toggle light and dark theme"
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 transition-all shadow-sm cursor-pointer flex items-center justify-center ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-90 duration-300" />
      ) : (
        <Moon className="w-4 h-4 text-slate-700 animate-in spin-in-90 duration-300" />
      )}
    </button>
  );
}
```

---

## 10. Operational Invariants & Zero-Mock Data Specification

### 1. Strict 2-Column Form Layout
- Multi-section forms adhere strictly to `grid grid-cols-1 md:grid-cols-2 gap-4`.
- A maximum of 2 inputs are permitted per row. If a section contains an odd number of inputs (e.g. 3), the 3rd input is positioned on a new line taking `md:col-span-1` (exactly half-width).
- All input text boxes & custom dropdown triggers are standardized to `h-10` (`40px`).
- Label header containers are standardized to `h-4.5` (`18px`) with `mb-1.5` margins for baseline alignment across mixed inputs.

### 2. Metric Grid Constraints
- Metric cards across dashboards and modal overviews **MUST** constrain to a maximum of 3 cards per row on large displays: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3`.

### 3. Zero-Mock Data Invariant
- Every number, string, status, and relationship shown on screen must be derived from backend API queries.
- When an entity dataset is empty (0 assets, 0 employees, 0 software licenses), never invent fallback demo items. Always render [`EmptyStateSharedComponent.tsx`](#42-emptystatesharedcomponenttsx).

---

*Authored and Certified for Monitoring Dashboard App Codebase Architecture.*
