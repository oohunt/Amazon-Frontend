'use server';

import { revalidatePath } from 'next/cache';

// Import cmsApi from cms.ts to avoid conflicts
import { cmsApi } from '@/lib/api/cms';
import type { ContentPageUpdateRequest } from '@/types/cms';

// MongoDB ObjectId validation function
function isValidObjectId(id: string): boolean {
    // Check if it is a 24-character hexadecimal string
    return /^[0-9a-fA-F]{24}$/.test(id);
}

export async function updatePageSettingsAction(
    pageId: string,
    originalSlug: string | undefined,
    _previousState: unknown, // Parameter required by useActionState
    formData: FormData
): Promise<{ success: boolean; error?: string; newSlug?: string; debug?: string }> {

    // Validate pageId
    if (!pageId || pageId === 'undefined') {
        return { success: false, error: 'Invalid page ID', debug: `Invalid ID: ${pageId}` };
    }

    // Validate MongoDB ObjectId format
    if (!isValidObjectId(pageId)) {
        return {
            success: false,
            error: 'Invalid page ID format. Please verify the ID in the URL is correct',
            debug: `Invalid ObjectId format: ${pageId}`
        };
    }

    try {
        // First fetch existing page data to ensure content is preserved
        let existingPage;

        try {
            existingPage = await cmsApi.getPageById(pageId);
        } catch (fetchError) {
            throw new Error(`Failed to fetch page data: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
        }

        if (!existingPage?.data?.data) {
            throw new Error(`Unable to retrieve page data, API response format is incorrect`);
        }

        const data: ContentPageUpdateRequest = {
            title: formData.get('title') as string,
            slug: formData.get('slug') as string,
            status: formData.get('status') as 'draft' | 'published' | 'archived',
            excerpt: formData.get('excerpt') as string,
            featuredImage: formData.get('featuredImage') as string,
            categories: formData.getAll('categories') as string[],
            tags: formData.getAll('tags') as string[],
            // Preserve existing content
            content: existingPage.data?.data?.content || '',
            seoData: {
                metaTitle: formData.get('metaTitle') as string,
                metaDescription: formData.get('metaDescription') as string,
                canonicalUrl: formData.get('canonicalUrl') as string,
                ogImage: formData.get('ogImage') as string,
            },
        };

        // Simple validation (can add more complex validation logic here)
        if (!data.title || !data.slug || !data.status) {
            return { success: false, error: 'Title, path and status cannot be empty', debug: 'Form validation failed' };
        }

        // Call API to update page
        let response;

        try {
            response = await cmsApi.updatePage(pageId, data);
        } catch (updateError) {
            throw new Error(`API call failed: ${updateError instanceof Error ? updateError.message : String(updateError)}`);
        }

        if (!response?.data?.status) {
            const errMsg = response?.data?.message || 'Failed to update page';

            throw new Error(errMsg);
        }

        // Clear related caches
        // Note: revalidatePath can only be called in Server Action or Route Handler, which is correct here
        revalidatePath('/dashboard/cms/pages'); // List page
        revalidatePath(`/dashboard/cms/pages/settings/${pageId}`); // Current settings page
        revalidatePath(`/dashboard/blog/settings/${pageId}`); // Blog settings page
        if (originalSlug && originalSlug !== data.slug) {
            revalidatePath(`/${originalSlug}`); // Old public page path
        }
        revalidatePath(`/${data.slug}`); // New public page path

        return {
            success: true,
            newSlug: data.slug,
            debug: `Page updated successfully: ID=${pageId}, new slug=${data.slug}`
        };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';

        // Check if it's a network or server error
        const debugInfo = `Error details: ${errorMessage}`;

        // Check if it's a slug conflict error (requires backend API to support specific error messages)
        if (errorMessage.includes('slug') && (errorMessage.includes('unique') || errorMessage.includes('duplicate'))) {
            return {
                success: false,
                error: 'URL path is already taken, please choose another path',
                debug: debugInfo
            };
        }

        // Check if it's a 404 error
        if (errorMessage.includes('404') || errorMessage.includes('not found')) {
            return {
                success: false,
                error: `The specified page could not be found (ID: ${pageId}). It may have been deleted or the ID is invalid`,
                debug: debugInfo
            };
        }

        // Check if it's a URL error
        if (errorMessage.includes('Invalid URL') || errorMessage.includes('ERR_INVALID_URL')) {
            return {
                success: false,
                error: `API request URL is invalid. Please check the server configuration`,
                debug: `${debugInfo} - URL error may be caused by missing complete URL configuration on the server side`
            };
        }

        return {
            success: false,
            error: `Update failed: ${errorMessage}`,
            debug: debugInfo
        };
    }
} 