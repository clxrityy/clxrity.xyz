import { getUploads } from "@/app/(actions)/uploads";
import { RiAdminFill } from "react-icons/ri";
import { type Track } from "@clxrityy/react-audio";
import AudioList from "@/components/elements/AudioList";


export default async function Page() {

    const uploads = await getUploads();

    const tracks: Track[] = uploads.map((upload) => ({
        title: upload.title,
        src: upload.file,
        thumbnail: upload.thumbnail,
    }));

    return (
        <div className="w-full min-h-screen relative">
            <div className="w-full h-full flex items-center flex-col gap-8">
                <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-lg text-center space-y-4 items-center flex flex-col justify-center">
                        <h3>
                            Admin Dashboard <RiAdminFill className="inline-block" />
                        </h3>
                        <div className="text-sm lg:text-base flex flex-col items-center text-gray-500">
                            <p>
                                All actions within the admin dashboard are logged and monitored.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col lg:flex-row items-center justify-center w-full">
                    <AudioList tracks={tracks} />
                </div> 
            </div>
        </div>
    );
}
