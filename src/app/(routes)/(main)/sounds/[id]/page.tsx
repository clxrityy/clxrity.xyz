import { getUpload } from "@/app/(actions)/uploads";

type Props = {
    params: { id: string };
}

export default async function Page({ params }: Props) { 
    const upload = await getUpload(params.id);

    if (!upload) {
        return <div>Upload Not Found</div>;
    }

    return (
        <div>
            {upload.title}
        </div>
    )
}