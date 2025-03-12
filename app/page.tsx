"use client";
import { Desktop } from "@/components/system/Desktop";
import { ProcessLoader } from "@/components/system/ProcessLoader";
import { Toolbar } from "@/components/system/toolbar/Toolbar";
import { FileManager } from "@/components/system/FileManager";
import dynamic from "next/dynamic";

const ProcessDirectoryProvider = dynamic(() =>
  import("@/context/processDirectory").then(
    (mod) => mod.ProcessDirectoryProvider,
  ),
);

export default function Home() {
  return (
    <ProcessDirectoryProvider>
      <Desktop>
        <Toolbar />
        <FileManager />
        <ProcessLoader />
      </Desktop>
    </ProcessDirectoryProvider>
  );
}
