import { ImageComponent } from "../../ui/Image";

export const RootButton = () => {
  return (
    <button
      title="Root"
      type="button"
      className={`h-15 w-18 shadow-inner flex rounded-4xl items-center justify-center transition-all duration-100 ease-linear bg-gradient-to-r from-[var(--background-start)]/15 to-[var(--background-start)]/5 hover:bg-[var(--background-end)]/[2.5%] focus:bg-transparent focus:scale-[92.5%] ring-offset-1 ring-offset-zinc-900/15 focus:rounded-3xl focus:contrast-200 focus:drop-shadow-lg place-items-center place-content-center`}
    >
      <ImageComponent
        image={{
          src: "/apple-touch-icon.png",
          width: 42.5,
          height: 42.5,
          alt: "Icon",
        }}
        className="rounded-full contrast-more:backdrop-blur-md"
        priority
      />
    </button>
  );
};
