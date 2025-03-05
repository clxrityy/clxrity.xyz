import { FileSystemContextState } from "../context/fileSystem";
import { ProcessContextState } from "../context/process";
import { SessionContextState } from "../context/session";

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
