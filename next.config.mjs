/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    GOOGLE_CSE_ID: process.env.GOOGLE_CSE_ID,
    OPENCORPORATES_API_KEY: process.env.OPENCORPORATES_API_KEY
  }
}

export default nextConfig