"use client";

import { useEffect, useState } from "react";
import { useFileSystem } from "./useFileSystem";
import { extname } from "path";
import { IMAGE_FILE_EXTENSIONS } from "@/config/constants";
import { FSModule } from "browserfs/dist/node/core/FS";
import ini from "ini";

export type FileInfo = {
  icon: string;
  pid: string;
};

const getProcessByFileExtension = (_extension: string): string => "";

export type Shortcut = {
  URL: string;
  IconFile: string;
};

export const getShortcut = async (
  path: string,
  fs: FSModule,
): Promise<Shortcut> =>
  new Promise((resolve) => {
    fs.readFile(path, (_error, contents = Buffer.from("")) =>
      resolve(ini.parse(contents.toString()) as Shortcut),
    );
  });

export const useFileInfo = (path: string): FileInfo => {
  const [icon, setIcon] = useState<string>("");
  const [pid, setPid] = useState<string>("");
  const { fs } = useFileSystem();

  useEffect(() => {
    if (fs) {
      const extension = extname(path);

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
        setIcon(getProcessByFileExtension(extension));
      }
    }
  }, [fs, path]);

  return { icon, pid };
};
