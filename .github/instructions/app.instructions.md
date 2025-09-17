---
applyTo: "app/**"
---

# App Directory Instructions

These instructions apply to all files within the `app` directory of the repository. If there are conflicting instructions in a file-specific instruction set, the file-specific instructions take precedence.

## General Guidelines

- Follow the [Next.js App Router documentation](https://nextjs.org/docs/app) for best practices and conventions.
- Ensure that server and client components are properly distinguished and used according to their intended purposes.
- Maintain a clear and organized folder structure within the `app` directory to enhance readability and maintainability.
- Use React hooks and context appropriately to manage state and side effects in client components.
- Optimize for performance by leveraging Next.js features such as dynamic imports, image optimization, and caching strategies.
- Ensure proper error handling and loading states for asynchronous operations.

## Files

- All files should be page, layout, or route handlers; avoid placing non-route-related logic directly in the `app` directory.
- Use routing segments effectively to create nested routes and layouts.
- Ensure that API routes are defined in the `app/api` directory and follow RESTful principles.
- Include necessary metadata for pages using the `metadata` export in page components.
- If a particular route has specific styling requirements, an associated CSS or SCSS file should be included in the same directory.

### API Routes

- Ensure API route handlers are stateless and handle requests efficiently.
- Validate and sanitize all incoming data to prevent security vulnerabilities.

#### Edge Functions

- Ensure no edge route exceeds 1MB in size.
- Write edge functions in a modular way to facilitate testing and maintenance.
