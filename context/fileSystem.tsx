import { contextFactory } from "@/util/contextFactory";
import { FSModule } from "browserfs/dist/node/core/FS";
import { initialFileSystemContextState } from "./initialStates";
import { useFileSystem } from "@/hooks/useFileSystem";

export type FileSystemContextState = {
  fs: FSModule | null;
};

const { Consumer, Provider, useContext } =
  contextFactory<FileSystemContextState>(
    initialFileSystemContextState,
    useFileSystem,
  );

export {
  Consumer as FileSystemConsumer,
  Provider as FileSystemProvider,
  useContext as useFileSystemContext,
};
