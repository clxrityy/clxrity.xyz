import "@/styles/system/index.css";
import { ImageComponent } from "@/components/ui/Image";
import { useProcessDirectory } from "@/contexts/process";
import { CircleX, Expand, Minimize2 } from "lucide-react";
import { useCallback } from "react";
import { useSession } from "@/contexts/session";

export type ProcessWrapperProps = {
  isMaximized?: boolean;
  pid: string;
  children: React.ReactNode;
};

export const ProcessWrapper = ({
  isMaximized,
  pid,
  children,
}: ProcessWrapperProps) => {
  const {
    processes: {
      [pid]: { icon, title },
    },
    minimize,
    maximize,
    close,
  } = useProcessDirectory();

  const { currentProcesses: sessionProcesses } = useSession();

  const sessionProcess = sessionProcesses[pid];

  const handleMinimize = useCallback(() => {
    minimize(pid);
  }, [pid, minimize]);

  const handleMaximize = useCallback(() => {
    maximize(pid);
  }, [pid, maximize]);

  const handleClose = useCallback(() => {
    close(pid);
  }, [pid, close]);

  return (
    <div className="process-wrapper">
      <header className={`handle ${!isMaximized && "cursor-grab"}`}>
        <figure title={title}>
          <ImageComponent
            image={{
              src: icon,
              alt: title,
              width: 16,
              height: 16,
            }}
            className="grayscale-100"
          />
          <figcaption className="process-title">{title}</figcaption>
        </figure>
        <nav role="window-controls no-drag">
          <button title="Minimize" onClick={handleMinimize}>
            <Minimize2 size={16} />
          </button>
          <button title="Maximize" onClick={handleMaximize}>
            <Expand size={16} />
          </button>
          <button title="Close" onClick={handleClose}>
            <CircleX size={16} />
          </button>
        </nav>
      </header>
      <div
        className="process-content"
        style={{
          width: sessionProcess?.size?.width,
          height: sessionProcess?.size?.height,
          maxWidth: window.innerWidth,
          maxHeight: window.innerHeight,
        }}
      >
        {children}
      </div>
    </div>
  );
};
