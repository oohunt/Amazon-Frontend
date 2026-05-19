import Link from 'next/link';
import React from 'react';

interface EmptyStateProps {
    title: string;
    description: string;
    actionText?: string;
    actionLink?: string;
    icon?: React.ReactNode;
}

/**
 * Empty state component
 * Display a prompt when a list or data is empty
 */
const EmptyState: React.FC<EmptyStateProps> = ({
    title,
    description,
    actionText,
    actionLink,
    icon,
}) => {
    return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            {/* Icon */}
            {icon || (
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                    <svg
                        className="h-8 w-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                    </svg>
                </div>
            )}

            {/* Title */}
            <h3 className="mb-2 text-lg font-medium text-gray-900">{title}</h3>

            {/* Description */}
            <p className="mb-6 max-w-md text-gray-500">{description}</p>

            {/* Action buttons */}
            {actionText && actionLink && (
                <Link
                    href={actionLink}
                    className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    {actionText}
                </Link>
            )}
        </div>
    );
};

export default EmptyState; 