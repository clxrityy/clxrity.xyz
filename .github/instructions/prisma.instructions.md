---
applyTo: "**/*.prisma"
---

# Prisma Directory Instructions

These instructions apply to all files within the `prisma` directory of the repository. If there are conflicting instructions in a file-specific instruction set, the file-specific instructions take precedence.

## General Guidelines

- Follow the [Prisma documentation](https://www.prisma.io/docs/) for best practices and conventions.
- Structure your Prisma schema logically, grouping related models and enums together.
- Use meaningful names for models, fields, and relations to enhance readability.
- Optimize your database schema for performance, considering indexing and normalization where appropriate.
- Document complex relationships and constraints within the schema using comments.
- Relation fields should be explicitly defined and properly indexed to optimize query performance.

## Objectives

- Store and encrypt user data securely.
- Ensure data integrity and consistency through appropriate constraints and relations.
- Optimize database queries for performance and scalability.
- Facilitate easy migrations and schema updates with clear versioning.
- Maintain a clear separation between different types of data (e.g., user data, application data, logs).
- Ensure compliance with relevant data protection regulations (e.g., GDPR, CCPA).
