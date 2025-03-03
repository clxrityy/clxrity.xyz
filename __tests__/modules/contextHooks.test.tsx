import { useSessionContextState } from "@/hooks/useSessionContextState";
import { processDirectory } from "@/util/processDirectory";
import { contextFactory } from "@/util/contextFactory";

// SESSION CONTEXT HOOKS
test("session data & settings are defined", () => {
  const { data, settings } = useSessionContextState();

  expect(data).toBeDefined();
  expect(data).toEqual({});
  expect(settings).toBeDefined();
});

// PROCESS DIRECTORY
test("processDirectory is defined", () => {
  expect(processDirectory).toBeDefined();
});

// CONTEXT FACTORY
test("contextFactory returns a Provider & Consumer", () => {
  const { Consumer, Provider } = contextFactory({}, () => ({}));

  expect(Consumer).toBeDefined();
  expect(Provider).toBeDefined();
});
