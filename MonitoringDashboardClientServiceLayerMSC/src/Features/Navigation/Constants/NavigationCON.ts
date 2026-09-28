import type { LucideIcon } from 'lucide-react';
import { Activity, Boxes, FileSignature } from 'lucide-react';

export interface NavItemDef {
  id: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
}

export default class NavigationCON {
  public static readonly BRAND_TITLE: string = 'ObservaCore';
  public static readonly BRAND_SUBTITLE: string = 'Smoke Test Monitor';

  // Top-nav capsule, ported 1:1 (visual + shared-layout-pill mechanics) from SignForge's
  // HeaderStaticComponent internal view switcher. Unlike SignForge's version (which
  // switches between real internal views of the same app), these options represent
  // separate sibling applications. Only this app's own entry is enabled today; the
  // others are intentionally disabled placeholders until wired up.
  public static readonly PRIMARY_NAV_ITEMS: NavItemDef[] = [
    { id: 'morning-smoke-test', label: 'Morning Smoke Test', icon: Activity },
    { id: 'assetsphere', label: 'Assetsphere', icon: Boxes, disabled: true },
    { id: 'signforge', label: 'SignForge', icon: FileSignature, disabled: true },
  ];

  // This dashboard has no authentication system, so the profile dropdown's identity
  // block is always this static, generic content - mirroring what SignForge itself
  // shows for its own no-user fallback state.
  public static readonly PROFILE_INITIALS: string = 'MD';
  public static readonly PROFILE_DISPLAY_NAME: string = 'Enterprise User';
  public static readonly PROFILE_DISPLAY_EMAIL: string = 'user@theweplm.com';
  public static readonly PROFILE_DISPLAY_ROLE: string = 'USER';

  public static readonly SIGN_OUT_TITLE: string = 'Sign Out of Monitoring Dashboard';
  public static readonly SIGN_OUT_SUBTITLE: string = 'Enterprise Session Termination';
  public static readonly SIGN_OUT_DESCRIPTION: string =
    'Are you sure you want to sign out of your enterprise session? You will need to log back in to access your dashboard.';
}
