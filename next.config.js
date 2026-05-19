/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        // ESLint uses rspack-resolver which has a native binding issue on Windows.
        // TypeScript (tsc --noEmit) is used for type-checking instead.
        ignoreDuringBuilds: true,
    },
    images: {
        minimumCacheTTL: 2678400,
        formats: ['image/webp'],
        qualities: [75],
        unoptimized: true,

        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images-na.ssl-images-amazon.com',
            },
            {
                protocol: 'https',
                hostname: 'images-cn.ssl-images-amazon.com',
            },
            {
                protocol: 'https',
                hostname: 'm.media-amazon.com',
            },
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
            {
                protocol: 'https',
                hostname: 'r2.amoze.cc',
            },
        ],
    },
    turbopack: {
        rules: {
            fs: false,
            child_process: false,
            net: false,
            tls: false,
            dns: false,
            os: false,
            cluster: false,
            v8: false,
            // MongoDB-related modules
            mongodb: false,
            'mongodb-client-encryption': false,
            '@mongodb-js/zstd': false,
            snappy: false,
            kerberos: false,
            aws4: false,
        },
    },
    // Keep webpack config for production build
    webpack: (config, { isServer }) => {
        // Adjust client build only, server build remains unchanged
        if (!isServer) {
            // Prevent client from including Node.js and MongoDB-related modules
            // This fixes MongoDB client attempting to load Node.js built-ins in browser environment
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                child_process: false,
                net: false,
                tls: false,
                dns: false,
                os: false,
                cluster: false,
                v8: false,
                // MongoDB-related modules
                mongodb: false,
                'mongodb-client-encryption': false,
                '@mongodb-js/zstd': false,
                snappy: false,
                kerberos: false,
                aws4: false,
            };
        }
        return config;
    },
    async rewrites() {
        return [];
    },
    async headers() {
        return [
            {
                // Match all API routes
                source: '/api/:path*',
                headers: [
                    { key: 'Access-Control-Allow-Credentials', value: 'true' },
                    { key: 'Access-Control-Allow-Origin', value: '*' },
                    { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
                    { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
                ],
            },
        ];
    },
};

export default nextConfig;
