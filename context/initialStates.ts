import { FileSystemContextState } from "./fileSystem";
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
  close: () => undefined,
  open: () => undefined,
  processesMap: () => [],
};

export const initialFileSystemContextState: FileSystemContextState = {
  fs: null,
};
