import type { Metadata } from 'next';

import { CategoryPageWrapper } from './ClientComponents';

// Server component — used to generate metadata
export const generateMetadata = async ({ params }: { params: Promise<{ categoryId: string }> }): Promise<Metadata> => {
    // Await params object first
    const paramsObj = await params;
    // Decode URL parameters
    const categoryName = decodeURIComponent(paramsObj.categoryId);
    // Capitalize first letter of category name
    const formattedCategory = categoryName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

    return {
        title: `${formattedCategory} - Best Products and Deals`,
        description: `Browse our curated selection of ${formattedCategory} products and get the best prices and exclusive deals.`,
        openGraph: {
            title: `${formattedCategory} - Best Products and Deals`,
            description: `Browse our curated selection of ${formattedCategory} products and get the best prices and exclusive deals.`,
        }
    };
};

// export default page component
export default async function CategoryPage({ params }: { params: Promise<{ categoryId: string }> }) {
    // Await params object first
    const paramsObj = await params;
    // Decode category name
    const categorySlug = decodeURIComponent(paramsObj.categoryId);

    // Use client wrapper component to ensure URL consistency
    return <CategoryPageWrapper categorySlug={categorySlug} />;
} 