import { contextFactory } from "@/util/contextFactory";
import { FSModule } from "browserfs/dist/node/core/FS";
import { initialFileSystemContextState } from "./initialStates";
import { useFileSystemContextState } from "@/hooks/useFileSystemContextState";

export type FileSystemContextState = {
  fs: FSModule | null;
};

const { Consumer, Provider, useContext } =
  contextFactory<FileSystemContextState>(
    initialFileSystemContextState,
    useFileSystemContextState,
  );

export {
  Consumer as FileSystemConsumer,
  Provider as FileSystemProvider,
  useContext as useFileSystemContext,
};
