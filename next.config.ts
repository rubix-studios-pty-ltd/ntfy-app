import { type NextConfig } from 'next'

const isProduction = process.env.NODE_ENV === 'production'

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
    useTypeScriptCli: true,
    webpackMemoryOptimizations: isProduction,
  },
  images: { unoptimized: true },
  output: 'export',
  trailingSlash: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: !isProduction,
  reactStrictMode: true,
}

export default nextConfig
