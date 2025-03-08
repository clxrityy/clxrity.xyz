"use client";
import { JSX, useEffect, useState } from "react";
import { useFileSystem } from "./useFileSystem";

export const useFiles = (
  callback: (file: string) => JSX.Element,
): JSX.Element[] => {
  const [files, setFiles] = useState<string[]>([]);
  const { fs } = useFileSystem();

  useEffect(() => {
    if (fs) {
      fs.readdir("/", (_error, files = []) => {
        setFiles(files);
      });
    } else {
      setFiles(["/desktop/Main.json"]); // Default file
    }
  }, [fs]);

  return files.map(callback);
};
