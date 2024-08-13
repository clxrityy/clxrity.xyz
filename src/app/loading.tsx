import { AiOutlineLoading3Quarters } from "react-icons/ai";

export default function Loading() {
    return (
        <div className="flex justify-center items-center h-2/3 w-full">
            <AiOutlineLoading3Quarters className="animate-spin" size={100} />
        </div>
    );
}