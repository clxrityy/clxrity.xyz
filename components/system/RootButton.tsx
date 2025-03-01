import { ImageComponent } from "../ui/Image";

export const RootButton = () => {
  return (
    <button className="h-full w-18 flex items-center justify-center cursor-pointer transition-all duration-200 ease-linear bg-[var(--background-start)] hover:bg-[var(--background-end)] rounded-lg focus:bg-zinc-600/25 focus:scale-[107.5%] focus:ring-zinc-500/25 focus:ring focus:rounded-2xl focus:contrast-150">
      <ImageComponent
        image={{
          src: "/apple-touch-icon.png",
          width: 42.5,
          height: 42.5,
          alt: "Icon",
        }}
        className="rounded-full contrast-more:backdrop-blur-md"
      />
    </button>
  );
};
