"use client";
import { Desktop } from "@/components/system/Desktop";
import { ProcessLoader } from "@/components/system/ProcessLoader";
import { FileSystemProvider } from "@/context/fileSystem";
import { ProcessProvider } from "@/context/process";

export default function Home() {
  return (
    <main role="main-page">
      <FileSystemProvider>
        <ProcessProvider>
          <Desktop>
            <ProcessLoader />
          </Desktop>
        </ProcessProvider>
      </FileSystemProvider>
    </main>
  );
}
