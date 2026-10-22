# Preview Worker (`/s/*`)

This Worker renders read-only share pages for canonical media keys on `/s/<key>`.

## Scope

- Allowed methods: `GET`, `HEAD`
- Uses `MEDIA_BUCKET.head(key)` only (no list/write/read-body)
- Uses trusted `PUBLIC_BASE_URL` for canonical/raw URLs (never `Host`)
- Shared modules: `src/media-types.ts`, `src/embeds.ts`

## Local checks

Typecheck:

```bash
pnpm tsc -p worker/tsconfig.json
```

Tests:

```bash
pnpm vitest run --config worker/vitest.config.ts
```