"use client";
import { Desktop } from "@/components/system/Desktop";
import { ProcessLoader } from "@/components/system/ProcessLoader";
import { Toolbar } from "@/components/system/toolbar/Toolbar";
import { FileSystemProvider } from "@/context/fileSystem";
import { ProcessProvider } from "@/context/process";

export default function Home() {
  return (
    <FileSystemProvider>
      <ProcessProvider>
        <Desktop>
          <Toolbar />
          <ProcessLoader />
        </Desktop>
      </ProcessProvider>
    </FileSystemProvider>
  );
}
