"use client";
import { Desktop } from "@/components/system/Desktop";
import { ProcessLoader } from "@/components/system/ProcessLoader";
import { ProcessProvider } from "@/context/process";


export default function Home() {
  return (
    <main aria-label="main-page">
      <ProcessProvider>
        <Desktop>
          <ProcessLoader />
        </Desktop>
      </ProcessProvider>
    </main>
  );
}
