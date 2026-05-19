import React from 'react';

interface LoadingStateProps {
    message?: string;
    size?: 'sm' | 'md' | 'lg';
}

/**
 * Loading state component
 * Display a loading animation and an optional loading message
 */
const LoadingState: React.FC<LoadingStateProps> = ({
    message = 'Loading...',
    size = 'md',
}) => {
    // Determine styles based on size
    const sizeClasses = {
        sm: 'h-4 w-4 border-2',
        md: 'h-8 w-8 border-2',
        lg: 'h-12 w-12 border-3',
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
            {/* Loading animation */}
            <div className={`mb-4 animate-spin rounded-full border-t-transparent border-blue-500 ${sizeClasses[size]}`} />

            {/* Loading message */}
            {message && <p className="text-gray-600">{message}</p>}
        </div>
    );
};

export default LoadingState; 