import { PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from './r2';

/**
 * Validate file type
 * @param contentType MIME type
 * @returns Whether it is a valid image type
 */
export function isValidImageType(contentType: string): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

    return validTypes.includes(contentType);
}

/**
 * Extract extension from file name
 * @param filename File name
 * @returns File extension
 */
export function getExtensionFromFilename(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || 'jpg';
}

/**
 * Upload image to Cloudflare R2 storage
 * @param file File Buffer
 * @param filename Original file name
 * @param contentType File MIME type
 * @returns Public access URL after upload
 */
export async function uploadImageToR2(
    file: Buffer,
    filename: string,
    contentType: string
): Promise<string> {
    // Generate unique file name
    const ext = getExtensionFromFilename(filename);
    const uniqueFilename = `${Date.now()}-${uuidv4().substring(0, 8)}.${ext}`;

    // Store under images folder, organized by year and month
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const key = `images/${year}/${month}/${uniqueFilename}`;

    // upload file to R2
    await r2Client.send(
        new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            Body: file,
            ContentType: contentType,
            // Set public access permission (requires bucket configured as publicly readable)
            ACL: 'public-read',
        })
    );

    // return accessible URL
    return `${R2_PUBLIC_URL}/${key}`;
} 