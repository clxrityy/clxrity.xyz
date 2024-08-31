import { getUpload } from "@/app/(actions)/uploads";
import AudioPage from "@/components/audio/AudioPage";

type Props = {
    params: { id: string };
}

export default async function Page({ params }: Props) { 
    const upload = await getUpload(params.id);

    if (!upload) {
        return <div>Upload Not Found</div>;
    }

    return (
        <div className="h-full w-full">
            <AudioPage upload={upload} />
        </div>
    )
}