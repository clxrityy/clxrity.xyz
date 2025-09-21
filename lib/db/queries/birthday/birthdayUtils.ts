// Shared birthday date utilities used by both Edge and Node paths

import { MONTH_LENGTHS } from "@/lib/constants/dates";

export function isValidMonthDay(month: number, day: number): boolean {
    if (!Number.isInteger(month) || !Number.isInteger(day)) return false;
    if (month < 1 || month > 12) return false;
    const maxDay = MONTH_LENGTHS[month - 1];
    if (day < 1 || day > maxDay) return false;
    return true;
}

export function daysUntil(month: number, day: number, refDate = new Date()): number {
    const year = refDate.getUTCFullYear();
    const targetThisYear = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
    const nowUtc = Date.UTC(refDate.getUTCFullYear(), refDate.getUTCMonth(), refDate.getUTCDate(), 0, 0, 0, 0);
    if (targetThisYear >= nowUtc) {
        return Math.round((targetThisYear - nowUtc) / 86400000);
    }
    const nextYear = Date.UTC(year + 1, month - 1, day, 0, 0, 0, 0);
    return Math.round((nextYear - nowUtc) / 86400000);
}
