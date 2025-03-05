/* eslint-disable prettier/prettier */
"use client";
import { ProcessContextState } from "@/context/process";
import { type Processes } from "@/util/processDirectory";
import { useCallback, useState } from "react";
import { processDirectory } from "@/util/processDirectory";

const closeProcess =
  (processId: string) =>
    ({ [processId]: _closedProcess, ...remainingProcesses }: Processes) =>
      remainingProcesses;

const openProcess = (processId: string) => (currentProcesses: Processes) =>
  currentProcesses[processId]
    ? currentProcesses
    : {
      ...currentProcesses,
      [processId]: processDirectory[processId],
    };

export const useProcessContextState = (): ProcessContextState => {
  const [processes, setProcesses] = useState<Processes>({});

  const close = useCallback((id: string) => setProcesses(closeProcess(id)), []);
  const open = useCallback((id: string) => setProcesses(openProcess(id)), []);

  return {
    close,
    open,
    processes,
  };
};
