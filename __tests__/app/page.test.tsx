import { render, screen } from "@testing-library/react";
import Page from "@/app/page";

test("page is defined", () => {
  expect(Page).toBeDefined();

  render(<Page />, {
    wrapper: ({ children }) => <div data-testid="main-page">{children}</div>,
  });

  expect(screen.getByTestId("main-page")).toBeDefined();
});
