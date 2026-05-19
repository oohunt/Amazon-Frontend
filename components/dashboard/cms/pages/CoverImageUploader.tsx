import { Upload, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import React, { useState, useCallback } from 'react';

interface CoverImageUploaderProps {
    currentImageUrl: string;
    onImageUploaded: (url: string) => void;
}

/**
 * Cover image upload component
 * Cover image upload for CMS pages
 */
export default function CoverImageUploader({ currentImageUrl, onImageUploaded }: CoverImageUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState(currentImageUrl);

    // Update internal status when external currentImageUrl changes
    React.useEffect(() => {
        setImageUrl(currentImageUrl);
    }, [currentImageUrl]);

    // Handle file upload (Moved before handleDrop)
    const handleFileUpload = useCallback(async (file: File) => {
        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

        if (!validTypes.includes(file.type)) {
            setError('Please select a valid image file (JPEG, PNG, GIF, WebP, SVG)');

            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image size must be less than 5MB');

            return;
        }

        setIsUploading(true);
        setError(null);

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

            // Set internal status and notify parent component
            setImageUrl(data.url);
            onImageUploaded(data.url);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred during upload');
        } finally {
            setIsUploading(false);
        }
    }, [onImageUploaded]);

    // Handle drag enter event
    const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    // Handle drag leave event
    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    // Handle drag hover event
    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    // Handle drop event
    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;

        if (files && files.length > 0) {
            handleFileUpload(files[0]);
        }
    }, [handleFileUpload]);

    // Handle file selection event
    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (file) {
            handleFileUpload(file);
        }
    }, [handleFileUpload]);

    // Handle URL input change
    const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setImageUrl(e.target.value);
        // Notify parent component when user enters URL
        onImageUploaded(e.target.value);
    }, [onImageUploaded]);

    // remove current image
    const handleRemoveImage = useCallback(() => {
        setImageUrl('');
        onImageUploaded('');
    }, [onImageUploaded]);

    return (
        <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Cover Image</label>

            {imageUrl ? (
                <div className="relative inline-block">
                    <Image
                        src={imageUrl}
                        alt="Cover Image"
                        width={320}
                        height={200}
                        className="h-40 w-64 object-cover rounded-md border border-gray-300"
                        unoptimized
                    />
                    <button
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 bg-gray-800 bg-opacity-50 text-white rounded-full p-1"
                        title="Remove Image"
                        type="button"
                    >
                        <X size={16} />
                    </button>
                </div>
            ) : null}

            <div
                className={`border-2 ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'} border-dashed rounded-md p-6 transition-colors`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <div className="text-center">
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-2">
                        <p className="text-sm text-gray-600">
                            {imageUrl ? 'Drag and drop new image here to replace' : 'Drag and drop image here to upload'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Supports JPEG, PNG, GIF, WebP, SVG (Max 5MB)
                        </p>
                        <button
                            onClick={() => document.getElementById('cover-image-input')?.click()}
                            className="mt-2 inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            type="button"
                            disabled={isUploading}
                        >
                            {isUploading ? (
                                <>
                                    <div className="w-4 h-4 mr-2 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload size={14} className="mr-1" />
                                    Select Image
                                </>
                            )}
                        </button>
                        <input
                            id="cover-image-input"
                            type="file"
                            className="hidden"
                            accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                            onChange={handleFileChange}
                            disabled={isUploading}
                        />
                    </div>
                </div>
            </div>

            {error && (
                <div className="text-red-500 text-sm mt-1">{error}</div>
            )}

            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">or</span>
                <div className="flex-1">
                    <input
                        type="text"
                        value={imageUrl}
                        onChange={handleUrlChange}
                        placeholder="Enter image URL..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>
        </div>
    );
} 