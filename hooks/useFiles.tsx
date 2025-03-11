"use client";
import { JSX, useEffect, useState } from "react";

export const useFiles = (
  callback: (file: string) => JSX.Element,
): JSX.Element[] => {
  const [files, setFiles] = useState<string[]>([]);

  useEffect(() => {
    setFiles(["/desktop/HelloWorld.json"]); // Default file
  }, []);

  return files.map(callback);
};
