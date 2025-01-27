import { ServerData } from "@/types";

type Props = {
    data: ServerData;
}

function OnlineStatus({ online, playerCount, maxPlayers }: { online: boolean, playerCount: number, maxPlayers: number }) {


    const isPlayersOnline = playerCount > 0;
    const isMaxPlayers = playerCount === maxPlayers;


    return (
        <div className="flex items-center justify-center gap-6 px-6 py-4 bg-zinc-800/90 rounded-xl backdrop:backdrop-blur-lg shadow-lg">
            <div className="flex flex-row items-center justify-center gap-3">
                <div className={`w-8 h-8 rounded-full ${online ? "bg-green-500 online" : "bg-zinc-500 offline"}`} />
                <p className="text-lg xl:text-xl 2xl:text-2xl font-semibold uppercase tracking-wider text-white/80">{online ? "Online" : "Offline"}</p>
            </div>
            <pre className={`text-zinc-200 bg-zinc-900/25 rounded-lg px-2 py-1 shadow-inner`}>
                {
                    isPlayersOnline && !isMaxPlayers ? <span><span className="text-green-500/65 font-semibold">{playerCount}</span> / {maxPlayers} </span> : isMaxPlayers ? <span className="text-red-500/75 font-semibold">{playerCount} / {maxPlayers}</span> : <span className="text-zinc-400">
                        {playerCount} / {maxPlayers}
                    </span>
                }
            </pre>
        </div>
    );
}

export function ServerStatus({ data }: Props) {

    return (
        <div className="flex flex-col items-center justify-start w-full gap-6 server-status">
            <div className="flex flex-col items-center justify-center gap-4">
                <div className="flex items-center justify-center gap-2">
                    <OnlineStatus online={data.online} playerCount={data.players.now} maxPlayers={data.players.max} />
                </div>
            </div>
        </div>
    );
}