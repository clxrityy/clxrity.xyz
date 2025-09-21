---
applyTo: "**"
---

# Global Instructions

These instructions apply to all files in the repository. If there are conflicting instructions in a file or directory-specific instruction set, the file-specific instructions take precedence.

## General Guidelines

- Ensure code is clean, well-structured, and follows best practices.
  - Reduce cognitive load by breaking down complex functions into smaller, manageable pieces.
  - Use meaningful variable and function names to enhance readability.
  - Strcture code logically, grouping and nesting related functionalities together.
- Maintain consistency in coding style, including indentation, spacing, and naming conventions.
- Include comments where necessary to explain complex logic or decisions.
- Ensure proper error handling and validation to enhance robustness.
- Optimize for performance where applicable, avoiding unnecessary computations or memory usage.
- Adhere to security best practices, especially when handling sensitive data or user inputs.
- End every change with a brief commit message suggestion summarizing the modifications made.

## Negative Instructions

- Do not introduce any new dependencies or libraries without explicit approval.
- Avoid using deprecated or outdated functions, methods, or libraries.
- Do not make changes that could introduce breaking changes to existing functionality unless explicitly requested.
- Do not remove or alter existing comments unless they are incorrect or misleading.
- Do not make changes that could negatively impact performance or security.

## Structure Organization

The structure of directories and files are organized to separate concerns and enhance maintainability. Common structures include:

- **`app/`**: Contains the main application files, including pages and global styles.
  - `api/`: Contains API route handlers.
  - `(routes)/`: Route group for all available pages.
    - `(legal)/`: Contains legal-related pages like terms of service and privacy policy.
    - `(main)/`: Contains the main application pages.
      - `commands/`: Contains pages related to commands.
      - `dashboard/`: Contains pages related to the user dashboard.
- **`components/`**: Contains reusable UI components.
  - `layout/`: Contains layout-related components, such as headers, footers, and sidebars.
  - `icons/`: Contains icon components used throughout the application.
  - `ui/`: Contains general UI components like buttons, cards, and modals.
  - Page specific components are often placed in directories named after the page or feature they belong to:
    - `commands/`: Components related to the commands page.
    - `dashboard/`: Components related to the dashboard page.
- **`lib/`**: Contains utility functions and libraries.
  - `discord/`: Contains utilities for interacting with the Discord API.
  - `db/`: Contains database-related utilities and functions.
  - `constants/`: Contains constant values used throughout the application.
  - `config/`: Contains configuration values and settings.
  - `commands/`: All command-related logic and utilities.
    - `index.ts`: Main entry point for command registry.
    - `util/`: Utility functions for command handling.
    - `registry/`: Additional registry command data/definitions.
    - `types.ts`: Type definitions for commands.
    - `...`: Other command-related files.
  - `ai/`: Contains AI-related utilities and functions.

See the file-specific instructions for any additional guidelines or exceptions that may apply to particular files or directories.
