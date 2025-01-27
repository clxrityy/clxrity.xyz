import { BetaTestForm } from "@/components/BetaTestForm";
import { Header } from "@/components/Header";
import { ServerStatus } from "@/components/ServerStatus";
import { ServerData } from "@/types";


export default async function Home() {

  async function getServerStatus(): Promise<ServerData> {
    const res = await fetch("https://mcapi.us/server/status?ip=mc.clxrity.xyz", {
      headers: {
        "Content-Type": "application/json"
      },
    });
    const data = await res.json();
    return data as ServerData;
  }

  const serverStatus = await getServerStatus();

  return (
    <main className="relative mx-auto h-screen w-screen overflow-y-scroll">
      <div className="w-full h-max flex flex-col items-center justify-center gap-8 xl:gap-9 2xl:gap-10 my-10 lg:-my-5 lg:mb-10 xl:-my-20 xl:mb-10 2xl:-my-10 2xl:mb-14">
        <div className="flex flex-col items-center justify-center h-[40vh] gap-8 xl:gap-9 2xl:gap-10 w-full">
          <Header />
          <ServerStatus data={serverStatus} />
        </div>
        <BetaTestForm isAlreadySubmitted={true} />
      </div>
    </main>
  )
}