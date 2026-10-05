export default class TanstackQueryKeysCON {
  public static runs(environment?: string): string[] {
    return environment ? ['runs', environment] : ['runs'];
  }

  public static runDetail(runId: string): string[] {
    return ['runs', 'detail', runId];
  }
}
