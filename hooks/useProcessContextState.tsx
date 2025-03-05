"use client";
import { ProcessContextState } from "@/context/process";
import { getProcess, type Processes } from "@/util/processDirectory";
import { useState } from "react";

export const useProcessContextState = (): ProcessContextState => {
  const [processes] = useState<Processes>({
    Main: getProcess("Main"),
  });

  if (!processes) {
    return {
      processes: {},
    };
  }

  return {
    processes,
  };
};
