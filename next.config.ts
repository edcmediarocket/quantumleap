
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https', // Ensuring this is correct
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    allowedDevOrigins: [ // Ensuring this key and its casing are correct
        "https://9003-firebase-studio-1748613596895.cluster-hf4yr35cmnbd4vhbxvfvc6cp5q.cloudworkstations.dev"
    ],
  },
};

export default nextConfig;
