"use client";
import { Desktop } from "@/components/system/Desktop";
import { ProcessLoader } from "@/components/system/ProcessLoader";
import { ProcessProvider } from "@/context/process";

export default function Home() {
  return (
    <main role="main">
      <ProcessProvider>
        <Desktop>
          <ProcessLoader />
        </Desktop>
      </ProcessProvider>
    </main>
  );
}
