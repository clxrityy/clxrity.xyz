"use client";
import { Desktop } from "@/components/system/Desktop";
import { ProcessLoader } from "@/components/system/ProcessLoader";
import { Toolbar } from "@/components/system/toolbar/Toolbar";
import { FileSystemProvider } from "@/context/fileSystem";
import { ProcessProvider } from "@/context/process";
import { FileManager } from "@/components/system/FileManager";

export default function Home() {
  return (
    <FileSystemProvider>
      <ProcessProvider>
        <Desktop>
          <ProcessLoader />
          <Toolbar />
          <FileManager directory="/" />
        </Desktop>
      </ProcessProvider>
    </FileSystemProvider>
  );
}
