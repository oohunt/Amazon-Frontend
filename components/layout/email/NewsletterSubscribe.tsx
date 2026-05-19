"use client";

import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

interface NewsletterSubscribeProps {
    compact?: boolean;
}

export function NewsletterSubscribe({ compact = false }: NewsletterSubscribeProps) {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [acceptTerms, setAcceptTerms] = useState(false);

    const validateEmail = (email: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        return regex.test(email);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Reset status
        setStatus('idle');
        setErrorMessage('');

        // Validate email
        if (!email) {
            setStatus('error');
            setErrorMessage('Please enter an email address');

            return;
        }

        if (!validateEmail(email)) {
            setStatus('error');
            setErrorMessage('Please enter a valid email address');

            return;
        }

        // Validate terms acceptance
        if (!acceptTerms) {
            setStatus('error');
            setErrorMessage('Please agree to the email subscription terms and privacy policy');

            return;
        }

        try {
            setStatus('loading');

            // Send to our API endpoint
            const response = await fetch('/api/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Subscription failed');
            }

            // SuccessHandle
            setStatus('success');
            setEmail(''); // Clear input
        } catch (error) {
            // Error handling
            setStatus('error');
            setErrorMessage(error instanceof Error ? error.message : 'Subscription failed, please try again later');
        }
    };

    // Compact version of component for product pages
    if (compact) {
        return (
            <div className="bg-transparent">
                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-grow relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Mail className="w-4 h-4 text-gray-500" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email address"
                                className={`w-full pl-9 pr-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white
                                focus:outline-none focus:ring-2 border border-gray-200 dark:border-gray-600
                                ${status === 'error'
                                        ? 'focus:ring-red-400 border-red-400/50'
                                        : 'focus:ring-[#1A5276] focus:border-[#1A5276]/30'
                                    } transition-all duration-200`}
                                aria-label="Email address"
                                disabled={status === 'loading'}
                            />
                        </div>
                        <button
                            type="submit"
                            className={`py-3 px-5 ${status === 'loading' ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#16A085] hover:bg-[#117A65] cursor-pointer'} text-white font-medium
                            rounded-lg transition-all duration-200 flex items-center justify-center whitespace-nowrap`}
                            disabled={status === 'loading'}
                        >
                            {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
                            {status !== 'loading' && <ArrowRight className="w-4 h-4 ml-2" />}
                        </button>
                    </div>

                    {/* Error message */}
                    {status === 'error' && (
                        <div className="mt-3 text-sm text-red-500 font-medium text-center">
                            {errorMessage}
                        </div>
                    )}

                    {/* Terms agreement checkbox */}
                    <div className="mt-3">
                        <label className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={acceptTerms}
                                onChange={(e) => setAcceptTerms(e.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#16A085] focus:ring-[#16A085]"
                            />
                            <span>
                                I agree to receive email communications from Oohunt as described in the <a href="/email-subscription-terms" className="text-[#16A085] hover:underline" target="_blank" rel="noopener noreferrer">Email Subscription Terms</a> and <a href="/privacy" className="text-[#16A085] hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
                            </span>
                        </label>
                    </div>

                    {/* Success message */}
                    {status === 'success' && (
                        <div className="mt-2 text-sm text-green-500 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span>Subscription successful! Thank you for subscribing.</span>
                        </div>
                    )}
                </form>
            </div>
        );
    }

    // Original full version, used for other pages
    return (
        <div className="bg-gradient-to-br from-[#1A5276] to-[#154360] rounded-xl shadow-lg overflow-hidden">
            {/* Inner content container with semi-transparent overlay */}
            <div className="relative">
                {/* Content container with proper padding */}
                <div className="px-8 py-10 relative z-10">
                    {/* Header section with title */}
                    <div className="mb-6 text-center">
                        <div className="inline-flex items-center justify-center mb-2">
                            <Mail className="w-7 h-7 text-[#F39C12] mr-3" strokeWidth={1.5} />
                            <h3 className="text-2xl font-bold text-white">Newsletter</h3>
                        </div>
                        <p className="text-lg font-medium text-white/90 max-w-md mx-auto">
                            Subscribe to Our Deals Newsletter
                        </p>
                    </div>

                    {/* Main description */}
                    <div className="mb-8 text-center">
                        <p className="text-white/80 max-w-lg mx-auto">
                            Get the latest deals first-hand, don&apos;t miss any money-saving opportunity
                        </p>
                    </div>

                    {/* Form section */}
                    <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-grow relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                    <Mail className="w-5 h-5 text-gray-500" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email address"
                                    className={`w-full pl-11 pr-4 py-3.5 rounded-lg bg-white/95 text-gray-800 
                                    focus:outline-none focus:ring-2 border border-transparent
                                    ${status === 'error'
                                            ? 'focus:ring-red-400 border-red-400/50'
                                            : 'focus:ring-[#F39C12] focus:border-[#F39C12]/30'
                                        } transition-all duration-200 shadow-sm`}
                                    aria-label="Email address"
                                    disabled={status === 'loading'}
                                />
                            </div>
                            <button
                                type="submit"
                                className={`py-3.5 px-8 ${status === 'loading' ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#16A085] hover:bg-[#117A65] cursor-pointer'} text-white font-medium
                                rounded-lg transition-all duration-200 shadow-sm hover:shadow
                                flex items-center justify-center whitespace-nowrap`}
                                disabled={status === 'loading'}
                            >
                                {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
                                {status !== 'loading' && <ArrowRight className="w-4 h-4 ml-2" />}
                            </button>
                        </div>

                        {/* Error message */}
                        {status === 'error' && (
                            <div className="mt-4 mb-2 text-sm text-red-500 px-4 py-2 rounded-md mx-auto max-w-md font-medium text-center">
                                {errorMessage}
                            </div>
                        )}

                        {/* Terms agreement checkbox */}
                        <div className="mt-4 mx-auto text-center">
                            <label className="flex items-start gap-2 text-sm text-white/80 cursor-pointer text-left mx-auto max-w-ld">
                                <input
                                    type="checkbox"
                                    checked={acceptTerms}
                                    onChange={(e) => setAcceptTerms(e.target.checked)}
                                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#F39C12] focus:ring-[#F39C12]"
                                />
                                <span>
                                    I agree to receive email communications from Oohunt as described in the <a href="/legal/email-subscription-terms" className="text-[#F39C12] hover:underline" target="_blank" rel="noopener noreferrer">Email Subscription Terms</a> and <a href="/legal/privacy" className="text-[#F39C12] hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
                                </span>
                            </label>
                        </div>
                    </form>

                    {/* Success message */}
                    {status === 'success' && (
                        <div className="mt-6 bg-green-500/10 border border-green-500/20 px-4 py-3 rounded-lg 
                        text-green-400 text-sm flex items-center justify-center max-w-lg mx-auto">
                            <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0" />
                            <span>Subscription successful! Thank you for subscribing.</span>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
} 