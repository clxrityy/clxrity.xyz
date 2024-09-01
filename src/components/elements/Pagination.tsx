"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ICONS } from "@/config";
import { Button } from "../ui/button";

/**
 * @see https://nextjs.org/learn/dashboard-app/adding-search-and-pagination
 */

export default function Pagination({ totalPages, onPageChange }: { totalPages: number, onPageChange: (page: number) => void }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentPage = Number(searchParams.get("page")) || 1;

    const createPageURL = (pageNumber: number | string) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", pageNumber.toString());
        return `${pathname}?${params.toString()}`;
    }

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <div className="fixed bottom-0 flex flex-row gap-2 px-4 py-2">
            {pages.map((page) => (
                <Button key={page} onClick={() => onPageChange(page)} className={`rounded-full w-8 h-8 flex items-center justify-center ${currentPage === page ? "bg-white text-black" : "bg-black text-white"} hover:bg-white hover:text-black transition-opacity duration-300 ease-in-out`}>
                    <Link href={createPageURL(page)}>
                        {page}
                    </Link>
                </Button>
            ))}
        </div>
    )
}