"use client";

import { useEffect, useState } from "react";
import { useShortcut } from "@/hooks/useShortcut";

export type FileInfo = {
  icon: string;
  pid: string;
};

export const useFileInfo = (path: string): FileInfo => {
  const [icon, setIcon] = useState<string>("");
  const [pid, setPid] = useState<string>("");

  const { IconFile, URL } = useShortcut(path);

  useEffect(() => {
    setIcon(IconFile);
    setPid(URL);
  }, [IconFile, URL]);

  return { icon, pid };
};
