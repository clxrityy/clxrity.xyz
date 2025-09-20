import z from "zod";

export const boolish = z.preprocess((v) => {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') {
        const s = v.toLowerCase();
        if (s === 'true' || s === '1' || s === 'yes' || s === 'on') return true;
        if (s === 'false' || s === '0' || s === 'no' || s === 'off') return false;
    }
    if (typeof v === 'number') return v !== 0;
    return v;
}, z.boolean());