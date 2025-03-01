"use client";

import { Dispatch, SetStateAction } from "react";
import { initialSessionContextState } from "./initialStates";
import { contextFactory } from "./contextFactory";
import { useSessionContextState } from "@/hooks/useSessionContextState";

export type Theme = "dark" | "system" | "light";

export type SessionContextState = {
  data: {
    [key: string]: string;
  };
  settings: {
    theme: Theme;
  };
  setTheme: ((theme: Theme) => void) | Dispatch<SetStateAction<Theme>>;
};

const { Consumer, Provider } = contextFactory<SessionContextState>(
  initialSessionContextState,
  useSessionContextState,
);

export { Consumer as SessionConsumer, Provider as SessionProvider };
