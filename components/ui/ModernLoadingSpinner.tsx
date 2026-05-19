'use client';

import { motion } from 'framer-motion';
import React from 'react';

import { loadingVariants, skeletonVariants } from '@/lib/animations';

interface ModernLoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    variant?: 'spinner' | 'dots' | 'pulse';
    message?: string;
    className?: string;
}

interface SkeletonProps {
    variant?: 'text' | 'rect' | 'circle' | 'table';
    lines?: number;
    className?: string;
}

// Modern loading spinner
export const ModernLoadingSpinner: React.FC<ModernLoadingSpinnerProps> = ({
    size = 'md',
    variant = 'spinner',
    message,
    className = '',
}) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
    };

    // Rotation animation
    const spinnerVariant = (
        <motion.div
            className={`${sizeClasses[size]} border-2 border-gray-200 border-t-gray-600 rounded-full ${className}`}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
    );

    // Dot loading animation
    const dotsVariant = (
        <div className={`flex space-x-1 ${className}`}>
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    className={`${size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : 'w-3 h-3'} bg-gray-600 rounded-full`}
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.7, 1, 0.7],
                    }}
                    transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: 'easeInOut',
                    }}
                />
            ))}
        </div>
    );

    // Pulse animation
    const pulseVariant = (
        <motion.div
            className={`${sizeClasses[size]} bg-gray-600 rounded-full ${className}`}
            variants={loadingVariants}
            initial="initial"
            animate="animate"
        />
    );

    const renderSpinner = () => {
        switch (variant) {
            case 'dots':
                return dotsVariant;
            case 'pulse':
                return pulseVariant;
            default:
                return spinnerVariant;
        }
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-3">
            {renderSpinner()}
            {message && (
                <motion.p
                    className="text-sm text-gray-500 font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    {message}
                </motion.p>
            )}
        </div>
    );
};

// Skeleton screen component
export const ModernSkeleton: React.FC<SkeletonProps> = ({
    variant = 'text',
    lines = 1,
    className = '',
}) => {
    const baseClasses = 'bg-gray-200 rounded';

    if (variant === 'table') {
        return (
            <div className={`space-y-3 ${className}`}>
                {/* Table header skeleton */}
                <div className="flex space-x-4">
                    {[1, 2, 3, 4].map((i) => (
                        <motion.div
                            key={i}
                            className={`${baseClasses} h-4 flex-1`}
                            variants={skeletonVariants}
                            initial="initial"
                            animate="animate"
                        />
                    ))}
                </div>
                {/* Table row skeleton */}
                {['row-1', 'row-2', 'row-3', 'row-4', 'row-5'].map((rowKey, i) => (
                    <div key={rowKey} className="flex space-x-4">
                        {['col-1', 'col-2', 'col-3', 'col-4'].map((colKey, j) => (
                            <motion.div
                                key={`${rowKey}-${colKey}`}
                                className={`${baseClasses} h-10 flex-1`}
                                variants={skeletonVariants}
                                initial="initial"
                                animate="animate"
                                transition={{ delay: i * 0.1 + j * 0.05 }}
                            />
                        ))}
                    </div>
                ))}
            </div>
        );
    }

    if (variant === 'circle') {
        return (
            <motion.div
                className={`${baseClasses} w-10 h-10 rounded-full ${className}`}
                variants={skeletonVariants}
                initial="initial"
                animate="animate"
            />
        );
    }

    if (variant === 'rect') {
        return (
            <motion.div
                className={`${baseClasses} h-32 w-full ${className}`}
                variants={skeletonVariants}
                initial="initial"
                animate="animate"
            />
        );
    }

    // Text skeleton
    const textKeys = Array.from({ length: lines }, (_, ) => `text-${Date.now()}-${Math.random()}`);

    return (
        <div className={`space-y-2 ${className}`}>
            {textKeys.map((key, i) => (
                <motion.div
                    key={key}
                    className={`${baseClasses} h-4 ${i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}`}
                    variants={skeletonVariants}
                    initial="initial"
                    animate="animate"
                    transition={{ delay: i * 0.1 }}
                />
            ))}
        </div>
    );
};

