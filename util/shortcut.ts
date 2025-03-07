import { FSModule } from "browserfs/dist/node/core/FS";
import * as ini from "ini";

export type Shortcut = {
  URL: string;
  IconFile: string;
};

export const getShortcut = (path: string, fs: FSModule): Promise<Shortcut> =>
  new Promise((resolve) => {
    fs.readFile(path, (_error, contents) => {
      console.log("PATH", path); // TODO: Remove

      console.log("ERROR", _error); // TODO: Remove
      console.log("CONTENTS", contents?.toString()); // TODO: Remove (EMPTY)

      console.log(ini.parse(contents!.toString())); // TODO: Remove (EMPTY)

      const {
        InternetShortcut = {
          URL: "",
          IconFile: "",
        } as Shortcut,
      } = ini.parse(contents!.toString()); // ERROR

      if (InternetShortcut) {
        resolve(InternetShortcut as Shortcut);
      }
    });
  });
