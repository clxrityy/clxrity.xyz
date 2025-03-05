"use client";
import { useEffect, useState } from "react";
import { configure, BFSRequire, type FileSystemConfiguration } from "browserfs";
import { FSModule } from "browserfs/dist/node/core/FS";
import { FileSystemContextState } from "@/context/fileSystem";
import publicFyleSystemIndex from "@/public.json";

export const fileSystemConfig: FileSystemConfiguration = {
  fs: "OverlayFS",
  options: {
    readable: {
      fs: "XmlHttpRequest",
      options: {
        index: publicFyleSystemIndex,
      },
    },
    writable: {
      fs: "IndexedDB",
      options: {
        storeName: "browser-fs-cache",
      },
    },
  },
};

export const useFileSystem = (): FileSystemContextState => {
  const [fs, setFs] = useState<FSModule | null>(null);

  useEffect(() => {
    if (!fs) {
      configure(fileSystemConfig, () => setFs(BFSRequire("fs")));
    }
  }, [fs]);

  return { fs };
};
