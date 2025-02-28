import { useSessionContextState } from "@/hooks/useSessionContextState";
import { useProcessContextState } from "@/hooks/useProcessContextState";
import processDirectory from "@/util/processDirectory";

test("session data & settings is defined", () => {
  const { data, settings } = useSessionContextState();

  expect(data).toBeDefined();
  expect(data).toEqual({});
  expect(settings).toBeDefined();
  expect(settings).toEqual({});
});

test("processes is defined", () => {
  const { processes } = useProcessContextState(processDirectory);

  expect(processes).toBeDefined();
  expect(processes).toEqual(processDirectory);
});
