export default class TanstackQueryKeysCON {
  public static readonly RUNS: string[] = ['runs'];

  public static runDetail(runId: string): string[] {
    return ['runs', runId];
  }
}
