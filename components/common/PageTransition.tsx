import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';

interface PageTransitionProps {
    children: React.ReactNode;
    show: boolean;
    duration?: number;
}

/**
 * Page transition component
 * Animation component for smooth transitions between states
 */
const PageTransition: React.FC<PageTransitionProps> = ({
    children,
    show,
    duration = 0.3,
}) => {
    return (
        <AnimatePresence mode="wait">
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration, ease: "easeInOut" }}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PageTransition; 