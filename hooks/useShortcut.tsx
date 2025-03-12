"use client";

import axios from "axios";
import { useEffect, useState } from "react";

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
