import { render, screen } from "@testing-library/react";
import Page from "@/app/page";

test("renders page", () => {
  render(<Page />);
  expect(screen.getByLabelText("main-page")).toBeDefined();
});
