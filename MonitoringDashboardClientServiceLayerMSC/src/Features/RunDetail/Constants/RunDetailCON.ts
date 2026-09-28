export default class RunDetailCON {
  public static readonly CHECK_TYPE_LABELS: Record<string, string> = {
    AuthenticationPing: 'Authentication Ping',
    AuthenticationLogin: 'Authentication Login',
    PageLoad: 'Page Load',
    IndexingFreshness: 'Indexing Freshness',
    QueueStatus: 'Queue Status',
  };
}
