import { NextResponse } from 'next/server';

// Handle HTML file upload
export async function POST(request: Request) {
    try {
        // Use standard Web FormData API to handle uploaded files
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { success: false, message: 'No file found' },
                { status: 400 }
            );
        }

        // Check file type
        const fileType = file.type;

        if (fileType !== 'text/html' && !fileType.includes('html')) {
            return NextResponse.json(
                { success: false, message: 'Only HTML files are supported' },
                { status: 400 }
            );
        }

        // Get file content
        const fileContent = await file.text();

        // Check if content is valid HTML
        if (!fileContent.includes('<!DOCTYPE html>') && !fileContent.includes('<html') && !fileContent.includes('<body')) {
            return NextResponse.json(
                { success: false, message: 'The file content is not a valid HTML' },
                { status: 400 }
            );
        }

        // return HTML content
        return NextResponse.json({
            success: true,
            message: 'HTML file uploaded successfully',
            data: {
                htmlContent: fileContent,
                filename: file.name,
            }
        });
    } catch {
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to upload HTML file, please try again later',
            },
            { status: 500 }
        );
    }
} 