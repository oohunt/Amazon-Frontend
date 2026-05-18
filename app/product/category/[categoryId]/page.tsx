import type { Metadata } from 'next';

import { CategoryPageWrapper } from './ClientComponents';

// 服务器组件部分 - 用于生成元数据
export const generateMetadata = async ({ params }: { params: Promise<{ categoryId: string }> }): Promise<Metadata> => {
    // 先await params对象
    const paramsObj = await params;
    // 解码URL参数
    const categoryName = decodeURIComponent(paramsObj.categoryId);
    // 将分类名称首字母大写
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

// 导出默认页面组件
export default async function CategoryPage({ params }: { params: Promise<{ categoryId: string }> }) {
    // 先await params对象
    const paramsObj = await params;
    // 解码分类名称
    const categorySlug = decodeURIComponent(paramsObj.categoryId);

    // 使用客户端包装器组件，确保URL一致性
    return <CategoryPageWrapper categorySlug={categorySlug} />;
} 