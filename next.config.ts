import type { NextConfig } from 'next'
import { routes } from '@/shared/config/ROUTES'

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    return config
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: routes.createMultiple,
        permanent: true,
      },
    ]
  },
}

export default nextConfig
