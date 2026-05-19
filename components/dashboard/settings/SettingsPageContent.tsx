"use client";

import { Tabs, Tab } from '@heroui/react';
import { Facebook, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react';
import { useState, useEffect } from 'react';

import { useSocialLinks } from '@/lib/hooks';
import { showErrorToast, showSuccessToast } from '@/lib/toast';
import type { SocialLinks } from '@/types/api';

import { CustomScriptsManager } from './CustomScriptsManager';

export function SettingsPageContent() {
    const { data: socialLinks, isLoading, mutate } = useSocialLinks();
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState<SocialLinks>({
        twitter: '',
        facebook: '',
        instagram: '',
        pinterest: '',
        youtube: '',
        linkedin: '',
    });
    const [activeTab, setActiveTab] = useState('social');

    // Update form when data is fetched
    useEffect(() => {
        if (socialLinks) {
            setFormData(socialLinks);
        }
    }, [socialLinks]);

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // save settings
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setIsSaving(true);

            const response = await fetch('/api/settings/social-links', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Update failed');
            }

            await mutate();
            showSuccessToast({
                title: 'Update successful',
                description: 'Social links updated',
            });
        } catch (error) {
            showErrorToast({
                title: 'Update failed',
                description: error instanceof Error ? error.message : 'Please try again later',
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading && activeTab === 'social') {
        return (
            <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-6" />
                <div className="space-y-4">
                    <div className="h-12 bg-gray-200 rounded" />
                    <div className="h-12 bg-gray-200 rounded" />
                    <div className="h-12 bg-gray-200 rounded" />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Settings</h1>

            <Tabs
                selectedKey={activeTab}
                onSelectionChange={(key) => setActiveTab(key as string)}
                aria-label="Site Settings"
                variant="bordered"
                classNames={{
                    panel: "pt-6"
                }}
            >
                <Tab key="social" title="Social Links">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-lg font-semibold mb-4">Social Links</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Twitter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Twitter URL
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Twitter className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="url"
                                            name="twitter"
                                            value={formData.twitter}
                                            onChange={handleInputChange}
                                            className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="https://twitter.com/youraccount"
                                        />
                                    </div>
                                </div>

                                {/* Facebook */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Facebook URL
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Facebook className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="url"
                                            name="facebook"
                                            value={formData.facebook}
                                            onChange={handleInputChange}
                                            className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="https://facebook.com/yourpage"
                                        />
                                    </div>
                                </div>

                                {/* Instagram */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Instagram URL
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Instagram className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="url"
                                            name="instagram"
                                            value={formData.instagram}
                                            onChange={handleInputChange}
                                            className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="https://instagram.com/youraccount"
                                        />
                                    </div>
                                </div>

                                {/* YouTube */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        YouTube URL
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Youtube className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="url"
                                            name="youtube"
                                            value={formData.youtube}
                                            onChange={handleInputChange}
                                            className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="https://youtube.com/yourchannel"
                                        />
                                    </div>
                                </div>

                                {/* LinkedIn */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        LinkedIn URL
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Linkedin className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="url"
                                            name="linkedin"
                                            value={formData.linkedin}
                                            onChange={handleInputChange}
                                            className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="https://linkedin.com/company/yourcompany"
                                        />
                                    </div>
                                </div>

                                {/* Pinterest */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Pinterest URL
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12Z" />
                                            </svg>
                                        </div>
                                        <input
                                            type="url"
                                            name="pinterest"
                                            value={formData.pinterest}
                                            onChange={handleInputChange}
                                            className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="https://pinterest.com/yourprofile"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end mt-6">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                >
                                    {isSaving ? 'Saving...' : 'Save Settings'}
                                </button>
                            </div>
                        </form>
                    </div>
                </Tab>
                <Tab key="scripts" title="Custom Scripts">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <CustomScriptsManager />
                    </div>
                </Tab>
            </Tabs>
        </div>
    );
}
