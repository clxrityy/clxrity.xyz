"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export type Shortcut = {
  URL: string;
  IconFile: string;
};

export const useShortcut = (path: string): Shortcut => {
  const [url, setUrl] = useState<string>("");
  const [iconFile, setIconFile] = useState<string>("");

  useEffect(() => {
    async function fetchShortcut() {
      const response = await axios.get(path);
      const { URL, IconFile } = await response.data;
      setUrl(URL);
      setIconFile(IconFile);
    }

    fetchShortcut();
  }, [path]);

  return {
    URL: url,
    IconFile: iconFile,
  };
};

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
