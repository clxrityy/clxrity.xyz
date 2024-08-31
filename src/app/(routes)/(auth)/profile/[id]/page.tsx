import { getUploadsByUser } from "@/app/(actions)/uploads";
import getUser from "@/app/(actions)/users";

import UserCard from "@/components/blocks/UserCard";
import { redirect } from "next/navigation";

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

    return (
        <div className="w-full h-full flex justify-center">
            <div className="flex flex-col h-fit items-center justify-around gap-10">
                <div>
                    <UserCard user={{
                        username: userData.username,
                        avatar: userData.avatar,
                        id: userData.id,
                    }} uploads={uploadLength} />
                    
                </div>
            </div>
        </div>
    );
}