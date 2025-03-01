import { useProcessContextState } from "@/hooks/useProcessContextState";
import { initialProcessesState } from "./initialStates";
import { contextFactory } from "./contextFactory";
import { Processes } from "@/util/processDirectory";

export type ProcessContextState = {
  processes: Processes;
};

const { Consumer, Provider } = contextFactory(
  initialProcessesState,
  useProcessContextState,
);

export { Consumer as ProcessConsumer, Provider as ProcessProvider };
