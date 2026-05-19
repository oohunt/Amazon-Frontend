import type { Metadata } from 'next';

// Reuse the CMS page settings component
import PageSettingsPage from '@/app/dashboard/cms/pages/settings/[pageId]/page';

export const metadata: Metadata = {
    title: 'Blog Post Settings - Oohunt Dashboard',
    description: 'Modify blog post settings and metadata'
};

export default PageSettingsPage; 