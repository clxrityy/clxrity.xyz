import { processDirectory } from "@/contexts/process/useProcessDirectory";
import { SessionContextState } from "@/contexts/session/session";
import { type ProcessDirectoryContextState } from "@/contexts/process/processDirectory";

export const initialSessionContextState: SessionContextState = {
  sessionId: "",
  data: {},
  settings: {
    theme: "dark",
    wallpaper: {},
    defaultProcessPosition: {
      x: 50,
      y: 50,
    },
    defaultProcessSize: {
      width: 400,
      height: 300,
    },
  },
  setData() {
    return null;
  },
  setSessionId() {
    return null;
  },
  setTheme() {
    return null;
  },
  useWallpaper() {
    return null;
  },
  setSettings() {
    return null;
  },
  currentProcesses: {},
  setCurrentProcesses() {
    return [];
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
