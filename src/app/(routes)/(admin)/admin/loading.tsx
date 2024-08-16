import { ICONS } from "@/config";

export default async function Loading() {
    return (
        <div className="w-full h-2/3 flex justify-center items-center">
            <ICONS.loading className="animate-spin text-4xl" size={100} />
        </div>
    );
}