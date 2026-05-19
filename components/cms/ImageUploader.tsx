import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react';
import { ImageIcon, X } from 'lucide-react';
import Image from 'next/image';
import { useState, useCallback } from 'react';
interface ImageUploaderProps {
    isOpen: boolean;
    onClose: () => void;
    onImageUpload: (url: string) => void;
}

/**
 * Image upload component
 * For uploading images to R2 storage in the Tiptap editor
 */
export function ImageUploader({ isOpen, onClose, onImageUpload }: ImageUploaderProps) {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Handle file selection change
    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];

        if (!selectedFile) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

        if (!validTypes.includes(selectedFile.type)) {
            setError('Please select a valid image file (JPEG, PNG, GIF, WebP, SVG)');

            return;
        }

        // Validate file size (5MB)
        if (selectedFile.size > 5 * 1024 * 1024) {
            setError('Image size must be less than 5MB');

            return;
        }

        setFile(selectedFile);
        setError(null);

        // CreatePreview
        const reader = new FileReader();

        reader.onload = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
    }, []);

    // Handle image drop
    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFile = e.dataTransfer.files[0];

            // Use same validation logic as handleFileChange
            const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

            if (!validTypes.includes(droppedFile.type)) {
                setError('Please select a valid image file (JPEG, PNG, GIF, WebP, SVG)');

                return;
            }

            if (droppedFile.size > 5 * 1024 * 1024) {
                setError('Image size must be less than 5MB');

                return;
            }

            setFile(droppedFile);
            setError(null);

            const reader = new FileReader();

            reader.onload = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(droppedFile);
        }
    }, []);

    // Handle drag event
    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    // upload image to server
    const uploadImage = useCallback(async () => {
        if (!file) return;

        setUploading(true);
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

            // Call callback function with uploaded URL
            onImageUpload(data.url);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred during upload');
        } finally {
            setUploading(false);
        }
    }, [file, onImageUpload, onClose]);

    // reset form
    const resetForm = useCallback(() => {
        setFile(null);
        setPreview(null);
        setError(null);
    }, []);

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                resetForm();
                onClose();
            }}
        >
            <ModalContent>
                <ModalHeader>Upload Image</ModalHeader>
                <ModalBody>
                    {preview ? (
                        <div className="relative">
                            <Image
                                src={preview}
                                alt="Preview"
                                width={256}
                                height={256}
                                className="max-h-64 mx-auto rounded-md object-contain"
                            />
                            <button
                                onClick={resetForm}
                                className="absolute top-2 right-2 bg-gray-800 bg-opacity-50 text-white rounded-full p-1"
                                title="Remove Image"
                                type="button"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <div
                            className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-blue-500 transition-colors cursor-pointer"
                            onClick={() => document.getElementById('image-uploader-input')?.click()}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    document.getElementById('image-uploader-input')?.click();
                                }
                            }}
                        >
                            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="mt-2">
                                <p className="text-sm text-gray-600">Click or drag image here to upload</p>
                                <p className="text-xs text-gray-500 mt-1">Supports JPEG, PNG, GIF, WebP, SVG (Max 5MB)</p>
                            </div>
                            <input
                                id="image-uploader-input"
                                type="file"
                                className="hidden"
                                accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                                onChange={handleFileChange}
                            />
                        </div>
                    )}

                    {error && (
                        <div className="mt-2 text-red-500 text-sm">{error}</div>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button variant="light" onPress={onClose}>
                        Cancel
                    </Button>
                    <Button
                        color="primary"
                        onPress={uploadImage}
                        isDisabled={!file || uploading}
                        isLoading={uploading}
                    >
                        {uploading ? 'Uploading...' : 'Upload'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
} 