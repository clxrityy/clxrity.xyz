"use client";
import { useProcessDirectoryStore } from "@/hooks/useProcessDirectory";
import { ImageComponent } from "@/components/ui/Image";
import { Minus } from "lucide-react";

export type ToolbarProcessProps = {
  icon: string;
  title: string;
  pid: string;
};

export const ToolbarProcess = ({ icon, title, pid }: ToolbarProcessProps) => {
  const { close } = useProcessDirectoryStore();

  const onClose = () => close(pid);

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
    </li>
  );
};

export const ToolbarProcesses = () => {
  const { processes } = useProcessDirectoryStore();

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
