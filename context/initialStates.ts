import { ProcessContextState } from "./process";
import { SessionContextState } from "./session";

export const initialSessionContextState: SessionContextState = {
  data: {},
  settings: {
    theme: "dark",
    wallpaper: {},
  },
  setTheme() {
    return null;
  },
  useWallpaper() {
    return null;
  },
};

export const initialProcessesState: ProcessContextState = {
  processes: {},
};
