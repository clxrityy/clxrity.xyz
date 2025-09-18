---
applyTo: "*.css"
---

# CSS Instructions

This file contains instructions for writing and formatting CSS code. Please follow these guidelines to ensure consistency and readability in your CSS files.

## General Guidelines

- Use meaningful class names that reflect the purpose of the element.
- Make sure to comment your code where necessary to explain complex sections.
- Use shorthand properties where applicable to reduce file size.
- Avoid using `!important` unless absolutely necessary.

### Color Guidelines

- Ensure all colors are defined using variables or constants for easy maintenance.
  - Avoid using too many different colors; stick to a primary color palette.
  - All colors should adjust appropriately based on the theme (light/dark mode).
- Use a consistent color scheme throughout the project.
- Ensure sufficient contrast between text and background colors for accessibility.
  - Use tools like [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) to verify contrast ratios.
- Avoid using colors that may cause issues for color-blind users. Consider using patterns or textures in addition to color to convey information.

### Layout Guidelines

- Ensure screen responsiveness by using media queries appropriately.
  - This should include mobile-first design principles.
  - Containers and grids should be used to ensure proper layout on different screen sizes.
    - Mobile/small devices should have a single-column centered layout for better readability.
    - Tablets/medium devices can have a two-column layout.
    - Desktops/large devices can utilize a multi-column layout as needed.
- Make sure to use relative units (like %, em, rem) instead of absolute units (like px) for better scalability.
- Center content both vertically and horizontally when necessary.
- Use Flexbox or CSS Grid for layout management to ensure flexibility and responsiveness.
- Add appropriate padding, margins, and gaps to elements to ensure a clean and uncluttered layout.
