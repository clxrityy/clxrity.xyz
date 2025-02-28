import dynamic from "next/dynamic";
import { ComponentType } from "react";

export type Process = {
  Component: ComponentType;
  hasWindow: boolean;
};

export type Processes = {
  [id: string]: Process;
};

const START_UP_PROCESSES: string[] = [
  "Main",
];

export const processDirectory: Processes = {
  Main: {
    Component: dynamic(() => import("../components/pages/Main").then((mod) => mod.Main),
    ),
    hasWindow: true,
  },
} as const;

export const getStartupProcesses = (): Processes => START_UP_PROCESSES.reduce((acc, id) => ({
  ...acc,
  [id]: processDirectory[id],
}), {});
