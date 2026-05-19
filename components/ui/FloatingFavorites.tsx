"use client";

import { Heart } from "lucide-react";
import NextLink from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export function FloatingFavorites() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // show/hide button logic
            const scrollY = window.scrollY;

            setShow(scrollY > 200);
        };

        window.addEventListener("scroll", handleScroll);

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <NextLink href="/favorites" className="lg:hidden">
            <button
                className={cn(
                    "fixed bottom-8 left-8 z-50",
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
                <Heart className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
        </NextLink>
    );
} 