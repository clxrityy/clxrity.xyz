import { processDirectory } from "@/hooks/useProcessDirectory";
import { SessionContextState } from "@/context/session";
import { type ProcessDirectoryContextState } from "@/context/processDirectory";

export const initialSessionContextState: SessionContextState = {
  data: {},
  settings: {
    theme: "dark",
    wallpaper: {},
    processPosition: {
      x: 50,
      y: 50,
    },
    processSize: {
      width: 400,
      height: 300,
    },
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
