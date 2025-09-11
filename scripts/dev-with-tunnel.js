#!/usr/bin/env node
/*
  Starts cloudflared quick tunnel to http://localhost:3000, captures the URL,
  sets CF_TUNNEL_URL in the environment, and launches `pnpm dev` with it.

  Requirements: `cloudflared` installed in PATH.
*/
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const readline = require("node:readline");

const DEV_URL = process.env.DEV_URL || "http://localhost:3000";

function startTunnel() {
  return new Promise((resolve, reject) => {
    const cf = spawn("cloudflared", ["tunnel", "--url", DEV_URL], {
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });

    let tunnelUrl = "";
    const rl = readline.createInterface({ input: cf.stdout });

    rl.on("line", (line) => {
      // cloudflared logs lines like: "https://xxxx.trycloudflare.com"
      const match = line.match(/https?:\/\/[-a-z0-9.]+\.trycloudflare\.com/);
      if (match && !tunnelUrl) {
        tunnelUrl = match[0];
        console.log(`[dev-with-tunnel] Tunnel URL: ${tunnelUrl}`);
        resolve({ cf, tunnelUrl });
      }
      process.stdout.write(`[cloudflared] ${line}\n`);
    });

    cf.stderr.on("data", (data) => {
      process.stderr.write(`[cloudflared:err] ${data}`);
    });

    cf.on("exit", (code) => {
      if (!tunnelUrl)
        reject(
          new Error(`cloudflared exited before providing URL (code ${code})`)
        );
    });
  });
}

async function main() {
  try {
    const { cf, tunnelUrl } = await startTunnel();

    // Launch Next dev with CF_TUNNEL_URL injected
    const env = { ...process.env, CF_TUNNEL_URL: tunnelUrl };
    console.log(
      `[dev-with-tunnel] Starting dev with CF_TUNNEL_URL=${tunnelUrl}`
    );

    // Also write AUTH_URL and NEXTAUTH_URL to .env.local for local tools that read files only
    try {
      const envLocalPath = path.join(process.cwd(), ".env.local");
      upsertEnv(envLocalPath, {
        CF_TUNNEL_URL: tunnelUrl,
        AUTH_URL: tunnelUrl,
        NEXTAUTH_URL: tunnelUrl,
      });
      console.log(`[dev-with-tunnel] Updated .env.local with tunnel URLs`);
    } catch (e) {
      console.warn(
        `[dev-with-tunnel] Skipped writing .env.local: ${e.message}`
      );
    }

    const dev = spawn("pnpm", ["dev"], { stdio: "inherit", env });

    const shutdown = () => {
      console.log("\n[dev-with-tunnel] Shutting down...");
      dev.kill("SIGINT");
      cf.kill("SIGINT");
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

    dev.on("exit", (code) => {
      console.log(`[dev-with-tunnel] dev exited with code ${code}`);
      cf.kill("SIGINT");
      process.exit(code ?? 0);
    });
  } catch (e) {
    console.error("[dev-with-tunnel] Error:", e.message);
    process.exit(1);
  }
}

main();

function upsertEnv(filePath, kv) {
  let content = "";
  if (fs.existsSync(filePath)) content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/).filter(Boolean);
  const keys = Object.keys(kv);

  const map = new Map();
  for (const line of lines) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) map.set(m[1], m[2]);
  }
  for (const k of keys) {
    // Quote value to be safe
    map.set(k, JSON.stringify(String(kv[k])));
  }
  const out =
    Array.from(map.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join("\n") + "\n";
  fs.writeFileSync(filePath, out, "utf8");
}
