import { getUploads } from "@/app/(actions)/uploads";
import { RiAdminFill } from "react-icons/ri";
import AudioList from "@/components/audio/AudioList";
import { Suspense } from "react";
import { ICONS } from "@/config";
import Logs from "@/components/blocks/Logs";
import { AudioUpload } from "@/types/data";


export default async function Page() {

    const uploads = await getUploads() as AudioUpload[] & { docId: string }[];


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
                <div className="flex flex-col lg:flex-row items-center justify-center w-full lg:ml-14">
                    <Suspense
                        fallback={
                            <div className="backdrop:blur w-full flex items-center justify-center">
                                <ICONS.loading size={50} />
                            </div>
                        }>
                        <AudioList uploads={uploads} />
                    </Suspense>
                    <Logs />
                    <div className="w-full">

                    </div>
                </div>
            </div>
        </div>
    );
}
