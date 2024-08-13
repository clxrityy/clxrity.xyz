import { AiOutlineLoading3Quarters } from "react-icons/ai";

export default function Loading() {
    return (
        <div className="w-full h-2/3 flex justify-center items-center">
            <AiOutlineLoading3Quarters className="animate-spin text-4xl" size={100} />
        </div>
    );
}