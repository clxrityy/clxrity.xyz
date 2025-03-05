import dynamic from "next/dynamic";
import { ComponentType } from "react";

export type Process = {
  Component: ComponentType;
  hasWindow?: boolean;
  icon: string;
  title: string;
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
    icon: "/favicon.ico",
    title: "Main",
  },
} as const;
