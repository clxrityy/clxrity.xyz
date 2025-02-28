import { render, screen } from "@testing-library/react";
import Layout from "@/app/layout";

test("renders layout", () => {
  render(
    <Layout>
      <h1>Test</h1>
    </Layout>,
  );
  expect(screen.findByText("Test")).toBeDefined();
});
