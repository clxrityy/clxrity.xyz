import { AiOutlineLoading3Quarters } from "react-icons/ai";

const Loading = () => {
    return <div className="w-full h-[100vh] flex items-center justify-center">
        <AiOutlineLoading3Quarters size={100} className="animate-spin" />
    </div>;
}

export default Loading