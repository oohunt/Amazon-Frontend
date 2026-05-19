'use client';

import { Upload } from 'lucide-react';
import React, { useState, useCallback } from 'react';

interface SettingsImageUploaderProps {
    currentImageUrl: string;
    onImageUploaded: (url: string) => void;
    label?: string;
    id?: string;
}

/**
 * Settings page image upload component
 * Used for image uploads in CMS page settings
 */
export default function SettingsImageUploader({
    onImageUploaded,
    label = 'Image',
    id = 'settings-image-uploader'
}: SettingsImageUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Handle file upload
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

            // Notify parent component
            onImageUploaded(data.url);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred during upload');
        } finally {
            setIsUploading(false);
        }
    }, [onImageUploaded]);

    // Handle drag events
    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;

        if (files && files.length > 0) {
            handleFileUpload(files[0]);
        }
    }, [handleFileUpload]);

    // Handle file selection
    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;

        if (files && files.length > 0) {
            handleFileUpload(files[0]);
        }
    }, [handleFileUpload]);

    return (
        <div className="w-full">
            {isUploading ? (
                <div className="flex items-center justify-center border border-gray-300 rounded-md p-2">
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mr-2" />
                    <span className="text-sm text-gray-600">Uploading...</span>
                </div>
            ) : (

                <div
                    className={`border ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'} 
                                rounded-md p-2 hover:bg-gray-50 transition-colors cursor-pointer flex items-center`}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById(id)?.click()}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            document.getElementById(id)?.click();
                        }
                    }}
                >
                    <Upload size={16} className="text-gray-500 mr-2" />
                    <span className="text-sm text-gray-600 flex-grow">Upload {label}</span>
                    <input
                        id={id}
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                        onChange={handleFileChange}
                        disabled={isUploading}
                    />
                </div>
            )}

            {error && (
                <div className="text-red-500 text-sm mt-1">{error}</div>
            )}
        </div>
    );
} 