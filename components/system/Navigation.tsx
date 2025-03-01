import { RootButton } from "./RootButton";

export const Navigation = () => {
  return (
    <nav className="top-0 fixed bg-gradient-to-r from-[var(--background-start)] to-[var(--background-end)] w-screen h-16 drop-shadow-md shadow-inner">
      {
        /**
         * - Root button (logo)
         *
         * - ... tasks
         * - ... spacing
         * - ... clock / weather
         */
      }

      {/* Wrapper */}
      <div className="w-full h-full mx-auto">
        {/* Main container */}
        <ul className="flex items-center justify-center h-full w-full gap-5 xl:gap-7 2xl:gap-10">
          <li className="flex items-center justify-start h-full px-4 m-4 w-[25%] xl:w-[50%]">
            <RootButton />
          </li>

          <div className="w-[90%] flex flex-1 items-center justify-end xl:justify-center gap-5">
            <li className="w-[25%] lg:w-[30%] 2xl:w-[40%] bg-blue-500 h-10">
              {/* Tasks */}
            </li>
            <li className="w-[15%] lg:w-[20%] 2xl:w-[30%] bg-red-500 h-10">
                {/*
                  Time / Weather
                */}
            </li>
          </div>
        </ul>
      </div>
    </nav>
  );
};
