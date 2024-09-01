import { getUpload } from "@/app/(actions)/uploads";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

type Props = {
    params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const upload = await getUpload(params.id);

    if (!upload) {
        return {
            title: "Upload Not Found",
        }
    }

    return {
        title: `Sound | ${upload.title}`,
        description: `Listen to ${upload.title} by ${upload.username} on clxrity.\n${upload.description}\n${upload.instrument} in the key of ${upload.key}`,
        keywords: [upload.title, upload.instrument, upload.key],
    }
}

export default async function Layout({ children, params }: { children: React.ReactNode, params: { id: string } }) {

    const upload = await getUpload(params.id);

    if (!upload) {
        return redirect("/");
    }

    return (
        <div className="w-full h-full">
            <div className="flex items-center justify-center w-full h-full">
                {children}
            </div>
        </div>
    );
}