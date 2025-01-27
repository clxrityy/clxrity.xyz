import { LoaderCircle } from "lucide-react";

export default function Loading() {
    return (
        <div className="flex justify-center items-center h-2/3 w-full">
            <LoaderCircle className="animate-spin" size={100} />
        </div>
    );
}