const isDev = process.env.NODE_ENV !== 'production';

// Content-Security-Policy. 'unsafe-inline' is required by Next.js hydration
// scripts and Framer Motion style attributes; 'unsafe-eval' and ws: are
// dev-only (webpack HMR). Tighten to nonces when moving off inline scripts.
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://va.vercel-scripts.com${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https: https://www.google-analytics.com",
  "font-src 'self' data:",
  `connect-src 'self' https: https://www.google-analytics.com https://stats.g.doubleclick.net https://vitals.vercel-insights.com${isDev ? ' ws:' : ''}`,
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const nextConfig = {
  poweredByHeader: false,
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com', pathname: '/**' },
    ],
  },
  experimental: {
    // Remove if not using Server Components
    serverComponentsExternalPackages: ['mongodb'],
    // Tree-shake heavy barrel-file packages at import time
    optimizePackageImports: ['recharts', 'date-fns'],
  },
  webpack(config, { dev }) {
    if (dev) {
      // Native FS events + ignore node_modules; polling burns CPU and
      // delays rebuilds, so only aggregate rapid successive changes.
      config.watchOptions = {
        aggregateTimeout: 300,
        ignored: ['**/node_modules'],
      };
    }
    return config;
  },
  onDemandEntries: {
    // Keep all dashboard pages compiled in dev — evicting after 10s with a
    // 2-page buffer forced a recompile on almost every navigation.
    maxInactiveAge: 15 * 60 * 1000,
    pagesBufferLength: 16,
  },
  async headers() {
    // Keep private app surfaces out of search indexes. Previously set by
    // middleware.js, removed because Vercel's Edge runtime crashed on it.
    const noindexPaths = [
      '/dashboard/:path*', '/settings/:path*', '/onboarding/:path*',
      '/login/:path*', '/signup/:path*', '/forgot-password/:path*', '/reset-password/:path*', '/api/:path*',
      '/security-scan/:path*', '/seo-audit/:path*', '/aeo-audit/:path*',
      '/geo-audit/:path*', '/site-health/:path*', '/uptime/:path*',
      '/domain-health/:path*', '/brand-visibility/:path*',
      '/companies/:path*', '/plans/:path*',
    ];
    return [
      ...noindexPaths.map((source) => ({
        source,
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      })),
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Access-Control-Allow-Origin", value: process.env.CORS_ORIGINS || "https://igrisradar.com" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization, X-Tenant-Id" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
