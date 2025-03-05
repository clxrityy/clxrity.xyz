import { useProcessContextState } from "@/hooks/useProcessContextState";
import { initialProcessesState } from "./initialStates";
import { contextFactory } from "../util/contextFactory";
import { Processes } from "@/util/processDirectory";

export type ProcessContextState = {
  close: (id: string) => void;
  open: (id: string) => void;
  processes: Processes;
};

const { Consumer, Provider } = contextFactory(
  initialProcessesState,
  useProcessContextState,
);

export { Consumer as ProcessConsumer, Provider as ProcessProvider };
