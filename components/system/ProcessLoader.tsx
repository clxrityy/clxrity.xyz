"use client";
import { useProcessDirectoryStore } from "@/hooks/useProcessDirectory";
import dynamic from "next/dynamic";
import React from "react";

const Window = dynamic(() =>
  import("@/components/system/Window").then((mod) => mod.Window),
);

export type RenderProcessProps = {
  Component: React.ComponentType;
  hasWindow: boolean;
};

const withWindow = (Component: React.ComponentType) => {
  return (
    <Window>
      <Component />
    </Window>
  );
};

const RenderProcess = ({ Component, hasWindow }: RenderProcessProps) =>
  hasWindow ? (
    withWindow(Component as React.ComponentType)
  ) : React.isValidElement(Component) ? (
    Component
  ) : (
    <Component />
  );

export const ProcessLoader = () => {
  const { processes } = useProcessDirectoryStore();

  return (
    <div className="flex items-center justify-center top-40 absolute z-[50] w-full h-auto mx-auto">
      {Object.entries(processes).map(
        ([id, { Component, hasWindow, isOpen }]) =>
          isOpen && (
            <RenderProcess
              key={id}
              Component={Component}
              hasWindow={Boolean(hasWindow)}
            />
          ),
      )}
    </div>
  );
};
