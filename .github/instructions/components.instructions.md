---
applyTo: "/components/**"
---

# Components Directory Instructions

These instructions apply to all files within the `components` directory of the repository. If there are conflicting instructions in a file-specific instruction set, the file-specific instructions take precedence.

## Usage Guidelines

- The `components` directory is intended for reusable UI components that can be shared across different parts of the application.
- Ensure components are separated logically to promote reusability and maintainability.
- Multiple components can be grouped into sub-directories based on their functionality or feature sets.
  - Examples:
    - `components/ui`: For general UI components like buttons, modals, etc.
    - `components/layout`: For layout-related components like headers, footers, grids, etc.
    - ...and so on.

## Reusability

- Components should be designed to be as reusable as possible. Avoid hardcoding values; instead, use props to pass data and configurations.
- Ensure that components are self-contained and do not rely on external state or context unless absolutely necessary.
- Each component should have its own file named after the component (e.g., `Button.tsx` for a `Button` component).
- If a specific component is complex and requires multiple files (e.g., styles, tests), consider creating a sub-directory for that component.
  - Export the main component from an `index.ts` file within the sub-directory.

## Do Not

- Do not place page-specific components in the `components` directory. These should reside in their respective page directories.
  - Example: A component used only in the dashboard page should be placed in `app/dashboard/_components` or a similar structure.
- Do not mix unrelated components in the same file or directory. Each component should have a clear purpose and should not mix unrelated functionalities.
- Do not include business logic or data fetching within components. Components should focus solely on rendering UI based on the props they receive.
