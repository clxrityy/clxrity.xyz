import { initialProcessesState } from "@/config";
import { useProcessDirectoryStore } from "@/contexts/process/useProcessDirectory";
import { contextFactory } from "@/util/contextFactory";
import { Processes } from "@/contexts/process/useProcessDirectory";

export type ProcessDirectoryContextState = {
  processes: Processes;
  close: (id: string) => void;
  open: (id: string) => void;
  maximize: (id: string) => void;
  minimize: (id: string) => void;
};

const { Provider } = contextFactory(
  initialProcessesState,
  useProcessDirectoryStore,
);

export {
  Provider as ProcessDirectoryProvider,
  useProcessDirectoryStore as useProcessDirectory,
};
