/**
 * Static export for GitHub Pages.
 * `basePath` must match the repository name (PRD §11); `.nojekyll` is emitted
 * into `out/` by scripts/postbuild.mjs via the `build` script's export step.
 */
const isProd = process.env.NODE_ENV === 'production'
const basePath = isProd ? '/morfologi-kota' : ''

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
}

module.exports = nextConfig
