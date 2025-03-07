"use client";
import { useEffect, useState } from "react";
import { configure, BFSRequire } from "browserfs";
import { FSModule } from "browserfs/dist/node/core/FS";
import { FileSystemContextState } from "@/context/fileSystem";
import { fileSystemConfig } from "@/config";

export const useFileSystem = (): FileSystemContextState => {
  const [fs, setFs] = useState<FSModule | null>(null);

  useEffect(() => {
    if (!fs) {
      configure(fileSystemConfig, () => {
        console.log("File system configuring...");
        console.log("Using config:", fileSystemConfig);
        setFs(BFSRequire("fs"));
      });
    }
  }, [fs]);

  return { fs };
};
