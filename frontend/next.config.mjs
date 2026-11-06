// Where the Node API lives. Inside Docker Compose that's the "web" service.
// Note: rewrites are baked in at build time.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://web:3000";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Bundle only what's needed to run -> small Docker image (see Dockerfile)
  output: "standalone",

  // Proxy: the browser only talks to Next.js (same origin, no CORS),
  // Next.js forwards these paths to the backend.
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` },
      { source: "/docs", destination: "/docs.html" }  // Swagger UI in public/
    ];
  }
};

export default nextConfig;
