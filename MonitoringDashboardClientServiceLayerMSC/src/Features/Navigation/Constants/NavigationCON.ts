import type { LucideIcon } from 'lucide-react';
import { Activity, HeartPulse, ServerCog } from 'lucide-react';

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
  // HeaderStaticComponent internal view switcher. 'application-monitoring' shows every
  // registered MonitoredApplication at once (see ApplicationMonitorScreenController) -
  // it used to be one nav entry per app/slug, consolidated into a single page instead.
  // 'client-machines' is a different shape of entry than the others - it
  // isn't a MonitoredApplication slug, it's gated by its own pre-navigation
  // JWT login modal (see ApplicationRouter's handleActiveViewChange) rather
  // than navigating instantly, but it still rides the same activeView/
  // PARAM_APP mechanism as every other entry here.
  public static readonly PRIMARY_NAV_ITEMS: NavItemDef[] = [
    { id: 'morning-smoke-test', label: 'Morning Smoke Test', icon: Activity },
    { id: 'application-monitoring', label: 'Application Monitoring', icon: HeartPulse },
    { id: 'client-machines', label: 'Client Machines', icon: ServerCog },
  ];

  public static readonly APPLICATION_MONITORING_NAV_ID: string = 'application-monitoring';
  public static readonly CLIENT_MACHINES_NAV_ID: string = 'client-machines';

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

  public static readonly DELETE_ALL_DATA_TITLE: string = 'Delete All Test Data';
  public static readonly DELETE_ALL_DATA_SUBTITLE: string = 'This cannot be undone';
  public static readonly DELETE_ALL_DATA_DESCRIPTION: string =
    'This permanently deletes every run and every check recorded in the database — authentication, page load, indexing freshness, and queue status history. Tables are not dropped, only their data. This cannot be undone.';
  public static readonly DELETE_ALL_DATA_CONFIRM_PHRASE: string = 'DELETE';
}
