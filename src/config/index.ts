import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FaTrash, FaUser } from "react-icons/fa";
import { IoIosMore } from "react-icons/io";
import { IoDownload } from "react-icons/io5";
import { RiAdminFill } from "react-icons/ri";
import { BsSoundwave } from "react-icons/bs";
import { FaAngleDown, FaMicrophoneAlt, FaAward } from "react-icons/fa";
import { GiGuitarHead } from "react-icons/gi";
import { LuUndoDot } from "react-icons/lu";
import { MdLoop, MdNavigateNext, MdNavigateBefore } from "react-icons/md";
import { TiThMenu } from "react-icons/ti";
import { RiSave2Fill } from "react-icons/ri";


export const ICONS = {
    loading: AiOutlineLoading3Quarters,
    delete: FaTrash,
    more: IoIosMore,
    download: IoDownload,
    user: FaUser,
    admin: RiAdminFill,
    guitar: GiGuitarHead,
    microphone: FaMicrophoneAlt,
    soundwave: BsSoundwave,
    angleDown: FaAngleDown,
    loop: MdLoop,
    oneShot: LuUndoDot,
    menu: TiThMenu,
    save: RiSave2Fill,
    award: FaAward,
    next: MdNavigateNext,
    previous: MdNavigateBefore,

} as const;

export const maxBytes = 25000000;

export const COLORS = {
    blue: "#007bff",
}

export const MAX_UPLOADS_PER_PAGE = 10;