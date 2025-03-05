import { ProcessConsumer } from "@/context/process";
import { ToolbarProcess } from "./ToolbarProcess";

export const ToolbarProcesses = () => {
  return (
    <ul>
      <ProcessConsumer>
        {({ processesMap }) =>
          processesMap(([id, { icon, title }]) => (
            <ToolbarProcess key={id} icon={icon} title={title} />
          ))
        }
      </ProcessConsumer>
    </ul>
  );
};
