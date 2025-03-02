import { RootButton } from "./RootButton";

export const Toolbar = () => {
  return (
    <nav className="top-0 fixed bg-gradient-to-r from-[var(--background-start)] to-[var(--background-end)] w-screen h-16 drop-shadow-md shadow-inner">
      {/**
       * - Root button (logo)
       *
       * - ... tasks
       * - ... spacing
       * - ... clock / weather
       */}

      {/* Wrapper */}
      <div className="w-full h-full mx-auto">
        {/* Main container */}
        <ul className="flex items-center justify-center h-full w-full gap-5 xl:gap-7 2xl:gap-10">
          {/* LEFT container */}
          <div className="w-4/5 flex items-center justify-start gap-5">
            <div className="flex items-center justify-start gap-5 w-full lg:w-3/4 xl:w-1/2 2xl:w-1/3">
              <li className="w-[25%] lg:w-[30%] 2xl:w-[40%] bg-blue-500 h-10">
                {/* Tools */}
              </li>
              <li className="w-[15%] lg:w-[20%] 2xl:w-[30%] bg-red-500 h-10">
                {/*
                  Clock
                    /
                  Weather
                */}
              </li>
            </div>
          </div>
          <li className="flex items-center justify-start h-full px-4 m-4">
            <RootButton />
          </li>
        </ul>
      </div>
    </nav>
  );
};
