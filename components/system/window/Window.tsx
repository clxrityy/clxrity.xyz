"use client";
import { ProcessWrapper } from "./ProcessWrapper";
import { Rnd } from "react-rnd";
import { SessionProcess, useSession } from "@/contexts/session";
import { useProcessDirectory } from "@/contexts/process";
import { useCallback, useEffect, useRef } from "react";
import { useResizable } from "@/hooks/useResizable";
import { useDraggable } from "@/hooks/useDraggable";

export const Window = ({
  children,
  pid,
}: {
  children: React.ReactNode;
  pid: string;
}) => {
  const {
    processes: {
      [pid]: { isMinimized, isMaximized },
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

  const rndRef = useRef<Rnd>(null);
  const { updateSize } = useResizable(isMaximized);
  const {
    updatePosition,
    x: positionX,
    y: positionY,
  } = useDraggable(isMaximized);

  const handleResize = useCallback(() => {
    if (isMaximized) {
      rndRef.current?.updateSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    if (positionX >= window.innerWidth || positionY >= window.innerHeight) {
      rndRef.current?.updatePosition({
        x: 0,
        y: 0,
      });
    }
  }, [isMaximized, positionX, positionY]);

  useEffect(() => {
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [handleResize]);

  return (
    <Rnd
      enableResizing={{
        top: !isMaximized,
        right: !isMaximized,
        bottom: !isMaximized,
        left: !isMaximized,
        topRight: !isMaximized,
        bottomRight: !isMaximized,
        bottomLeft: !isMaximized,
        topLeft: !isMaximized,
      }}
      dragPositionOffset={{ x: 0, y: 0 }}
      onDrag={updatePosition}
      disableDragging={isMaximized}
      minWidth={200}
      bounds="window"
      minHeight={100}
      maxWidth={window.innerWidth}
      maxHeight={window.innerHeight}
      ref={rndRef}
      cancel=".no-drag"
      dragHandleClassName="handle"
      default={{
        x:
          sessionProcess && sessionProcess.position
            ? sessionProcess.position.x
            : x,
        y:
          sessionProcess && sessionProcess.position.y
            ? sessionProcess.position.y
            : y,
        width:
          sessionProcess && sessionProcess.size
            ? sessionProcess.size.width
            : width,
        height:
          sessionProcess && sessionProcess.size
            ? sessionProcess.size.height
            : height,
      }}
      onResize={(_e, _direction, { style }) => {
        if (!isMaximized) {
          setCurrentProcesses({
            ...currentProcesses,
            [pid]: {
              ...sessionProcess,
              size: {
                width: style.width,
                height: style.height,
              },
            },
          });
        }
      }}
      onDragStop={(_e, { x, y }) => {
        if (!isMaximized) {
          setCurrentProcesses({
            ...currentProcesses,
            [pid]: {
              ...sessionProcess,
              position: { x, y },
            },
          });
        }
      }}
      onResizeStop={updateSize}
      position={{
        x:
          sessionProcess && sessionProcess.position
            ? sessionProcess.position.x
            : x,
        y:
          sessionProcess && sessionProcess.position.y
            ? sessionProcess.position.y
            : y,
      }}
      className="transition-transform ease-out"
    >
      <section
        className={`${isMinimized ? "hidden" : "block"} h-full w-full relative`}
        role="window"
      >
        <ProcessWrapper pid={pid} isMaximized={isMaximized}>
          {children}
        </ProcessWrapper>
      </section>
    </Rnd>
  );
};
