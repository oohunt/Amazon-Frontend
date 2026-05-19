import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { NextResponse, type NextRequest } from 'next/server'
import { v4 as uuidv4 } from 'uuid';

import { auth } from '@/auth';

// initialize S3 client (for Cloudflare R2)
const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
});

// Allowed file types
const ALLOWED_FILE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
];

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Whether in test mode
const TEST_MODE = process.env.R2_TEST_MODE === 'true';

export async function POST(request: NextRequest) {
    try {
        // Validate user identity
        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json(
                { error: 'Unauthorized access' },
                { status: 401 }
            );
        }

        // Check user role (optional, adjust as needed)
        // Admin role validation can be added here based on actual needs

        // Handle form data
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'File not found' },
                { status: 400 }
            );
        }

        // Validate file type
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: 'Unsupported file type' },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: 'File size exceeds limit (5MB)' },
                { status: 400 }
            );
        }

        // If in test mode, return mock success response
        if (TEST_MODE) {

            // Generate unique file name
            const extension = file.name.split('.').pop() || '';
            const fileName = `test-${uuidv4()}.${extension}`;
            const filePath = `uploads/images/${fileName}`;

            // Build mock URL
            const publicUrl = `https://test-r2-url.example.com/${filePath}`;

            return NextResponse.json({
                success: true,
                url: publicUrl,
                fileName,
                testMode: true
            });
        }

        // Read file content
        const fileBuffer = Buffer.from(await file.arrayBuffer());

        // Generate unique file name
        const extension = file.name.split('.').pop() || '';
        const fileName = `${uuidv4()}.${extension}`;
        const filePath = `uploads/images/${fileName}`;

        // Upload to R2
        await s3Client.send(new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: filePath,
            Body: fileBuffer,
            ContentType: file.type,
        }));

        // Build public URL
        const publicUrl = `${process.env.R2_PUBLIC_URL}/${filePath}`;

        return NextResponse.json({
            success: true,
            url: publicUrl,
            fileName,
        });

    } catch {

        return NextResponse.json(
            { error: 'Failed to upload image' },
            { status: 500 }
        );
    }
}

// Set maximum allowed payload size (10MB)
export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
}; 