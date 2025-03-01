import React from "react";

export type ContextFactory = <T>(
  initialContextState: T,
  useContextState: () => T,
) => {
  Consumer: React.Consumer<T>;
  Provider: React.FC<{ children: React.ReactNode }>;
};

export const contextFactory: ContextFactory = (
  initialContextState,
  useContextState,
) => {
  const { Consumer, Provider } = React.createContext(initialContextState);

  const ProviderWrapper = ({ children }: { children: React.ReactNode }) => {
    const contextState = useContextState();
    return <Provider value={contextState}>{children}</Provider>;
  };

  return { Consumer, Provider: ProviderWrapper };
};
