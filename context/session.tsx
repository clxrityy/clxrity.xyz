"use client"

import type React from "react"

import { createContext, Dispatch, SetStateAction, useContext, useEffect, useState } from "react"
import { initialSessionContextState } from "./initialStates"

export type Theme = "dark" | "system" | "light"

export type SessionContextState = {
  data: {
    [key: string]: string
  }
  settings: {
    theme: Theme
  }
  setTheme: ((theme: Theme) => void )| Dispatch<SetStateAction<Theme>>
}

const SessionContext = createContext<SessionContextState>({
  ...initialSessionContextState,
  setTheme: () => null,
})

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  // Get the effective theme (what should actually be applied)
  const getEffectiveTheme = (preference: Theme): "light" | "dark" => {
    if (preference === "system") {
      return typeof window !== "undefined" ? (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light") : "dark";
    }
    return preference
  }

  // Initialize theme state
  const [theme, setThemeState] = useState<Theme>(() => {
    // Only run on client
    if (typeof window === "undefined") return "system"

    // Check localStorage
    const stored = localStorage.getItem("theme") as Theme | null
    console.log("Stored theme:", stored)

    // If no stored preference, default to system
    if (!stored) {
      localStorage.setItem("theme", "system")
      return "system"
    }

    return stored
  })

  // Update theme and localStorage
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem("theme", newTheme)
  }

  // Effect to handle theme changes and system preference changes
  useEffect(() => {
    const root = window.document.documentElement

    const applyTheme = () => {
      const effectiveTheme = getEffectiveTheme(theme)
      console.log("Applying theme:", effectiveTheme)
      root.setAttribute("data-theme", effectiveTheme)
    }

    console.log("Current theme:", theme)
    applyTheme()

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") {
        applyTheme()
      }
    }

    mediaQuery.addEventListener("change", handleChange)

    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme])


  return (
    <SessionContext.Provider
      value={{
        data: {},
        settings: {
          theme,
        },
        setTheme,
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}

export const useSession = () => {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider")
  }
  return context
}

export const useTheme = () => {
  const {
    settings: { theme },
    setTheme,
  } = useSession()
  return { theme, setTheme }
}
