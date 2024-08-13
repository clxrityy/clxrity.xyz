"use client";
import { FaFileAudio } from "react-icons/fa6";
import { TiDelete } from "react-icons/ti";

type Props = {
    file: File;
    deleteFile: () => void;
}

export default function FileReady({ file, deleteFile }: Props) { 
    console.log(file);

    return (
        <div className="flex flex-col items-center p-2 mb-5 rounded-md relative w-2/3">
            <div className="absolute right-0 px-2">
                <button onClick={deleteFile} className="hover:text-red-500">
                    <TiDelete size={18} />
                </button>
            </div>
            <div className="flex flex-row items-center justify-between p-2 rounded-md gap-1">
                <FaFileAudio size={42} />
                <div className="flex flex-col gap-1">
                    <span className="text-base">{file.name}</span>
                    <span className="text-sm text-gray-500">{file.type}</span>
                    <span className="text-xs text-gray-500 font-mono">{Math.ceil(file.size / 1024)} KB</span>
                </div>
            </div>
        </div>
    )
}