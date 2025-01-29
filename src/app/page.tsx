import Image from "next/image";
import Link from "next/link";


export default function Home() {
  return (
    <main className="relative mx-auto">
      <div className="container my-20">
        <h1>
          clxrity.xyz
        </h1>
        <div className="flex flex-col gap-10 items-center justify-center w-full h-fit">
          <h2 className="font-kanit uppercase tracking-widest">
            Networks
          </h2>
          <ul className="flex flex-col items-center justify-around w-3/4 gap-4 font-kanit tracking-wide text-zinc-200">
            <li className="flex flex-row gap-2 items-center justify-start w-2/3">
              <Image src={"/mc.png"} width={32} height={32} alt={"mc.clxrity.xyz"} className="h-5 w-5 md:h-6 md:w-6 lg:w-8 lg:h-8" />
              <Link href={"https://mc.clxrity.xyz"} className="text-base lg:text-lg">
                mc <span className="sr-only">mc.clxrity.xyz</span>
              </Link>
            </li>
            <li className="flex flex-row gap-2 items-center justify-start w-2/3">
              <Image src={"/wav.png"} width={32} height={32} alt={"wav.clxrity.xyz"} className="h-5 w-5 md:h-6 md:w-6 lg:w-8 lg:h-8" />
              <Link href={"https://wav.clxrity.xyz"} className="text-base lg:text-lg">
                wav <span className="sr-only">mc.clxrity.xyz</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}