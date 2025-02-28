"use client";
import { createContext, useState } from "react";
import { Processes, processDirectory } from "@/util/processDirectory";
import { useProcessContextState } from "@/hooks/useProcessContextState";
import { initialProcessesState } from "./initialStates";

export const {Provider, Consumer} = createContext<ProcessContextState>(
  initialProcessesState,
);

export type ProcessContextState = {
  processes: Processes;
};

export const ProcessProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [processes] = useState<typeof processDirectory>(processDirectory);

  return (
    <Provider value={useProcessContextState(processes)}>
      {children}
    </Provider>
  );
};

export const ProcessConsumer = Consumer;
