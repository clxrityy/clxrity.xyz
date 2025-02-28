import { type ProcessContextState } from "@/context/process";
import { type Processes } from "@/util/processDirectory";

export const useProcessContextState = (
  startupProcesses: Processes,
): ProcessContextState => ({ processes: startupProcesses });
