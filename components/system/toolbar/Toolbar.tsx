import "@/styles/toolbar/index.css";
import { Clock } from "./Clock";
import { RootButton } from "./RootButton";
import { ToolbarProcesses } from "./Processes";

export const Toolbar = () => {
  return (
    <nav role="nav">
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
          <li className="w-4/5 flex items-center justify-start gap-5">
            <ul className="flex items-center justify-start gap-5 w-full lg:w-3/4 xl:w-1/2 2xl:w-1/3">
              <li className="w-[22.5%] sm:w-[20%] lg:w-[30%] h-12">
                {/*
                  Clock
                    /
                  Weather
                */}
                <Clock />
              </li>
              <li className="w-[25%] lg:w-[30%] 2xl:w-[40%] h-12 flex items-center justify-center gap-2 lg:gap-4 xl:gap-6">
                <ToolbarProcesses />
              </li>
            </ul>
          </li>
          <li className="flex items-center justify-start h-full px-4 m-4">
            <RootButton />
          </li>
        </ul>
      </div>
    </nav>
  );
};
