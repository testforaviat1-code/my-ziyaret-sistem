/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! UYARI !!
    // Projeyi canlıya alırken TypeScript hatalarını görmezden geliyoruz.
    ignoreBuildErrors: true,
  },
  eslint: {
    // !! UYARI !!
    // Projeyi canlıya alırken ESLint (yazım kuralları) hatalarını görmezden geliyoruz.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;