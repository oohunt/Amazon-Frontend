import { motion } from 'framer-motion';
import { Check, RefreshCw, X } from 'lucide-react';
import React from 'react';

type FeedbackType = 'success' | 'error' | 'loading';

interface FeedbackAnimationProps {
    type: FeedbackType;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    message?: string;
}

/**
 * Action feedback animation component
 * Dynamic feedback for displaying operation results
 */
const FeedbackAnimation: React.FC<FeedbackAnimationProps> = ({
    type,
    size = 'md',
    className = '',
    message,
}) => {
    // Determine styles based on size
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
    };

    // Determine icon and styles based on type
    const getIcon = () => {
        switch (type) {
            case 'success':
                return (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`rounded-full bg-green-100 p-2 text-green-600 ${className}`}
                    >
                        <Check className={sizeClasses[size]} />
                    </motion.div>
                );
            case 'error':
                return (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`rounded-full bg-red-100 p-2 text-red-600 ${className}`}
                    >
                        <X className={sizeClasses[size]} />
                    </motion.div>
                );
            case 'loading':
                return (
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className={`rounded-full bg-blue-100 p-2 text-blue-600 ${className}`}
                    >
                        <RefreshCw className={sizeClasses[size]} />
                    </motion.div>
                );
        }
    };

    return (
        <div className="flex items-center space-x-2">
            {getIcon()}
            {message && (
                <motion.p
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`text-sm ${type === 'success' ? 'text-green-600' :
                            type === 'error' ? 'text-red-600' : 'text-blue-600'
                        }`}
                >
                    {message}
                </motion.p>
            )}
        </div>
    );
};

export default FeedbackAnimation; 