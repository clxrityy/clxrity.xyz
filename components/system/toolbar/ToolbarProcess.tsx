import { ImageComponent } from "@/components/ui/Image";

export type ToolbarProcessProps = {
  icon: string;
  title: string;
};

export const ToolbarProcess = ({ icon, title }: ToolbarProcessProps) => {
  return (
    <li className="">
      <figure className="flex flex-row items-center justify-center gap-2">
        <ImageComponent
          image={{
            src: icon,
            alt: title,
            width: 24,
            height: 24,
          }}
        />
        <figcaption>{title}</figcaption>
      </figure>
    </li>
  );
};
