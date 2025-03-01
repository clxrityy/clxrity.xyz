import { render, screen } from "@testing-library/react";
import Layout from "@/app/layout";

test("renders layout", () => {
  expect(Layout).toBeDefined();

  render(
    <Layout>
      <div>Test</div>
    </Layout>,
  );

  expect(screen.getByText("Test")).toBeDefined();
});
