import dynamic from "next/dynamic";
import { ComponentType } from "react";

export type Process = {
  Component: ComponentType;
  hasWindow?: boolean;
};

export type Processes = {
  [id: string]: Process;
};

export const processDirectory: Processes = {
  Main: {
    Component: dynamic(() =>
      import("../components/modules/Main").then((mod) => mod.Main),
    ),
    hasWindow: true,
  },
} as const;
