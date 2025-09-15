"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";
type ThemeContextValue = { theme: Theme; toggle: () => void; set: (t: Theme) => void };

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: Readonly<{ children: React.ReactNode }>) {
    // Important: Use a deterministic initial value so SSR and the first client render match.
    // We'll sync to the real user preference (from localStorage or system) after mount.
    const [theme, setTheme] = useState<Theme>('light');
    // Sync (only runs client)
    // Initial sync and optional system listener
    useEffect(() => {
        const LS_KEY = 'theme';
        const stored = (localStorage.getItem(LS_KEY) as Theme | null);
        let cleanup: (() => void) | undefined;
        if (stored && stored !== theme) {
            setTheme(stored);
        } else if (!stored) {
            const mql = window.matchMedia('(prefers-color-scheme: dark)');
            // Set initial based on system preference
            const sysTheme: Theme = mql.matches ? 'dark' : 'light';
            if (sysTheme !== theme) setTheme(sysTheme);
            const listener = (e: MediaQueryListEvent) => setTheme(e.matches ? 'dark' : 'light');
            mql.addEventListener('change', listener);
            cleanup = () => mql.removeEventListener('change', listener);
        }
        return () => { cleanup?.(); };
        // We intentionally exclude 'theme' from deps to avoid re-running when user toggles manually.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);
    const value = useMemo(() => ({ theme, toggle: () => setTheme(t => (t === 'light' ? 'dark' : 'light')), set: setTheme }), [theme]);
    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
    return ctx;
}
