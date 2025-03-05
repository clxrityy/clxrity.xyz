import {
  ProcessesMap,
  useProcessContextState,
} from "@/hooks/useProcessContextState";
import { initialProcessesState } from "./initialStates";
import { contextFactory } from "../util/contextFactory";

export type ProcessContextState = {
  close: (id: string) => void;
  open: (id: string) => void;
  processesMap: ProcessesMap;
};

const { Consumer, Provider, useContext } = contextFactory(
  initialProcessesState,
  useProcessContextState,
);

export {
  Consumer as ProcessConsumer,
  Provider as ProcessProvider,
  useContext as useProcessContext,
};
