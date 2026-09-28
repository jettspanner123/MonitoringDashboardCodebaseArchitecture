export default class NavigationCON {
  public static readonly BRAND_TITLE: string = 'Monitoring Dashboard';
  public static readonly BRAND_SUBTITLE: string = 'Smoke Test Monitor';

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
