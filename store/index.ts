import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Product {
    id: string;
    title: string;
    price: number;
    originalPrice: number;
    discount: number;
    image: string;
    category: string;
}

interface UserState {
    favorites: string[];
    addFavorite: (productId: string) => void;
    removeFavorite: (productId: string) => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

interface FilterState {
    category: string | null;
    priceRange: [number, number];
    sortBy: 'price' | 'discount' | 'newest';
    setCategory: (category: string | null) => void;
    setPriceRange: (range: [number, number]) => void;
    setSortBy: (sort: 'price' | 'discount' | 'newest') => void;
}

// User state
export const useUserStore = create(
    persist<UserState>(
        (set) => ({
            favorites: [],
            theme: 'light',
            addFavorite: (productId) =>
                set((state) => ({
                    favorites: [...state.favorites, productId],
                })),
            removeFavorite: (productId) =>
                set((state) => ({
                    favorites: state.favorites.filter((id) => id !== productId),
                })),
            toggleTheme: () =>
                set((state) => ({
                    theme: state.theme === 'light' ? 'dark' : 'light',
                })),
        }),
        {
            name: 'user-storage',
        }
    )
);

// Filter status
export const useFilterStore = create<FilterState>((set) => ({
    category: null,
    priceRange: [0, 10000],
    sortBy: 'newest',
    setCategory: (category) => set({ category }),
    setPriceRange: (range) => set({ priceRange: range }),
    setSortBy: (sortBy) => set({ sortBy }),
})); 