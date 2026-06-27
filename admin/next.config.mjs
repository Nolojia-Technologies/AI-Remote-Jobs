/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
