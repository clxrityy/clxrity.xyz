import { initialProcessesState } from "@/config/initialStates";
import { useProcessDirectoryStore } from "@/hooks/useProcessDirectory";
import { contextFactory } from "@/util/contextFactory";
import { Processes } from "@/hooks/useProcessDirectory";

export type ProcessDirectoryContextState = {
  processes: Processes;
  close: (id: string) => void;
  open: (id: string) => void;
};

const { Provider, useContext } = contextFactory(
  initialProcessesState,
  useProcessDirectoryStore,
);

export {
  Provider as ProcessDirectoryProvider,
  useContext as useProcessDirectoryContext,
};
