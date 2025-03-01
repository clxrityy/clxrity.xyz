import { render, screen } from "@testing-library/react";
import Page from "@/app/page";

test("page is defined", () => {
  expect(Page).toBeDefined();

  render(<Page />);

  expect(screen.getByRole("main-page")).toBeDefined();
});
