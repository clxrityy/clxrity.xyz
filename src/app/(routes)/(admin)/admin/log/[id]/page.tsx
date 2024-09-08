import { getLogById } from "@/app/(actions)/logs";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

type Props = {
    params: { id: string };
}

export default async function Page({ params }: Props) {

    const log = await getLogById(params.id);

    return (
        <div className="w-full h-1/3 flex items-center justify-center font-kanit">
            <Table className="w-full md:w-2/3 lg:w-1/2 mx-auto bg-zinc-800/50 rounded-lg px-4 py-2">
                <TableCaption className="text-gray-400">
                    {log?.docId}
                </TableCaption>
                <TableHeader className="font-bold uppercase">
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
                <TableBody>
                    <TableRow className="text-gray-300">
                        <TableCell>
                            {new Date(log!.timestamp).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-mono">
                            {log?.logType}
                        </TableCell>
                        <TableCell>
                            {log?.username}
                        </TableCell>
                        <TableCell className="text-xs">
                            {log?.docId}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell colSpan={4}>
                            <pre className="bg-gray-900/75 px-2 py-1 rounded-lg">
                                {JSON.stringify(log, null, 2)}
                            </pre>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    )
}