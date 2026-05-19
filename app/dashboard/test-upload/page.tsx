'use client';

import { Upload, Check, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

/**
 * Image upload test page
 * Used for testing the R2 image upload API
 */
export default function TestUploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);

    // Handle file selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];

        if (!selectedFile) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

        if (!validTypes.includes(selectedFile.type)) {
            setError('Please select a valid image file (JPEG, PNG, GIF, WebP)');

            return;
        }

        // Validate file size (5MB)
        if (selectedFile.size > 5 * 1024 * 1024) {
            setError('Image size cannot exceed 5MB');

            return;
        }

        setFile(selectedFile);
        setError(null);
        setSuccess(false);
        setUploadedUrl(null);

        // Create preview
        const reader = new FileReader();

        reader.onload = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
    };

    // Upload image
    const handleUpload = async () => {
        if (!file) {
            setError('Please select an image first');

            return;
        }

        setUploading(true);
        setError(null);
        setSuccess(false);

        try {
            const formData = new FormData();

            formData.append('file', file);

            const response = await fetch('/api/upload/image', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Upload failed');
            }

            setUploadedUrl(data.url);
            setSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred during upload');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Image Upload Test</h1>

            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-800">
                    This page is for testing the image upload API. Make sure Cloudflare R2 has been configured in the environment variables.
                </p>
            </div>

            <div className="mb-6">
                <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
                    <input
                        type="file"
                        id="file-input"
                        className="hidden"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleFileChange}
                    />
                    <label htmlFor="file-input" className="cursor-pointer">
                        {preview ? (
                            <div className="relative">
                                <Image
                                    src={preview}
                                    alt="Preview"
                                    width={256}
                                    height={256}
                                    className="max-h-64 mx-auto rounded-md object-contain"
                                />
                                <div className="mt-2 text-sm text-gray-600">Click to change image</div>
                            </div>
                        ) : (
                            <div>
                                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="mt-2">
                                    <p className="text-sm text-gray-600">Click to select an image</p>
                                    <p className="text-xs text-gray-500 mt-1">Supports JPEG, PNG, GIF, WebP (max 5MB)</p>
                                </div>
                            </div>
                        )}
                    </label>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
                    <AlertCircle className="text-red-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
                    <p className="text-red-700 text-sm">{error}</p>
                </div>
            )}

            {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-start">
                    <Check className="text-green-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
                    <p className="text-green-700 text-sm">Image uploaded successfully!</p>
                </div>
            )}

            <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className={`w-full py-2 px-4 rounded-md flex items-center justify-center ${!file || uploading
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
            >
                {uploading ? (
                    <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        Uploading...
                    </>
                ) : (
                    <>
                        <Upload className="mr-2" size={18} />
                        Upload Image
                    </>
                )}
            </button>

            {uploadedUrl && (
                <div className="mt-6">
                    <h3 className="font-medium mb-2">Upload Result:</h3>
                    <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm font-mono break-all">{uploadedUrl}</p>
                        <div className="mt-2">
                            <a
                                href={uploadedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                                Open image in new window
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 