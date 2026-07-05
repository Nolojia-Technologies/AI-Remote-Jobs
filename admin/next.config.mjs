import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This admin portal lives inside the mobile app's repo, which has its own
  // lockfile + node_modules (React Native's `react`, no `next`) at the root.
  // Without pinning the root, Next infers the repo root as the workspace and its
  // compiler/file-tracing workers cross into that mismatched module tree, which
  // crashes dev workers ("Jest worker encountered N child process exceptions").
  // Pin the workspace root to this directory so Next stays inside admin/.
  outputFileTracingRoot: __dirname,
  // pdfjs-dist is used server-side for PDF text extraction; keep it external so
  // Next doesn't try to bundle its worker/canvas internals.
  serverExternalPackages: ["pdfjs-dist"],
  // The Supabase project hosts public storage buckets (thumbnails, images, etc.).
  // Allow Next/Image to optimise them. Domain comes from the env URL at build time.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  // The authored curriculum seed under admin/seed is reference data, not part of the build.
  eslint: { ignoreDuringBuilds: false },
};

export default nextConfig;
