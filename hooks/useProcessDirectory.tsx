"use client";
import dynamic from "next/dynamic";
import { ComponentType } from "react";
import { ProcessDirectoryContextState } from "@/context/processDirectory";
import { create } from "zustand";

export type Process = {
  Component: ComponentType<unknown>;
  hasWindow?: boolean;
  icon: string;
  title: string;
  isOpen?: boolean;
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
  }),
);
