const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseHostname;

try {
  supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : undefined;
} catch {
  supabaseHostname = undefined;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      ...(supabaseHostname
        ? [
            {
              protocol: 'https',
              hostname: supabaseHostname,
            },
          ]
        : []),
    ],
    unoptimized: true,
  },
};

module.exports = nextConfig;