// User table loading skeleton
export const UserTableSkeleton: React.FC = () => {
    const userRowKeys = ['user-1', 'user-2', 'user-3', 'user-4', 'user-5', 'user-6', 'user-7'];

    return (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {/* Table header */}
            <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex space-x-6">
                    <motion.div
                        className="bg-gray-200 rounded h-4 w-20"
                        variants={skeletonVariants}
                        initial="initial"
                        animate="animate"
                    />
                    <motion.div
                        className="bg-gray-200 rounded h-4 w-16"
                        variants={skeletonVariants}
                        initial="initial"
                        animate="animate"
                        transition={{ delay: 0.1 }}
                    />
                    <motion.div
                        className="bg-gray-200 rounded h-4 w-24"
                        variants={skeletonVariants}
                        initial="initial"
                        animate="animate"
                        transition={{ delay: 0.2 }}
                    />
                    <motion.div
                        className="bg-gray-200 rounded h-4 w-16"
                        variants={skeletonVariants}
                        initial="initial"
                        animate="animate"
                        transition={{ delay: 0.3 }}
                    />
                </div>
            </div>

            {/* Table row */}
            <div className="divide-y divide-gray-50">
                {userRowKeys.map((key, i) => (
                    <motion.div
                        key={key}
                        className="px-6 py-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.1 + 0.2 }}
                    >
                        <div className="flex items-center space-x-4">
                            {/* Avatar */}
                            <motion.div
                                className="bg-gray-200 rounded-full w-10 h-10"
                                variants={skeletonVariants}
                                initial="initial"
                                animate="animate"
                                transition={{ delay: i * 0.05 }}
                            />

                            {/* User info */}
                            <div className="flex-1 space-y-2">
                                <motion.div
                                    className="bg-gray-200 rounded h-4 w-32"
                                    variants={skeletonVariants}
                                    initial="initial"
                                    animate="animate"
                                    transition={{ delay: i * 0.05 + 0.1 }}
                                />
                                <motion.div
                                    className="bg-gray-200 rounded h-3 w-48"
                                    variants={skeletonVariants}
                                    initial="initial"
                                    animate="animate"
                                    transition={{ delay: i * 0.05 + 0.2 }}
                                />
                            </div>

                            {/* Role badge */}
                            <motion.div
                                className="bg-gray-200 rounded-full h-6 w-16"
                                variants={skeletonVariants}
                                initial="initial"
                                animate="animate"
                                transition={{ delay: i * 0.05 + 0.3 }}
                            />

                            {/* Status */}
                            <motion.div
                                className="bg-gray-200 rounded-full h-6 w-16"
                                variants={skeletonVariants}
                                initial="initial"
                                animate="animate"
                                transition={{ delay: i * 0.05 + 0.4 }}
                            />

                            {/* Action buttons */}
                            <div className="flex space-x-2">
                                <motion.div
                                    className="bg-gray-200 rounded h-8 w-16"
                                    variants={skeletonVariants}
                                    initial="initial"
                                    animate="animate"
                                    transition={{ delay: i * 0.05 + 0.5 }}
                                />
                                <motion.div
                                    className="bg-gray-200 rounded h-8 w-20"
                                    variants={skeletonVariants}
                                    initial="initial"
                                    animate="animate"
                                    transition={{ delay: i * 0.05 + 0.6 }}
                                />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

// User card loading skeleton (mobile)
export const UserCardSkeleton: React.FC = () => {
    const cardKeys = ['card-1', 'card-2', 'card-3', 'card-4', 'card-5'];

    return (
        <div className="space-y-4">
            {cardKeys.map((key, i) => (
                <motion.div
                    key={key}
                    className="bg-white rounded-xl border border-gray-100 p-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                >
                    <div className="flex items-center space-x-3 mb-3">
                        {/* Avatar */}
                        <motion.div
                            className="bg-gray-200 rounded-full w-10 h-10"
                            variants={skeletonVariants}
                            initial="initial"
                            animate="animate"
                            transition={{ delay: i * 0.05 }}
                        />

                        {/* User info */}
                        <div className="flex-1 space-y-2">
                            <motion.div
                                className="bg-gray-200 rounded h-4 w-24"
                                variants={skeletonVariants}
                                initial="initial"
                                animate="animate"
                                transition={{ delay: i * 0.05 + 0.1 }}
                            />
                            <motion.div
                                className="bg-gray-200 rounded h-3 w-36"
                                variants={skeletonVariants}
                                initial="initial"
                                animate="animate"
                                transition={{ delay: i * 0.05 + 0.2 }}
                            />
                        </div>

                        {/* Status badge */}
                        <motion.div
                            className="bg-gray-200 rounded-full h-6 w-16"
                            variants={skeletonVariants}
                            initial="initial"
                            animate="animate"
                            transition={{ delay: i * 0.05 + 0.3 }}
                        />
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        <motion.div
                            className="bg-gray-200 rounded h-3 w-full"
                            variants={skeletonVariants}
                            initial="initial"
                            animate="animate"
                            transition={{ delay: i * 0.05 + 0.4 }}
                        />
                        <motion.div
                            className="bg-gray-200 rounded h-3 w-full"
                            variants={skeletonVariants}
                            initial="initial"
                            animate="animate"
                            transition={{ delay: i * 0.05 + 0.5 }}
                        />
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                        <motion.div
                            className="bg-gray-200 rounded h-8 w-16"
                            variants={skeletonVariants}
                            initial="initial"
                            animate="animate"
                            transition={{ delay: i * 0.05 + 0.6 }}
                        />
                        <motion.div
                            className="bg-gray-200 rounded h-8 w-20"
                            variants={skeletonVariants}
                            initial="initial"
                            animate="animate"
                            transition={{ delay: i * 0.05 + 0.7 }}
                        />
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export default ModernLoadingSpinner; 