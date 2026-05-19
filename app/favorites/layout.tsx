import type { Metadata } from 'next';
import type React from 'react';

// Define page metadata
export const metadata: Metadata = {
    title: 'My Favorites - Amazon Frontend',
    description: 'My Favorites Product List',
};

// Layout component for favorites page
export default function FavoritesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
} 