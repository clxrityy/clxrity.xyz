import getUser from "@/app/(actions)/users";
import { Metadata, ResolvingMetadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

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

    const isCurrentUser = auth().userId?.toString() === params.id;

    return (
        <div className="w-full h-full">
            <div className="flex flex-col gap-5 items-center justify-center">
                
                {children}
            </div>
        </div>
    );
}