export default class DateFormatterUtility {
  public static current = new DateFormatterUtility();

  public formatDateTime(isoString: string): string {
    return new Date(isoString).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  public formatTime(isoString: string): string {
    return new Date(isoString).toLocaleTimeString();
  }

  // "5 minutes ago" / "2 hours ago" / "3 days ago" - coarsest unit that still
  // reads as meaningful, matching how people actually describe "how long ago".
  public formatRelativeTime(isoString: string): string {
    const diffSeconds = Math.max(0, Math.floor((Date.now() - new Date(isoString).getTime()) / 1000));

    if (diffSeconds < 60) return `${diffSeconds} second${diffSeconds === 1 ? '' : 's'} ago`;

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  }
}
