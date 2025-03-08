"use client";

import axios from "axios";
import { useEffect, useState } from "react";

// import { FSModule } from "browserfs/dist/node/core/FS";
// import * as ini from "ini";

export type Shortcut = {
  URL: string;
  IconFile: string;
};

// export const getShortcut = (path: string, fs: FSModule): Promise<Shortcut> =>
//   new Promise((resolve) => {
//     fs.readFile(path, (_error, contents) => {
//       console.log("PATH", path); // TODO: Remove

//       console.log("ERROR", _error); // TODO: Remove
//       console.log("CONTENTS", contents?.toString()); // TODO: Remove (EMPTY)

//       console.log("INI", ini.parse(contents!.toString())); // TODO: Remove (EMPTY)

//       const {
//         InternetShortcut = {
//           URL: "",
//           IconFile: "",
//         } as Shortcut,
//       } = ini.parse(contents!.toString()); // ERROR

//       if (InternetShortcut) {
//         resolve(InternetShortcut as Shortcut);
//       }
//     });
//   });

// export const getShortcut = (path: string): Shortcut => {
//   let content: Buffer | string = "";

//   fs.readFile(path, (_error, contents) => {
//     console.log("PATH", path); // TODO: Remove

//     console.log("ERROR", _error); // TODO: Remove
//     console.log("CONTENTS", contents?.toString()); // TODO: Remove (EMPTY)

//     content = contents!.toString();
//   });
//   const parsedBuffer = Buffer.from(content).toString();
//   const parsed = JSON.parse(parsedBuffer);

//   console.log("PARSED", parsed); // TODO: Remove

//   return parsed as Shortcut;
// };

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
