"use client";

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface CountdownTimerProps {
    endTime: Date | string;
    onComplete?: () => void;
    className?: string;
}

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

export function CountdownTimer({ endTime, onComplete, className = '' }: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [isCompleted, setIsCompleted] = useState(false);

    useEffect(() => {
        // Ensure endTime is a Date object
        const targetDate = typeof endTime === 'string' ? new Date(endTime) : endTime;

        // Update countdown every second
        const interval = setInterval(() => {
            const now = new Date();
            const difference = targetDate.getTime() - now.getTime();

            if (difference <= 0) {
                clearInterval(interval);
                setIsCompleted(true);
                onComplete?.();

                return;
            }

            // Calculate remaining time
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            setTimeLeft({ days, hours, minutes, seconds });
        }, 1000);

        // Clear interval when component unmounts
        return () => clearInterval(interval);
    }, [endTime, onComplete]);

    // Number flip animation variant
    const numberVariants = {
        initial: { y: 0 },
        changed: {
            y: [0, -10, 0],
            transition: { duration: 0.3, ease: "easeInOut" }
        }
    };

    // Neon light pulse animation variant
    const pulseVariants = {
        pulse: {
            boxShadow: [
                "0 0 5px rgba(255, 107, 107, 0.7), 0 0 20px rgba(255, 107, 107, 0.5)",
                "0 0 10px rgba(255, 107, 107, 0.9), 0 0 30px rgba(255, 107, 107, 0.7)",
                "0 0 5px rgba(255, 107, 107, 0.7), 0 0 20px rgba(255, 107, 107, 0.5)",
            ],
            transition: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };

    if (isCompleted) {
        return (
            <div className={`text-center ${className}`}>
                <p className="text-primary font-bold">Event has ended!</p>
            </div>
        );
    }

    // Render countdown time block
    const TimeBlock = ({ value, label }: { value: number, label: string }) => (
        <motion.div
            className="flex flex-col items-center mx-1 sm:mx-2"
            variants={pulseVariants}
            animate="pulse"
        >
            <motion.div
                className="bg-gradient-primary rounded-lg w-12 h-14 sm:w-16 sm:h-20 flex items-center justify-center shadow-neon text-white font-bold text-xl sm:text-2xl"
                key={value}
                variants={numberVariants}
                initial="initial"
                animate="changed"
            >
                {value.toString().padStart(2, '0')}
            </motion.div>
            <span className="text-xs sm:text-sm mt-1 text-text-light">{label}</span>
        </motion.div>
    );

    return (
        <div className={`flex flex-col items-center ${className}`}>
            <motion.h3
                className="text-lg sm:text-xl font-bold mb-3 text-primary"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                Limited time offer, first come first served!
            </motion.h3>

            <div className="flex justify-center items-center">
                {timeLeft.days > 0 && (
                    <TimeBlock value={timeLeft.days} label="Days" />
                )}
                <TimeBlock value={timeLeft.hours} label="Hours" />
                <TimeBlock value={timeLeft.minutes} label="Minutes" />
                <TimeBlock value={timeLeft.seconds} label="Seconds" />
            </div>
        </div>
    );
} 