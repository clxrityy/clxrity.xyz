import { useProcessDirectoryStore } from "@/hooks/useProcessDirectory";

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
      {children}
    </section>
  );
};
