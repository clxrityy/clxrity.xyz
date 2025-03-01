import { type SessionContextState } from "@/context/session";

export const useSessionContextState = (): SessionContextState => ({
  data: {},
  settings: {
    theme: "dark",
  },
  setTheme() {
    return null;
  },
});
