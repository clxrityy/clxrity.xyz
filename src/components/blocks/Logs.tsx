import { getAllLogs } from "@/app/(actions)/logs";


export default async function Logs() {
    const logs = await getAllLogs();

    return (
        <div className="w-full flex items-center">
            {logs.docs.map((log, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2">
                    <span className="flex flex-row gap-1 items-center font-mono">
                        <span className="font-bold uppercase">
                            Timestamp: 
                        </span>
                        <span className="text-xs">
                            {new Date(log.data().timestamp).toDateString()}
                        </span>
                    </span>
                    <span>
                        <span className="font-bold uppercase">
                            Log Type: 
                        </span>
                        <span className="text-xs">
                            {log.data().logType}
                        </span>
                    </span>
                    <span>
                        <span className="font-bold uppercase">
                            Username: 
                        </span>
                        <span className="text-xs">
                            {log.data().username}
                        </span>
                    </span>
                </div>
            ))}
        </div>
    )
}