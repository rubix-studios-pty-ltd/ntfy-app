import { type NextConfig } from 'next'

const isProduction = process.env.NODE_ENV === 'production'
const internalHost = process.env.TAURI_DEV_HOST || 'localhost'

const nextConfig: NextConfig = {
  compiler: {
    reactRemoveProperties: isProduction,
  },
  devIndicators: false,
  enablePrerenderSourceMaps: !isProduction,
  experimental: {
    esmExternals: true,
    inlineCss: true,
    turbopackRemoveUnusedExports: isProduction,
    turbopackSourceMaps: !isProduction,
    viewTransition: true,
    webpackMemoryOptimizations: isProduction,
  },
  images: { unoptimized: true },
  output: 'export',
  poweredByHeader: false,
  productionBrowserSourceMaps: !isProduction,
  reactStrictMode: true,
  allowedDevOrigins: ['127.0.0.1', 'localhost', 'tauri://localhost'],
  assetPrefix: isProduction ? undefined : `http://${internalHost}:5173/`,
}

export default nextConfig
