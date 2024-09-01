import { getUpload } from "@/app/(actions)/uploads";
import AudioPage from "@/components/audio/AudioPage";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Props = {
    params: { id: string };
}

export default async function Page({ params }: Props) {
    const upload = await getUpload(params.id);

    if (!upload) {
        return <div>Upload Not Found</div>;
    }

    return (
        <div className="h-full w-full flex flex-col items-center justify-center gap-10">
            <AudioPage upload={upload} />
            <div className="w-full h-full flex items-center justify-center">
                <Link href="/sounds">
                    <Button variant={"outline"} size={"lg"} className="hover:bg-white hover:text-black transition-colors duration-700 focus:outline-none focus:ring ring-blue-500 ring-offset-2">
                        Back to Sounds
                    </Button>
                </Link>
            </div>
        </div>
    )
}