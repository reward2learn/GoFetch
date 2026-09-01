/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  serverExternalPackages: [
    "@x402/evm",
    "@x402/svm",
    "@coinbase/cdp-sdk",
    "@base-org/account",
  ],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "@x402/evm": false,
      "@x402/svm/exact/client": false,
      "@x402/svm": false,
      "@coinbase/cdp-sdk": false,
      "@metamask/connect-evm": false,
    };
    // Ignore missing optional wagmi tempo module ("accounts")
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    // Silence warnings from optional wagmi/Reown connectors
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /node_modules\/@wagmi\/core\/dist\/esm\/tempo/ },
      { module: /node_modules\/@wagmi\/connectors\/dist\/esm\/metaMask/ },
    ];
    return config;
  },
};

module.exports = nextConfig;
