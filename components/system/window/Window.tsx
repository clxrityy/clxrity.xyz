import { useProcessDirectoryStore } from "@/hooks/useProcessDirectory";
import { ProcessWrapper } from "./ProcessWrapper";

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
  } = useProcessDirectoryStore();

  return (
    <section className={`${isMinimized ? "hidden" : "block"}`} role="window">
      <ProcessWrapper pid={pid}>{children}</ProcessWrapper>
    </section>
  );
};
