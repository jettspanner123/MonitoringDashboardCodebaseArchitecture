export default class DurationFormatHelper {
    public static current = new DurationFormatHelper();

    // Used for "Took more than {duration} to load." messages - formats
    // whichever unit reads more naturally (e.g. 150000 -> "2.5 minutes",
    // 60000 -> "1 minute", 45000 -> "45 seconds").
    public formatMs(ms: number): string {
        if (ms >= 60000) {
            const minutes = Number((ms / 60000).toFixed(2));
            return `${minutes} minute${minutes === 1 ? '' : 's'}`;
        }

        const seconds = Number((ms / 1000).toFixed(2));
        return `${seconds} second${seconds === 1 ? '' : 's'}`;
    }
}
