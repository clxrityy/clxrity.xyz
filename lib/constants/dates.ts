export const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
] as const;
export type MonthName = typeof MONTH_NAMES[number];
