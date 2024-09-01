import { Metadata } from "next";
import { Suspense } from "react";
import { getUploads } from "@/app/(actions)/uploads";


export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "clxrity | Sounds",
        description: "Listen and download sounds for free.",
    }
}

const Fallback = async () => {
    const uploads = await getUploads();

    return (
        <div className="flex items-center justify-center w-full h-full mx-auto">
            <div className="max-w-xl flex flex-col items-center">
                {
                    uploads.map((_, index) => (
                        <div key={index} className="w-full flex items-center justify-center gap-4 animate-pulse">
                            <div className="w-1/2 h-10 flex items-center justify-center bg-gray-200 rounded-lg">
                                <div className="w-4/5 h-6 bg-gray-300 rounded-lg"></div>
                            </div>
                            <div className="w-1/4 h-10 flex items-center justify-center bg-gray-200 rounded-lg">
                                <div className="w-4/5 h-6 bg-gray-300 rounded-lg"></div>
                            </div>
                        </div>
                    ))
                }
            </div>
        </div>
    )
}

export default async function Layout({ children }: Readonly<{ children: React.ReactNode }>) {



    return (
        <div className="relative min-h-screen min-w-screen z-0">
            <Suspense fallback={<Fallback />}>
                {children}
            </Suspense>
        </div>
    )
}