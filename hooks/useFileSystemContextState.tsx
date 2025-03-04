"use client";
import { useEffect, useState } from "react";
import * as BrowserFS from "browserfs";
import { FSModule } from "browserfs/dist/node/core/FS";
import { FileSystemContextState } from "@/context/fileSystem";

export const useFileSystemContextState = (): FileSystemContextState => {
  const [fs, setFs] = useState<FSModule | null>(null);

  useEffect(() => {

    BrowserFS.install(window);

    BrowserFS.configure(
      {
        fs: "IndexedDB",
        options: {},
      },
      () => {
        setFs(BrowserFS.BFSRequire("fs"));
      },
    );

  }, [setFs]);

  return { fs };
};
