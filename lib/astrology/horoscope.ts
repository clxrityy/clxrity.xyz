import { ZodiacSignKey } from "./zodiac";

const API_URL = process.env.HOROSCOPE_API_URL;

export interface HoroscopeResponse<T = "daily" | "weekly" | "monthly"> {
    data: T extends "daily" ? { date: string; horoscope_data: string }
    : T extends "weekly" ? { week: string; horoscope_data: string }
    : T extends "monthly" ? { month: string; standout_days: string; challenging_days: string; horoscope_data: string }
    : never;
    status: number;
    success: boolean;
}

export async function fetchHoroscope(sign: ZodiacSignKey, timePeriod: "daily" | "weekly" | "monthly"): Promise<HoroscopeResponse> {
    if (!API_URL) throw new Error("HOROSCOPE_API_URL not configured");

    // # Examples: 
    // ## DAILY
    /**
     * curl -X 'GET' \
     * {API_URL}get-horoscope/daily?sign=taurus&day=TODAY \
     * -H 'accept: application/json'
     * 
     * 
     * ```json
     * {
     *  "data": {
     *   "date": "Sep 19, 2025",
     *   "horoscope_data": "..."
     *  },
     *  "status": 200,
     *  "success": true
     * }
     * ```
     */
    // ## WEEKLY
    /**
     * curl -X 'GET' \
     * {API_URL}get-horoscope/weekly?sign=taurus \
     * -H 'accept: application/json'
     * 
     * ```json
     * {
     *    "data": {
     *      "horoscope_data": "...",
     *      "week": "Sep 15, 2025 - Sep 21, 2025"
     *    },
     *   "status": 200,
     *   "success": true
     * }
     * ```
     */
    // ## MONTHLY
    /**
     * curl -X 'GET' \
     * {API_URL}get-horoscope/monthly?sign=taurus \
     * -H 'accept: application/json'
     * 
     * ```json
     * {
     *   "data": {
     *     "challenging_days": "5, 12, 24",
     *     "horoscope_data": "...",
     *     "month": "September 2025",
     *     "standout_days": "2, 11, 19"
     *   },
     *   "status": 200,
     *   "success": true
     * }
     * ```
     */

    const url = `${API_URL}get-horoscope/${timePeriod}?sign=${sign}${timePeriod === "daily" ? "&day=TODAY" : ""}`;

    const res = await fetch(url, { method: 'GET', headers: { 'accept': 'application/json' } });

    if (!res.ok) {
        throw new Error(`Horoscope API error: ${res.status} ${res.statusText}`);
    }

    const json = await res.json().then(j => j as HoroscopeResponse<typeof timePeriod>);

    return json;
}