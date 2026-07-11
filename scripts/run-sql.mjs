// Run SQL against the linked Supabase project via the Management API.
// Usage: node scripts/run-sql.mjs <file.sql>   or   node scripts/run-sql.mjs -q "select 1"
// Reads SUPABASE_ACCESS_TOKEN from .env (never pass the token on the command line).
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = readFileSync(resolve(root, ".env"), "utf8");
const token = env.match(/^SUPABASE_ACCESS_TOKEN=(\S+)/m)?.[1];
const ref = env.match(/^EXPO_PUBLIC_SUPABASE_URL=https:\/\/([a-z0-9]+)\./m)?.[1];
if (!token || !ref) {
  console.error("Missing SUPABASE_ACCESS_TOKEN or EXPO_PUBLIC_SUPABASE_URL in .env");
  process.exit(1);
}

const query =
  process.argv[2] === "-q"
    ? process.argv[3]
    : readFileSync(resolve(root, process.argv[2]), "utf8");

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query }),
});

const text = await res.text();
if (!res.ok) {
  console.error(`HTTP ${res.status}`);
  console.error(text.slice(0, 3000));
  process.exit(1);
}
try {
  console.log(JSON.stringify(JSON.parse(text), null, 2).slice(0, 6000));
} catch {
  console.log(text.slice(0, 6000));
}
