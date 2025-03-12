"use client";
import { ImageComponent } from "@/components/ui/Image";
import { Minus } from "lucide-react";
import { useCallback } from "react";
import { useProcessDirectory } from "@/context/processDirectory";

export type ToolbarProcessProps = {
  icon: string;
  title: string;
  pid: string;
};

export const ToolbarProcess = ({ icon, title, pid }: ToolbarProcessProps) => {
  const { close, minimize } = useProcessDirectory();

  const onClose = () => close(pid);

  const onClick = useCallback(() => minimize(pid), [minimize, pid]);

  return (
    <li className="flex items-center justify-center h-full w-full px-4 transition-all duration-75 rounded-md relative text-xs md:text-sm lg:text-base">
      <button
        onClick={onClose}
        className="absolute -bottom-2.5 p-2 text-white/60 hover:text-white/95 transition-all duration-75 focus:text-zinc-400/65 focus:outline-none"
      >
        <div className="w-auto border border-inherit">
          <Minus width={100} />
        </div>
      </button>
      <button
        onClick={onClick}
        className="hover:text-zinc-300 focus:outline-none focus:text-zinc-300/65 transition-all duration-75"
      >
        <figure className="flex flex-row items-center justify-center gap-2 w-fit">
          <ImageComponent
            image={{
              src: icon,
              alt: title,
              width: 24,
              height: 24,
            }}
            className="grayscale-85"
          />
          <figcaption>{title}</figcaption>
        </figure>
      </button>
    </li>
  );
};

export const ToolbarProcesses = () => {
  const { processes } = useProcessDirectory();

  return (
    <ul className="h-full w-full flex items-center justify-between gap-3 relative">
      {Object.entries(processes).map(
        ([id, { icon, title, isOpen }]) =>
          isOpen && (
            <ToolbarProcess key={id} title={title} icon={icon} pid={id} />
          ),
      )}
    </ul>
  );
};
