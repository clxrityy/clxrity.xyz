import { getAllLogs } from "@/app/(actions)/logs";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Link from "next/link";

export default async function Logs() {
    const logs = await getAllLogs();

    return (
        <div className="w-full flex justify-center items-center font-kanit bg-gray-900/25 rounded-md">
            <Table>
                <TableCaption className="text-gray-400">
                    Upload activity logs
                </TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>
                            Timestamp
                        </TableHead>
                        <TableHead>
                            Log Type
                        </TableHead>
                        <TableHead>
                            Username
                        </TableHead>
                        <TableHead>
                            ID
                        </TableHead>
                    </TableRow>
                </TableHeader>
                {logs.docs.map((log, idx) => (
                    <TableBody key={idx} className="bg-gray-800/50 rounded-md">
                        <TableRow className="hover:bg-gray-900/75 cursor-pointer">
                            <TableCell>
                                {new Date(log.data().timestamp).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-mono">
                                {log.data().logType}
                            </TableCell>
                            <TableCell>
                                {log.data().username}
                            </TableCell>
                            <TableCell className="text-xs">
                                <Link href={`/admin/log/${log.id}`} className="hover:text-blue-500 transition-all hover:underline underline-offset-4">
                                    {log.id}
                                </Link>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                ))}
            </Table>
        </div>
    )
}