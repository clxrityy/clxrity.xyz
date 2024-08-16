import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FaTrash } from "react-icons/fa";
import { IoIosMore } from "react-icons/io";
import { IoDownload } from "react-icons/io5";


export const ICONS = {
    loading: AiOutlineLoading3Quarters,
    delete: FaTrash,
    more: IoIosMore,
    download: IoDownload,
} as const;

export const maxBytes = 25000000;