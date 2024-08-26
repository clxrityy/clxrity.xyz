import Image from "next/image";

type Props = {
    user: {
        username: string;
        avatar: string;
        id: string;
    },
    uploads: number;
}

export default function UserCard({ user, uploads }: Props) {

    return (
        <div className="bg-black/50 h-fit px-10 py-5 rounded-lg shadow-xl">
            <div className="flex flex-col items-center justify-start gap-6">
                <div className="flex flex-col items-center gap-3 lg:flex-row">
                    <Image unoptimized src={user.avatar} alt={user.username} className="rounded-full w-24 h-24" width={100} height={100} />
                    <h1>{user.username}</h1>
                </div>
                <div>
                    <p>Uploads: {uploads}</p>
                </div>
            </div>
        </div>
    )
}