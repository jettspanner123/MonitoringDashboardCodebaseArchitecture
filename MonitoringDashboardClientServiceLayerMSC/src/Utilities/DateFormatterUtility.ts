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
}
