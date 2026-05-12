import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Hides `X-Powered-By: Next.js` in production. */
  poweredByHeader: false,
  /**
   * Emits `.next/standalone` for Docker / self-hosted Node (copy `.next/static` + `public` per Next docs).
   * Vercel and similar platforms ignore this for their own runtime packaging.
   */
  output: "standalone",
};

export default nextConfig;
