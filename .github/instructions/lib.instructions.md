---
applyTo: "lib/**/*.ts"
---

# Lib Directory Instructions

These instructions apply to all files within the `lib` directory of the repository. If there are conflicting instructions in a file-specific instruction set, the file-specific instructions take precedence.

## Usage Guidelines

- The `lib` directory is intended for utility functions, helpers, and shared logic that can be reused across different parts of the application.
- Ensure that functions, files, and sub-directories are separated logically to promote reusability and maintainability.

## Directory Structure

- Organize files and sub-directories based on functionality or feature sets.
- Avoid placing large, monolithic files in the `lib` directory; instead, break them down into smaller, focused modules.

### Directories

- If a sub-directory is created, it should contain an `index.ts` file that exports all relevant functions or classes from that directory.
- Each sub-directory should have a clear purpose and should not mix unrelated functionalities.

#### Directory-Specific Guidelines

- `lib/commands`: Should contain data related to application commands and their handling.
  - Specific utility functions related to a command's processing should be organized into separate sub-directories respecting their functionality.
- `lib/db`: Should contain database-related utilities and helpers.
  - All database connection logic, query builders, and ORM-related utilities should be placed here.
  - Ensure any sensitve information, including but not limited to user information, is encrypted and handled securely.
- `lib/discord`: Should contain utilities and helpers specific to Discord integration.
  - All Discord API interactions, event handlers, and related utilities should be placed here.
- `lib/constants`: Should contain constant values used throughout the application.
  - Group related constants into separate files within this directory for better organization.
