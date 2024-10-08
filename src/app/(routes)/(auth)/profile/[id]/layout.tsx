import { getUploadsByUser } from "@/app/(actions)/uploads";
import getUser from "@/app/(actions)/users";
import AudioItem from "@/components/audio/AudioItem";
import { Metadata } from "next";
import { redirect } from "next/navigation";

type Props = {
    params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const id = params.id;

    const username = (await getUser(id)).username;

    if (!username) {
        return {
            title: "User Not Found",
        }
    }

    return {
        title: `${username}`,
        description: `View ${username}'s profile on clxrity.`,
    }
}

export default async function Layout({ children, params }: { children: React.ReactNode, params: { id: string } }) { 

    const username = (await getUser(params.id)).username;

    if (!username) {
        return redirect("/");
    }

    const userUploads = await getUploadsByUser(params.id);

    return (
        <div className="w-full h-full">
            <div className="flex flex-col gap-10 items-center justify-center">
                {children}
                <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 items-center justify-center">
                    {
                        userUploads.length && userUploads.map((upload, idx) => (
                            <div className="bg-black/45 rounded-xl px-5 py-2 w-full shadow-xl drop-shadow-2xl" key={idx}>
                                <AudioItem key={idx} audio={upload} />
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    );
}