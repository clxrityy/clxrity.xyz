"use client";
import { createContext, useContext } from "react";

export type ContextFactory = <T>(
  initialContextState: T,
  useContextState: () => T,
) => {
  Consumer: React.Consumer<T>;
  Provider: React.FC<{ children: React.ReactNode }>;
  useContext: () => T;
};

export const contextFactory: ContextFactory = (
  initialContextState,
  useContextState,
) => {
  const Context = createContext(initialContextState);

  const ProviderWrapper = ({ children }: { children: React.ReactNode }) => {
    const contextState = useContextState();
    return <Context.Provider value={contextState}>{children}</Context.Provider>;
  };

  return {
    Consumer: Context.Consumer,
    Provider: ProviderWrapper,
    useContext: () => useContext(Context),
  };
};
