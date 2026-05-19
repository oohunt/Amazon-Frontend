"use client";

import { ArrowUpIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export function BackTop() {
    const [show, setShow] = useState(false);
    const [scrolling, setScrolling] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [scrollTimeout, setScrollTimeout] = useState<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        const handleScroll = () => {
            // show/hide button logic
            const scrollY = window.scrollY;

            setShow(scrollY > 200);

            // Calculate scroll progress
            const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = Math.round((scrollY / windowHeight) * 100);

            setScrollProgress(progress);

            // Set scroll status
            setScrolling(true);

            // Clear previous timer
            if (scrollTimeout) {
                clearTimeout(scrollTimeout);
            }

            // Set new timer
            const timeout = setTimeout(() => {
                setScrolling(false);
            }, 150);

            setScrollTimeout(timeout);
        };

        window.addEventListener("scroll", handleScroll);

        return () => window.removeEventListener("scroll", handleScroll);
    }, [scrollTimeout]);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    return (
        <button
            onClick={scrollToTop}
            className={cn(
                "fixed bottom-8 right-8 z-50",
                "w-12 h-12 rounded-full",
                "bg-white/80 backdrop-blur-sm dark:bg-gray-800/80",
                "shadow-lg border border-gray-200 dark:border-gray-700",
                "flex items-center justify-center",
                "transition-all duration-300 ease-in-out",
                "hover:bg-gray-100 dark:hover:bg-gray-700",
                "focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600",
                show ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0"
            )}
        >
            {scrolling ? (
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {scrollProgress}%
                </span>
            ) : (
                <ArrowUpIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            )}
        </button>
    );
} 