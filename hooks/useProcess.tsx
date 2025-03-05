/* eslint-disable prettier/prettier */
"use client";
import { ProcessContextState } from "@/context/process";
import { Process, type Processes } from "@/util/processDirectory";
import { JSX, useCallback, useState } from "react";
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

export type ProcessesMap = (
  callback: ([id, process]: [string, Process]) => JSX.Element,
) => JSX.Element[];

export const useProcess = (): ProcessContextState => {
  const [processes, setProcesses] = useState<Processes>({});

  const close = useCallback((id: string) => setProcesses(closeProcess(id)), []);
  const open = useCallback((id: string) => setProcesses(openProcess(id)), []);

  const processesMap = useCallback<ProcessesMap>(
    (callback) => Object.entries(processes).map(callback),
    [processes]
  );

  return {
    close,
    open,
    processesMap,
  };
};
