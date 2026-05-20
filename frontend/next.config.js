/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    NEXT_PUBLIC_CURRENCY: 'PKR',
    NEXT_PUBLIC_CURRENCY_SYMBOL: '₨',
  },
}

module.exports = nextConfig
