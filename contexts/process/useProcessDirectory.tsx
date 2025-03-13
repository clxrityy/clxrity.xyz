"use client";
import dynamic from "next/dynamic";
import { ComponentType } from "react";
import { ProcessDirectoryContextState } from "@/contexts/process/processDirectory";
import { create } from "zustand";

export type Process = {
  Component: ComponentType<{
    pid: string;
  }>;
  hasWindow?: boolean;
  icon: string;
  title: string;
  isOpen?: boolean;
  isMaximized?: boolean;
  isMinimized?: boolean;
};

export type Processes = {
  [pid: string]: Process;
};

export const processDirectory: Processes = {
  HelloWorld: {
    Component: dynamic(() =>
      import("@/components/modules/HelloWorld").then((mod) => mod.HelloWorld),
    ),
    icon: "/icons/HelloWorld.png",
    title: "HelloWorld",
    hasWindow: true,
  },
};

export const useProcessDirectoryStore = create<ProcessDirectoryContextState>(
  (set) => ({
    processes: processDirectory,
    close: (pid: string) =>
      set((proc) => {
        const { [pid]: _closedProcess, ...remainingProcesses } = proc.processes;
        remainingProcesses[pid] = {
          ...proc.processes[pid],
          isOpen: false,
        };
        return { ...proc, processes: remainingProcesses };
      }),
    open: (pid: string) =>
      set((proc) => ({
        ...proc,
        processes: {
          ...proc.processes,
          [pid]: {
            ...proc.processes[pid],
            isOpen: true,
          },
        },
      })),
    maximize: (pid: string) =>
      set((proc) => {
        const process = proc.processes[pid];
        return {
          ...proc,
          processes: {
            ...proc.processes,
            [pid]: {
              ...process,
              isMaximized: !process.isMaximized,
              isMinimized: false,
            },
          },
        };
      }),
    minimize: (pid: string) =>
      set((proc) => {
        const process = proc.processes[pid];
        return {
          ...proc,
          processes: {
            ...proc.processes,
            [pid]: {
              ...process,
              isMinimized: !process.isMinimized,
              isMaximized: false,
            },
          },
        };
      }),
  }),
);
