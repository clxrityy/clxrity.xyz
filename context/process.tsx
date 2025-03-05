import { ProcessesMap, useProcess } from "@/hooks/useProcess";
import { initialProcessesState } from "../config/initialStates";
import { contextFactory } from "../util/contextFactory";

export type ProcessContextState = {
  close: (id: string) => void;
  open: (id: string) => void;
  processesMap: ProcessesMap;
};

const { Consumer, Provider, useContext } = contextFactory(
  initialProcessesState,
  useProcess,
);

export {
  Consumer as ProcessConsumer,
  Provider as ProcessProvider,
  useContext as useProcessContext,
};
