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
            // MongoDB 相关模块
            mongodb: false,
            'mongodb-client-encryption': false,
            '@mongodb-js/zstd': false,
            snappy: false,
            kerberos: false,
            aws4: false,
        },
    },
    // 保留webpack配置用于生产构建
    webpack: (config, { isServer }) => {
        // 只对客户端构建进行调整，服务器端构建保持不变
        if (!isServer) {
            // 防止客户端包含 Node.js 模块和 MongoDB 相关模块
            // 这解决了 MongoDB 客户端在浏览器环境中尝试加载 Node.js 内置模块的问题
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
                // MongoDB 相关模块
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
                // 匹配所有API路由
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
