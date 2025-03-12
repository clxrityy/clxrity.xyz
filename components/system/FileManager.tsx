"use client";
import "@/styles/system/sys.css";
import { useFileInfo } from "@/hooks/useFileInfo";
import { ImageComponent } from "../ui/Image";
import { basename, extname, resolve } from "path";
import { useCallback } from "react";
import { useFiles } from "@/hooks/useFiles";
import { useProcessDirectory } from "@/context/processDirectory";

export type FileEntryProps = {
  path: string;
  title: string;
};

export const FileEntry = ({ path, title }: FileEntryProps) => {
  const { icon, pid } = useFileInfo(path);

  const { open } = useProcessDirectory();

  const onActivate = useCallback(() => {
    open(pid);
  }, [pid, open]);

  return (
    <li className="flex flex-col items-center justify-center gap-2">
      <button
        onClick={onActivate}
        onKeyDown={onActivate}
        onDoubleClick={onActivate}
        className="cursor-pointer grayscale-85 focus:grayscale-25 transition-all duration-75 text-base xl:text-lg file-entry"
      >
        <figure className="flex flex-col items-center justify-center gap-2">
          <ImageComponent
            image={{
              src: icon || "/icons/unknown.svg",
              alt: title,
              width: 32,
              height: 32,
              className: "",
            }}
          />
          <figcaption>{title}</figcaption>
        </figure>
      </button>
    </li>
  );
};

export const FileManager = () => (
  <ol className="w-full h-full mx-10 grid grid-cols-4 gap-4 items-center relative">
    {useFiles((file) => {
      return (
        <FileEntry
          key={file}
          title={basename(file, extname(file))}
          path={resolve(`/desktop`, file)}
        />
      );
    })}
  </ol>
);
