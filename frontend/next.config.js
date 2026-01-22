/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // クリティカルCSSをインライン化してレンダリングブロックを削減
    optimizeCss: true,
  },
};

module.exports = nextConfig;
