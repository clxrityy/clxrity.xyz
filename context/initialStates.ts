import { ProcessContextState } from "./process";
import { SessionContextState } from "./session";

export const initialSessionContextState: SessionContextState = {
  data: {},
  settings: {
    theme: "dark",
  },
  setTheme() {
    return null;
  },
};

export const initialProcessesState: ProcessContextState = {
  processes: {},
};
