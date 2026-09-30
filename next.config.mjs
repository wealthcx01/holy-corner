/** @type {import('next').NextConfig} */
const nextConfig = {
  // The hub reads the two studios through their own APIs and holds the group-level record itself.
  // Nothing experimental is needed for the shell (HC-002).
  reactStrictMode: true,
  /**
   * `pg` is required at runtime rather than bundled. It opens TCP sockets and reads files for TLS
   * certificates, neither of which survives a bundler, and the repository only ever runs on the
   * server (`lib/db` is `server-only`).
   */
  serverExternalPackages: ['pg'],
};

export default nextConfig;
