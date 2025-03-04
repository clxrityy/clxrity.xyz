import { ProcessConsumer } from "@/context/process";
import { type Process } from "@/util/processDirectory";
import dynamic from "next/dynamic";

const Window = dynamic(() =>
  import("@/components/system/Window").then((mod) => mod.Window),
);

const withWindow = (Component: React.ComponentType) => (
  <Window>
    <Component />
  </Window>
);

const RenderProcess = ({ Component, hasWindow }: Process) =>
  hasWindow ? withWindow(Component) : <Component />;

export const ProcessLoader = () => (
  <ProcessConsumer>
    {({ processes }) =>
      Object.entries(processes).map(([id, process]) => (
        <RenderProcess key={id} {...process} />
      ))
    }
  </ProcessConsumer>
);
