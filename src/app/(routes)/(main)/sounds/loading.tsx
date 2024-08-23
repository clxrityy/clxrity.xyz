import { ICONS } from "@/config";

export default async function Loading() {
    return (
        <div className="flex items-center justify-center h-screen w-screen">
            <ICONS.loading className="animate-spin" size={100} />
        </div>
    );
};