import { processDirectory } from "@/hooks/useProcessDirectory";
import { SessionContextState } from "../context/session";
import { type ProcessDirectoryContextState } from "@/context/processDirectory";

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

export const initialProcessesState: ProcessDirectoryContextState = {
  close: () => undefined,
  open: () => undefined,
  // processesMap: () => [],
  processes: processDirectory,
  maximize: () => undefined,
  minimize: () => undefined,
};
