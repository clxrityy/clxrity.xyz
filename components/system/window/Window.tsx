import { ProcessWrapper } from "./ProcessWrapper";
import { Rnd } from "react-rnd";
import { useSession } from "@/context/session";
import { useProcessDirectory } from "@/context/processDirectory";

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
      processPosition: { x, y },
      processSize: { width, height },
    },
  } = useSession();

  return (
    <Rnd
      default={{
        x: x!,
        y: y!,
        width: width!,
        height: height!,
      }}
    >
      <section className={`${isMinimized ? "hidden" : "block"}`} role="window">
        <ProcessWrapper pid={pid}>{children}</ProcessWrapper>
      </section>
    </Rnd>
  );
};
