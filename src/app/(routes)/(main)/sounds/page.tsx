import { getUploads } from "@/app/(actions)/uploads"
import Search from "@/components/blocks/Search";

export default async function Page() {

    const uploads = await getUploads();

    return (
        <div className="container">
            <div className="flex flex-col items-center w-full gap-8 justify-between">
                <div className="flex flex-col items-center gap-2 text-center">
                    <h2>
                        Sounds
                    </h2>
                    <p>
                        Search for sounds by keyword, instrument, genre, or mood.
                    </p>
                </div>
                <div className="w-full h-full items-center flex flex-col gap-8">
                    <Search audioUploads={uploads} />
                </div>
            </div>
        </div>
    )
}