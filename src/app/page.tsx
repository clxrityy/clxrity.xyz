import { Networks } from "@/components/Networks";
import { networks } from "@/config";



export default function Home() {
  return (
    <main className="relative flex flex-row">
      <div className="absolute top-0 left-4 w-full">
        <h1>
          clxrity.xyz
        </h1>
      </div>
      <div className="container mx-auto my-40">
        <div className="flex flex-col gap-10 items-center justify-center w-full h-fit">
          <h2 className="font-kanit uppercase tracking-widest">
            Networks
          </h2>
          <Networks props={networks} />
        </div>
      </div>
    </main>
  );
}