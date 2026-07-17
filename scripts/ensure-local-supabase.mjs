import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(".env.local");
if (!existsSync(envPath)) process.exit(0);

const localEnv = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.match(/^([^#=]+)=(.*)$/))
    .filter(Boolean)
    .map((match) => [match[1], match[2].replace(/^['"]|['"]$/g, "")]),
);

const apiUrl = localEnv.SUPABASE_URL ?? localEnv.VITE_SUPABASE_URL;
if (!apiUrl?.startsWith("http://127.0.0.1:")) process.exit(0);

async function isHealthy() {
  try {
    const response = await fetch(`${apiUrl}/auth/v1/health`, {
      signal: AbortSignal.timeout(2_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

if (!(await isHealthy())) {
  console.log("Supabase lokal belum aktif; menyalakan service inti...");
  const executable = resolve(
    "node_modules",
    ".bin",
    process.platform === "win32" ? "supabase.cmd" : "supabase",
  );
  const result = spawnSync(
    executable,
    [
      "start",
      "-x",
      "analytics,edge-runtime,functions,imgproxy,inbucket,meta,realtime,storage,studio,vector",
    ],
    { stdio: "inherit", shell: process.platform === "win32" },
  );
  if (result.status !== 0 || !(await isHealthy())) {
    console.error("Supabase lokal gagal aktif. Pastikan Docker Desktop berjalan, lalu coba lagi.");
    process.exit(1);
  }
}

console.log("Supabase lokal siap.");
