"use client";
import { useFileInfo } from "@/hooks/useFileInfo";
import { ImageComponent } from "../ui/Image";
import { basename, extname, resolve } from "path";
import { useProcess } from "@/hooks/useProcess";
import { useCallback } from "react";
import { useFiles } from "@/hooks/useFiles";
// import path from "path";

export type FileManagerProps = {
  directory: string;
};

export type FileEntryProps = {
  path: string;
  title: string;
};

export const FileEntry = ({ path, title }: FileEntryProps) => {
  console.log("PATH", path); // TODO: Remove
  console.log("TITLE", title); // TODO: Remove
  const { icon, pid } = useFileInfo(path);

  console.log("ICON", icon); // TODO: Remove
  console.log("PID", pid); // TODO: Remove

  const { open } = useProcess();

  const onActivate = useCallback(() => open(pid), [open, pid]);

  return (
    <li>
      <button
        className="cursor-pointer"
        onClick={onActivate}
        onKeyDown={onActivate}
      >
        <figure>
          <ImageComponent
            image={{
              src: icon || "/icons/unknown.svg",
              alt: title,
              width: 32,
              height: 32,
            }}
          />
          <figcaption>{title}</figcaption>
        </figure>
      </button>
    </li>
  );
};

export const FileManager = ({ directory }: FileManagerProps) => (
  <ol>
    {useFiles(directory, (file) => {
      return (
        <FileEntry
          key={file}
          title={basename(file, extname(file))}
          path={resolve(directory, file)}
        />
      );
    })}
  </ol>
);
