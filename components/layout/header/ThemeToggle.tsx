"use client";
import { IconSun, IconMoon } from "../../icons";
import { useTheme } from "../../ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button type="button" className="icon-btn" aria-label="Toggle theme" onClick={toggle}>
      {theme === 'light' ? <IconMoon /> : <IconSun />}
    </button>
  );
}
