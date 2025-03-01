import { RootButton } from "./RootButton";

export const Navigation = () => {
  return (
    <nav className="top-0 fixed bg-gradient-to-r from-[var(--background-start)] to-[var(--background-end)] w-screen h-16 drop-shadow-md shadow-inner">
      {
        /**
         * - Root button (logo)
         *
         * - ... tasks
         * - ... system tray
         * - ... clock / weather
         */
      }

      <div className="flex items-center justify-between h-full px-4 w-full m-4">
        <RootButton />
      </div>
    </nav>
  );
};
