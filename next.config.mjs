// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,

    // output: 'export', // REMOVED: Enables API Routes for Vercel
    // images: { unoptimized: true },

    // This addresses the "turbopack.root should be absolute" warning
    // and plays fine on Vercel as well.
    turbopack: {
        root: process.cwd(),
    },
};

export default nextConfig;
