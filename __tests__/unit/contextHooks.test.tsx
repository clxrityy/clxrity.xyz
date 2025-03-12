import { useProcessDirectory } from "@/contexts/process";
import { useSession } from "@/contexts/session";
import { contextFactory } from "@/util/contextFactory";
import { render } from "@testing-library/react";

// CONTEXT FACTORY
test("contextFactory returns a Provider & Consumer", () => {
  const { Consumer, Provider } = contextFactory({}, () => ({}));

  expect(Consumer).toBeDefined();
  expect(Provider).toBeDefined();
});

// SESSION CONTEXT HOOKS
test("session data & settings are defined", () => {
  const Component = () => {
    const { data, settings } = useSession();

    expect(data).toBeDefined();
    expect(data).toEqual({});
    expect(settings).toBeDefined();

    return <div />;
  };

  render(<Component />);
});

// PROCESS DIRECTORY
test("processes are defined", () => {
  const Component = () => {
    const { processes } = useProcessDirectory();

    expect(processes).toBeDefined();

    return <div />;
  };

  render(<Component />);
});
