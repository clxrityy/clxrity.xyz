import "@/styles/system/index.css";
import { ImageComponent } from "@/components/ui/Image";
import { useProcessDirectory } from "@/contexts/process";
import { CircleX, Expand, Minimize2 } from "lucide-react";
import { useCallback } from "react";

export type ProcessWrapperProps = {
  pid: string;
  children: React.ReactNode;
};

export const ProcessWrapper = ({ pid, children }: ProcessWrapperProps) => {
  const {
    processes: {
      [pid]: { icon, title },
    },
    minimize,
    maximize,
    close,
  } = useProcessDirectory();

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
      <header>
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
        <nav role="window-controls">
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
      <div className="process-content">{children}</div>
    </div>
  );
};
