import { getAllLogs } from "@/app/(actions)/logs";


export default async function Logs() {
    const logs = await getAllLogs();

    console.log(logs.docs); // Debugging

    return (
        <div className="w-full flex items-center">
            {logs.docs.map((log, idx) => (
                <div key={idx} className="flex flex-row items-center gap-2">
                    <span>
                        {log.data().title}
                    </span>
                    <span>
                        {log.data().timestamp}
                    </span>
                </div>
            ))}
        </div>
    )
}