import { S3Client } from '@aws-sdk/client-s3';

/**
 * Cloudflare R2 storage client configuration
 * Interact with Cloudflare R2 using the AWS S3-compatible API
 */
export const r2Client = new S3Client({
    region: 'auto', // Cloudflare R2 uses auto as region
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
});

// Bucket name
export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'amazon-frontend-assets';

// Public access URL prefix
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; 