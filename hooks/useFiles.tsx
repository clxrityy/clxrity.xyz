"use client";
import { JSX, useEffect, useState } from "react";
import { useFileSystem } from "./useFileSystem";

export const useFiles = (
  directory: string,
  callback: (file: string) => JSX.Element,
): JSX.Element[] => {
  const [files, setFiles] = useState<string[]>([]);
  const { fs } = useFileSystem();

  useEffect(() => {
    if (fs) {
      fs.readdir(directory, (_error, files = []) => {
        setFiles(files);
        console.log("ERROR", _error); // TODO: Remove
        console.log("FILES", files); // TODO: Remove
      });
    }
  }, [fs, directory]);

  return files.map(callback);
};
