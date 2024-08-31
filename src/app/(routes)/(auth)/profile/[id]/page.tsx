import { getUploadsByUser } from "@/app/(actions)/uploads";
import getUser from "@/app/(actions)/users";
import UserCard from "@/components/blocks/UserCard";
import { redirect } from "next/navigation";
import {auth} from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";

type Props = {
    params: { id: string };
}


export default async function Page({ params }: Props) {

    const user = (await getUser(params.id));
    if (!user.username) {
        return redirect("/");
    }
    const uploads = (await getUploadsByUser(user.id));

    const uploadLength = uploads.length;

    // const authenticatedUserData = await getAuthenticatedUser(user.id);
    const userData = JSON.parse(JSON.stringify({
        username: user.username,
        avatar: user.imageUrl,
        id: user.id
    })) as { username: string, avatar: string, id: string };

    const isCurrentUser = auth().userId?.toString() === params.id;

    return (
        <div className="w-full h-full flex justify-center">
            <div className="flex flex-col h-fit items-center justify-around gap-10">
                <div className="relative">
                    <UserCard user={{
                        username: (userData.username === "clxrityadmin") ? "clxrity" : userData.username,
                        avatar: userData.avatar,
                        id: userData.id,
                    }} uploads={uploadLength} />
                    <div className="absolute bottom-0 right-0 px-2 py-1">
                        {isCurrentUser && <UserButton />}
                    </div>
                </div>
            </div>
        </div>
    );
}