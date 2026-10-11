export default class ClipboardUtility {
  public static current: ClipboardUtility = new ClipboardUtility();

  public async writeText(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
}
