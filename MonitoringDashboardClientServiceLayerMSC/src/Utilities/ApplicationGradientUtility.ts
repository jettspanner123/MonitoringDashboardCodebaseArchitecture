// Mirrors ApplicationThemeUtility's exact storage/DOM-class pattern: a class
// on <html> that CSS reacts to (see index.css's `.no-gradients` rule),
// session-scoped with a localStorage fallback for new tabs.
export default class ApplicationGradientUtility {
  public static current: ApplicationGradientUtility = new ApplicationGradientUtility();

  private preferenceKey: string = 'monitoring_dashboard_gradient_preference';

  public getSavedPreference(): boolean {
    if (typeof window !== 'undefined') {
      try {
        const sessionValue = sessionStorage.getItem(this.preferenceKey);
        if (sessionValue === 'on' || sessionValue === 'off') {
          return sessionValue === 'on';
        }

        const localValue = localStorage.getItem(this.preferenceKey);
        if (localValue === 'on' || localValue === 'off') {
          sessionStorage.setItem(this.preferenceKey, localValue);
          return localValue === 'on';
        }
      } catch {
        // Ignore storage access errors
      }
    }
    return true; // Default to gradients enabled
  }

  public applyPreference(enabled: boolean): void {
    if (typeof window === 'undefined') return;
    const value = enabled ? 'on' : 'off';
    try {
      sessionStorage.setItem(this.preferenceKey, value);
      localStorage.setItem(this.preferenceKey, value);
    } catch {
      // Ignore storage access errors
    }
    document.documentElement.classList.toggle('no-gradients', !enabled);
  }

  public togglePreference(currentEnabled: boolean): boolean {
    const next = !currentEnabled;
    this.applyPreference(next);
    return next;
  }
}
