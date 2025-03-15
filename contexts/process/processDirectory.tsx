import { initialProcessesState } from "@/config";
import {
  Processes,
  useProcessDirectoryStore,
} from "@/contexts/process/useProcessDirectory";
import { contextFactory } from "@/util/contextFactory";

export type ProcessDirectoryContextState = {
  processes: Processes;
  close: (id: string) => Processes | undefined;
  open: (id: string) => Processes | undefined;
  maximize: (id: string) => Processes | undefined;
  minimize: (id: string) => Processes | undefined;
};

const { Provider } = contextFactory(
  initialProcessesState,
  useProcessDirectoryStore,
);

export {
  Provider as ProcessDirectoryProvider,
  useProcessDirectoryStore as useProcessDirectory,
};
