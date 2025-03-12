"use client";
import { useProcessDirectory } from "@/contexts/process";
import dynamic from "next/dynamic";
import React from "react";

const Window = dynamic(() =>
  import("@/components/system/window/Window").then((mod) => mod.Window),
);

export type RenderProcessProps = {
  Component: React.ComponentType<{ pid: string }>;
  hasWindow?: boolean;
  pid: string;
};

const withWindow = (Component: React.ComponentType, pid: string) => {
  return (
    <Window pid={pid}>
      <Component />
    </Window>
  );
};

const RenderProcess = ({ Component, hasWindow, pid }: RenderProcessProps) =>
  hasWindow ? (
    withWindow(Component as React.ComponentType, pid)
  ) : React.isValidElement(Component) ? (
    Component
  ) : (
    <Component pid={pid} />
  );

export const ProcessLoader = () => {
  const { processes } = useProcessDirectory();

  return (
    <div className="flex items-center justify-center top-40 absolute z-[50] w-full h-auto mx-auto">
      {Object.entries(processes).map(
        ([id, { Component, hasWindow, isOpen }]) =>
          isOpen && (
            <RenderProcess
              key={id}
              Component={Component}
              hasWindow={Boolean(hasWindow)}
              pid={id}
            />
          ),
      )}
    </div>
  );
};
