"use client";
import { useEffect, useState } from "react";
import { configure, BFSRequire, type FileSystemConfiguration } from "browserfs";
import { FSModule } from "browserfs/dist/node/core/FS";
import { FileSystemContextState } from "@/context/fileSystem";

export const fileSystemConfig: FileSystemConfiguration = {
  fs: "IndexedDB",
  options: {},
};

export const useFileSystemContextState = (): FileSystemContextState => {
  const [fs, setFs] = useState<FSModule | null>(null);

  useEffect(() => {
    if (!fs) {
      configure(fileSystemConfig, () => setFs(BFSRequire("fs")));
    }
  }, [fs]);

  return { fs };
};
