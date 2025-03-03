import { useSessionContextState } from "@/hooks/useSessionContextState";
// import { useProcessContextState } from "@/hooks/useProcessContextState";
import { processDirectory } from "@/util/processDirectory";

test("session data & settings are defined", () => {
  const { data, settings } = useSessionContextState();

  expect(data).toBeDefined();
  expect(data).toEqual({});
  expect(settings).toBeDefined();
});

test("processDirectory is defined", () => {
  expect(processDirectory).toBeDefined();
});
