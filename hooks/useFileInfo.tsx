"use client";

import { useEffect, useState } from "react";
import { useFileSystem } from "./useFileSystem";
import { extname } from "path";
import { IMAGE_FILE_EXTENSIONS } from "@/config/constants";
import { getShortcut } from "@/util/shortcut";

export type FileInfo = {
  icon: string;
  pid: string;
};

const getProcessByFileExtension = (_extension: string): string => "";

export const useFileInfo = (path: string): FileInfo => {
  const [icon, setIcon] = useState<string>("");
  const [pid, setPid] = useState<string>("");
  const { fs } = useFileSystem();

  useEffect(() => {
    if (fs) {
      const extension = extname(path);

      console.log("EXTENSION", extension); // TODO: Remove

      if (extension === ".url") {
        // URL file
        getShortcut(path, fs).then(({ URL, IconFile }) => {
          setIcon(IconFile);
          setPid(URL);
        });
      } else if (IMAGE_FILE_EXTENSIONS.includes(extension)) {
        setIcon(path);
        setPid("ImagePreview");
      } else {
        console.log(
          "getProcessByFileExtension",
          getProcessByFileExtension(extension),
        ); // TODO: Remove
        setIcon(getProcessByFileExtension(extension));
      }
    } else {
      console.error("No file system available"); // THIS ERROR IS THROWN
    }
  }, [fs, path]);

  return { icon, pid };
};
