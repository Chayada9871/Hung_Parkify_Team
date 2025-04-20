/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['fyvonpbxynpnzylufjfr.supabase.co'],
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/landing',
        permanent: true, // Use true for 301 redirects, false for 302 redirects
      },
    ];
  },
};

export default nextConfig;
