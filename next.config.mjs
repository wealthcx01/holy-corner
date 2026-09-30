/** @type {import('next').NextConfig} */
const nextConfig = {
  // The hub reads the two studios through their own APIs and holds the group-level record itself.
  // Nothing experimental is needed for the shell (HC-002).
  reactStrictMode: true,
};

export default nextConfig;
