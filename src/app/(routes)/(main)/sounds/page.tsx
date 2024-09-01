"use client";
import { getUploads } from "@/app/(actions)/uploads"
import Pagination from "@/components/elements/Pagination";
import Search from "@/components/elements/Search";
import { MAX_UPLOADS_PER_PAGE } from "@/config";
import { AudioUpload } from "@/types/data";
import { useEffect, useState } from "react";

export default function Page() {

    const [currentPage, setCurrentPage] = useState<number>(1);
    const [uploads, setUploads] = useState<AudioUpload[]>([]);
    const [totalPages, setTotalPages] = useState<number>(0);
   
    useEffect(() => {
        const fetchUploads = async () => {
            const allUploads = await getUploads();
            setUploads(allUploads);
            setTotalPages(Math.ceil(allUploads.length / MAX_UPLOADS_PER_PAGE));
        }

        fetchUploads();
    }, []);

    useEffect(() => {
        const fetchUploads = async () => {
            const allUploads = await getUploads();
            setUploads(allUploads.slice((currentPage - 1) * MAX_UPLOADS_PER_PAGE, currentPage * MAX_UPLOADS_PER_PAGE));
        }

        fetchUploads();
    }, [currentPage]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    }

    return (
        <div className="w-screen h-full relative">
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
                    <div className="w-full items-center flex flex-col gap-8">
                        <Search audioUploads={uploads} />
                    </div>
                </div>
            </div>
            <Pagination totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
    )
}