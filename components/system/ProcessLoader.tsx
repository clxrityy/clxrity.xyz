"use client";
import { ProcessConsumer } from "@/context/process";
import dynamic from "next/dynamic";

const Window = dynamic(() =>
  import("@/components/system/Window").then((mod) => mod.Window),
);

export type RenderProcessProps = {
  Component: React.ComponentType;
  hasWindow: boolean;
};

const withWindow = (Component: React.ComponentType) => (
  <Window>
    <Component />
  </Window>
);

const RenderProcess = ({ Component, hasWindow }: RenderProcessProps) =>
  hasWindow ? withWindow(Component) : <Component />;

export const ProcessLoader = () => (
  <ProcessConsumer>
    {({ processesMap }) =>
      processesMap(([id, { Component, hasWindow }]) => (
        <RenderProcess
          key={id}
          Component={Component}
          hasWindow={Boolean(hasWindow)}
        />
      ))
    }
  </ProcessConsumer>
);
