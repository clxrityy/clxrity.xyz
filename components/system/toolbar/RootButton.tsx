import { ImageComponent } from "../../ui/Image";

export const RootButton = () => {
  return (
    <button
      type="button"
      className={`h-14 w-18 flex rounded-4xl items-center justify-center cursor-pointer transition-all duration-100 ease-linear bg-gradient-to-r from-[var(--background-start)]/25 to-[var(--background-start)]/15 hover:bg-[var(--background-end)]/[5%] focus:bg-transparent focus:scale-[92.5%] focus:ring-zinc-400/10 ring-offset-1 ring-offset-zinc-900/50 focus:ring-3 focus:rounded-3xl focus:contrast-150 focus:drop-shadow-lg place-items-center place-content-center`}
    >
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
