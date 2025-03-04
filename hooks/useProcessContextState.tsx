"use client";
import { ProcessContextState } from "@/context/process";
import { type Processes } from "@/util/processDirectory";
import { useState } from "react";

export const useProcessContextState = (): ProcessContextState => {
  const [processes] = useState<Processes>({});

  if (!processes) {
    return {
      processes: {},
    };
  }

  return {
    processes,
  };
};
