"use client";

import { motion } from 'framer-motion';

interface ErrorMessageProps {
    message: string;
    details?: string;
    onRetry?: () => void;
}

export default function ErrorMessage({
    message = "Error loading data",
    details,
    onRetry
}: ErrorMessageProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 px-4 text-center"
        >
            <div className="w-20 h-20 mb-6 text-red-500">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-2 text-red-500">{message}</h2>
            {details && (
                <p className="text-gray-500 max-w-md mb-6">{details}</p>
            )}
            {onRetry && (
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onRetry}
                    className="px-6 py-3 bg-primary text-white rounded-full shadow-md hover:shadow-lg transition-all"
                >
                    Retry
                </motion.button>
            )}
            <p className="mt-6 text-sm text-gray-400">
                If the problem persists, check your network connection or try again later
            </p>
        </motion.div>
    );
} 