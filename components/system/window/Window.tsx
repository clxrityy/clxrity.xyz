"use client";
import { ProcessWrapper } from "./ProcessWrapper";
import { Rnd } from "react-rnd";
import { SessionProcess, useSession } from "@/contexts/session";
import { useProcessDirectory } from "@/contexts/process";

export const Window = ({
  children,
  pid,
}: {
  children: React.ReactNode;
  pid: string;
}) => {
  const {
    processes: {
      [pid]: { isMinimized },
    },
  } = useProcessDirectory();

  const {
    settings: {
      defaultProcessPosition: { x, y },
      defaultProcessSize: { width, height },
    },
    setCurrentProcesses,
    currentProcesses,
  } = useSession();

  const sessionProcess: SessionProcess = currentProcesses[pid];

  return (
    <Rnd
      default={{
        x,
        y,
        width,
        height,
      }}
      onResize={(_e, _direction, ref) =>
        setCurrentProcesses({
          ...currentProcesses,
          [pid]: {
            ...sessionProcess,
            size: {
              width: ref.style.width,
              height: ref.style.height,
            },
          },
        })
      }
      onDragStop={(_e, { x, y }) =>
        setCurrentProcesses({
          ...currentProcesses,
          [pid]: {
            ...sessionProcess,
            position: { x, y },
          },
        }) as void
      }
    >
      <section className={`${isMinimized ? "hidden" : "block"}`} role="window">
        <ProcessWrapper pid={pid}>{children}</ProcessWrapper>
      </section>
    </Rnd>
  );
};
