import { NetworkInterface } from "@/config";
import Image from "next/image";
import Link from "next/link";

interface Props {
    props: NetworkInterface[];
}

export function Networks({ props }: Props) {
    return (
        <div className="flex flex-col gap-10 items-center justify-center w-full h-fit">
            {
                props.map((network) => (
                    <div key={network.name} className="flex flex-col gap-6 items-center justify-center w-2/3 2xl:w-1/3 border-2 border-zinc-200/60 hover:border-zinc-200 transition-all hover:scale-95 cursor-pointer px-5 py-4 rounded-xl bg-gradient-to-l from-zinc-950 to-zinc-900">
                        <div className="flex flex-col md:flex-row justify-around w-full items-center gap-4">
                            <Link target="_blank" href={network.url} className="flex flex-row justify-start items-center gap-2 w-full">
                                <Image src={network.icon} alt={network.name} className="h-5 w-5 md:h-6 md:w-6 lg:w-8 lg:h-8" width={50} height={50} />
                                <p className="text-xl 2xl:text-2xl">
                                    {network.name}
                                </p>
                            </Link>
                            <span className="text-xs md:text-sm text-zinc-400 drop-shadow-lg">{network.url.replace("https://", "")}</span>
                        </div>
                        <div className="flex flex-col gap-4 items-start justify-start w-full text-start">
                            {network.description && <p className="text-zinc-300 text-sm 2xl:text-base">{network.description}</p>}
                        </div>
                    </div>
                ))
            }
        </div>
    )
}
