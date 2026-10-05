
export default class ApplicationDateTimeHelper {
    public static current = new ApplicationDateTimeHelper();

    public parseTimeOfDay(text: string): Date | null {
        const match = text.match(/(\d{1,2}):(\d{2}):(\d{2})\s*([AP]M)/i);
        if (!match) return null;

        const [, hourStr, minuteStr, secondStr, meridiem] = match;
        let hour = Number(hourStr) % 12;
        if (meridiem.toUpperCase() === 'PM') hour += 12;

        const result = new Date();
        result.setHours(hour, Number(minuteStr), Number(secondStr), 0);
        return result;
    }

    public minutesOfDayDiff(a: Date, b: Date): number {
        const msPerDay = 24 * 60 * 60 * 1000;
        const rawDiffMs = Math.abs(a.getTime() - b.getTime());
        return Math.min(rawDiffMs, msPerDay - rawDiffMs) / 60000;
    }
}