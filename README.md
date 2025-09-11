# hbd.clxrity.xyz

Refined Next.js (App Router) app using:

- Neon Postgres + Prisma (Node runtime)
- Vercel Edge API routes using `@neondatabase/serverless`
- OAuth2 dashboard with NextAuth (GitHub provider example)

## Setup

1. Copy envs

```sh
cp .env.example .env
```

2. Fill `DATABASE_URL`/`NEON_DATABASE_URL`, `AUTH_SECRET`, `GITHUB_ID`, `GITHUB_SECRET`.
3. Install deps

```sh
pnpm i # or npm i / yarn
```

4. Init DB

```sh
pnpm prisma:generate
pnpm prisma:migrate --name init
```

5. Dev

```sh
pnpm dev
```

## Notes

- Edge routes (/api/events, /api/commands) run in Edge runtime and use Neon serverless driver directly (no Prisma in Edge).
- NextAuth uses Prisma adapter and database strategy for sessions.
- `/dashboard` is protected via server-side auth in the page (no middleware to avoid bundling Prisma in Edge).
- Base URL resolution is automatic:
  1. CF_TUNNEL_URL > AUTH_URL/NEXTAUTH_URL/NEXT_PUBLIC_APP_URL
  2. VERCEL_URL/RENDER_EXTERNAL_URL
  3. x-forwarded-\* headers
  4. fallback http://localhost:3000 in dev

## Deploy (Vercel)

- Set envs in Vercel project.
- Ensure Neon connection string has `sslmode=require`.
- Edge routes will automatically run close to users.

## Local development with Cloudflare Tunnel

Expose your local Next.js server to the internet for OAuth callbacks and webhooks.

1. Install cloudflared (macOS)

```sh
brew install cloudflared
```

2. Start your dev server

```sh
pnpm dev
```

3. Start a quick tunnel to your local server

```sh
cloudflared tunnel --url http://localhost:3000
```

This prints a public URL like: `https://random-subdomain.trycloudflare.com`.

4. Update external callbacks to use the tunnel URL

- NextAuth: set your provider callback/redirect to
  `https://<your-tunnel-host>/api/auth/callback/<provider>`
- Any webhook/interactions endpoints: point the external service to
  `https://<your-tunnel-host>/<your-endpoint>`

5. Adjust envs while tunneling

- For NextAuth v5 style: set `AUTH_URL=https://<your-tunnel-host>`
- For v4 style: set `NEXTAUTH_URL=https://<your-tunnel-host>`

Notes

- Quick tunnels are ephemeral; if you stop cloudflared, the URL changes. Update provider/webhook settings accordingly.
- Keep your local server and cloudflared running while testing.

### One-command tunnel

You can run dev with an automatic Cloudflare quick tunnel that exports `CF_TUNNEL_URL` for the app:

```sh
pnpm dev:tunnel
```

This will:

- Start `cloudflared tunnel --url http://localhost:3000`
- Capture the public URL and inject it as `CF_TUNNEL_URL`
- Start `pnpm dev` with that env so callbacks resolve correctly

Additionally, the script writes `.env.local` keys:

- `CF_TUNNEL_URL`, `AUTH_URL`, and `NEXTAUTH_URL` are updated to the current tunnel URL for tools that read from files.

Discord note: Discord does not expose an API to modify the app’s allowed redirect URLs programmatically.

- For zero-churn dev, use a Cloudflare Named Tunnel with a custom hostname (e.g., `dev.example.com`) and register that once in the Discord Developer Portal.
