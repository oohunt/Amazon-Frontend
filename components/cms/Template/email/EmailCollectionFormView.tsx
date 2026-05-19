'use client';

import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { Mail, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

import { type EmailFormAttributes } from './EmailCollectionFormBlot';

export const EmailCollectionFormView: React.FC<NodeViewProps> = ({
    node,

}) => {
    // Get form configuration from node attributes
    const attrs = node.attrs as EmailFormAttributes;

    // Component status
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<{
        type: 'success' | 'error' | null;
        message: string;
    }>({ type: null, message: '' });
    const [acceptTerms, setAcceptTerms] = useState(false);

    // Email validation
    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        return emailRegex.test(email);
    };

    // Form submit handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Clear previous status
        setStatus({ type: null, message: '' });

        // Validate email format
        if (!validateEmail(email)) {
            setStatus({
                type: 'error',
                message: 'Please enter a valid email address',
            });

            return;
        }

        // Validate terms acceptance
        if (!acceptTerms) {
            setStatus({
                type: 'error',
                message: 'Please agree to the email subscription terms and privacy policy',
            });

            return;
        }

        setIsSubmitting(true);

        try {
            // Call API to submit email — use same endpoint as contact-us page
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: 'Newsletter Subscriber', // Default name
                    email,
                    subject: 'Newsletter Subscription',
                    message: `Email subscription from ${attrs.sourceType} form (ID: ${attrs.formId})`,
                    formSource: attrs.sourceType, // Add source field to differentiate
                    formId: attrs.formId,
                }),
            });

            const result = await response.json();

            if (result.success) {
                // SuccessHandle
                setStatus({
                    type: 'success',
                    message: result.message || 'Subscription successful!',
                });
                setEmail(''); // Clear input
            } else {
                // Error handling
                setStatus({
                    type: 'error',
                    message: result.message || 'Subscription failed, please try again later',
                });
            }
        } catch {
            // Catch network errors etc.
            setStatus({
                type: 'error',
                message: 'An error occurred, please try again later',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Deals style form — more compact without icons
    if (attrs.style === 'deals') {
        return (
            <NodeViewWrapper
                className="email-collection-form-wrapper mb-8"
                data-type="email-collection-form"
                data-form-id={attrs.formId}
                data-source-type={attrs.sourceType}
                data-style={attrs.style}
            >
                <div className="bg-[#2E71A6] rounded-lg shadow-md overflow-hidden">
                    <div className="px-6 py-7">
                        {/* Form title and description */}
                        <div className="mb-4 text-center">
                            <h2 className="text-xl font-bold !text-white mb-2">
                                {attrs.formTitle || 'Subscribe to Our Deals Newsletter'}
                            </h2>
                            <p className="text-white/90 max-w-md mx-auto">
                                {attrs.formDescription || "Get the latest deals first-hand, don't miss any money-saving opportunity"}
                            </p>
                        </div>

                        {/* Form content */}
                        <form onSubmit={handleSubmit} className="w-full mx-auto">
                            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={attrs.inputPlaceholder}
                                    className="w-full py-3 px-4 rounded-md text-gray-800
                                        focus:outline-none border-0 shadow-sm bg-white"
                                    disabled={isSubmitting}
                                />
                                <button
                                    type="submit"
                                    className="py-3 px-6 bg-[#4DB6AC] hover:bg-[#3EA99E] text-white font-semibold
                                    rounded-md transition-colors sm:min-w-[140px] flex-shrink-0"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Subscribing...' : attrs.submitButtonText}
                                </button>
                            </div>

                            {/* Terms agreement checkbox */}
                            <div>
                                <label className="flex items-start gap-2 text-sm text-white/90 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={acceptTerms}
                                        onChange={(e) => setAcceptTerms(e.target.checked)}
                                        className="mt-0.5 h-4 w-4 rounded"
                                    />
                                    <span>
                                        I agree to receive email communications from Oohunt as described in the <a href="/email-subscription-terms" className="text-[#4DB6AC] hover:underline" target="_blank" rel="noopener noreferrer">Email Subscription Terms</a> & <a href="/privacy-policy" className="text-[#4DB6AC] hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
                                    </span>
                                </label>
                            </div>

                            {/* Status message */}
                            {status.type === 'error' && (
                                <div className="mt-3 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-md text-red-300 text-sm">
                                    {status.message}
                                </div>
                            )}

                            {status.type === 'success' && (
                                <div className="mt-3 bg-green-500/10 border border-green-500/20 px-4 py-3 rounded-md 
                                text-green-300 text-sm flex items-center justify-center">
                                    <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0" />
                                    <span>{status.message}</span>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </NodeViewWrapper>
        );
    }

    // Blog-style form
    if (attrs.style === 'blog') {
        return (
            <NodeViewWrapper
                className="email-collection-form-wrapper mb-8"
                data-type="email-collection-form"
                data-form-id={attrs.formId}
                data-source-type={attrs.sourceType}
                data-style={attrs.style}
            >
                <div className="bg-gradient-to-r from-[#3282B7] to-[#1C567B] rounded-lg shadow-md overflow-hidden">
                    <div className="px-6 py-7 relative z-10">
                        {/* Form title */}
                        <div className="mb-5 text-center">
                            <h2 className="text-xl font-bold text-white flex items-center justify-center mb-2">
                                <Mail className="w-[30px] h-[30px] text-[#FFC107] mr-2.5" strokeWidth={1.5} />
                                <span className="text-[#FFFFFF]">{attrs.formTitle}</span>
                            </h2>
                            <p className="text-white/90 max-w-md mx-auto">
                                {attrs.formDescription}
                            </p>
                        </div>

                        {/* Form content */}
                        <form onSubmit={handleSubmit} className="w-full mx-auto">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-grow relative">
                                    <div className="absolute top-1/2 -translate-y-1/2 left-3 pointer-events-none">
                                        <Mail className="h-[20px] w-[20px] text-gray-500" strokeWidth={2} />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder={attrs.inputPlaceholder}
                                        className={`w-full pl-11 pr-4 py-3.5 rounded-md text-gray-800
                                        focus:outline-none border-0 focus:ring-2 focus:ring-[#FFC107]/30
                                        transition-all duration-200 shadow-sm bg-white`}
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="py-3.5 px-6 bg-[#16A085] hover:bg-[#117A65] text-white font-semibold
                                    rounded-md transition-all duration-200 hover:-translate-y-0.5
                                    flex items-center justify-center whitespace-nowrap min-w-[120px]"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Subscribing...' : attrs.submitButtonText}
                                </button>
                            </div>

                            {/* Terms agreement checkbox */}
                            <div className="mt-4">
                                <label className="flex items-start gap-2.5 text-sm text-white/90 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={acceptTerms}
                                        onChange={(e) => setAcceptTerms(e.target.checked)}
                                        className="mt-1 h-4 w-4 rounded"
                                    />
                                    <span>
                                        I agree to receive emails as per <a href="/email-subscription-terms" className="text-[#FFC107] hover:underline" target="_blank" rel="noopener noreferrer">Email Subscription Terms</a> and <a href="/privacy-policy" className="text-[#FFC107] hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
                                    </span>
                                </label>
                            </div>

                            {/* Status message */}
                            {status.type === 'error' && (
                                <div className="mt-4 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-md text-red-400 text-sm">
                                    {status.message}
                                </div>
                            )}

                            {status.type === 'success' && (
                                <div className="mt-4 bg-green-500/10 border border-green-500/20 px-4 py-3 rounded-md 
                                text-green-400 text-sm flex items-center justify-center">
                                    <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0" />
                                    <span>{status.message}</span>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </NodeViewWrapper>
        );
    }

    // Compact style form
    if (attrs.style === 'compact') {
        return (
            <NodeViewWrapper
                className="email-collection-form-wrapper mb-8"
                data-type="email-collection-form"
                data-form-id={attrs.formId}
                data-source-type={attrs.sourceType}
                data-style={attrs.style}
            >
                <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                    <div className="px-5 py-6">
                        {/* Form title */}
                        <div className="mb-4 text-center">
                            <h3 className="text-lg font-medium ">{attrs.formTitle}</h3>
                            <p className=" text-sm mt-1">{attrs.formDescription}</p>
                        </div>

                        {/* Form content */}
                        <form onSubmit={handleSubmit}>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-grow relative">
                                    <div className="absolute top-1/2 -translate-y-1/2 left-0 pl-3 pointer-events-none">
                                        <Mail className="h-[16px] w-[16px] text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder={attrs.inputPlaceholder}
                                        className={`w-full pl-10 pr-3 py-2 rounded-md border ${status.type === 'error'
                                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                            } shadow-sm transition-colors`}
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className={`py-2 px-4 ${isSubmitting
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                                        } text-white font-medium rounded-md transition-colors flex items-center justify-center whitespace-nowrap`}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Subscribing...' : attrs.submitButtonText}
                                </button>
                            </div>

                            {/* Terms agreement checkbox */}
                            <div className="mt-3">
                                <label className="flex items-start gap-2 text-sm text-gray-600 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={acceptTerms}
                                        onChange={(e) => setAcceptTerms(e.target.checked)}
                                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span>
                                        I agree to receive emails as per <a href="/email-subscription-terms" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Terms</a> and <a href="/privacy-policy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
                                    </span>
                                </label>
                            </div>

                            {/* Status message */}
                            {status.type === 'error' && (
                                <div className="mt-3 text-sm text-red-600">
                                    {status.message}
                                </div>
                            )}

                            {status.type === 'success' && (
                                <div className="mt-3 text-sm text-green-600 flex items-center">
                                    <CheckCircle2 className="w-4 h-4 mr-1.5 flex-shrink-0" />
                                    <span>{status.message}</span>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </NodeViewWrapper>
        );
    }

    // Default style — full version with gradient background
    return (
        <NodeViewWrapper
            className="email-collection-form-wrapper mb-8"
            data-type="email-collection-form"
            data-form-id={attrs.formId}
            data-source-type={attrs.sourceType}
            data-style={attrs.style || 'default'}
        >
            <div className="bg-gradient-to-br from-[#2E71A6] to-[#2A5885] rounded-lg shadow-lg overflow-hidden">
                <div className="px-6 py-8 relative z-10">
                    {/* Form title */}
                    <div className="mb-4 text-center">
                        <div className="flex justify-center mb-2">
                            <h3 className="text-xl font-bold  !text-white">{attrs.formTitle}</h3>
                        </div>
                        <p className="text-white/90 max-w-md mx-auto">
                            {attrs.formDescription}
                        </p>
                    </div>

                    {/* Form content */}
                    <form onSubmit={handleSubmit} className="w-full mx-auto">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-grow relative">
                                <div className="absolute top-1/2 -translate-y-1/2 left-0 pl-3 pointer-events-none">
                                    <Mail className="h-[20px] w-[20px] text-gray-500 flex-shrink-0 translate-y-[1px]" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={attrs.inputPlaceholder}
                                    className={`w-full pl-11 pr-4 py-3 rounded-lg bg-white text-gray-800 
                                    focus:outline-none focus:ring-2 border border-transparent
                                    ${status.type === 'error'
                                            ? 'focus:ring-red-400 border-red-400/50'
                                            : 'focus:ring-[#FFC107] focus:border-[#FFC107]/30'
                                        } transition-all duration-200 shadow-sm`}
                                    disabled={isSubmitting}
                                />
                            </div>
                            <button
                                type="submit"
                                className={`py-3 px-6 ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#16A085] hover:bg-[#117A65] cursor-pointer'} text-white font-medium
                                rounded-lg transition-all duration-200 shadow-sm hover:shadow
                                flex items-center justify-center whitespace-nowrap`}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Subscribing...' : attrs.submitButtonText}
                            </button>
                        </div>

                        {/* Terms agreement checkbox */}
                        <div className="mt-3 mx-auto">
                            <label className="flex items-start gap-2 text-sm text-white/80 cursor-pointer text-left">
                                <input
                                    type="checkbox"
                                    checked={acceptTerms}
                                    onChange={(e) => setAcceptTerms(e.target.checked)}
                                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#4DB6AC] focus:ring-[#4DB6AC]"
                                />
                                <span>
                                    I agree to receive emails as per <a href="/email-subscription-terms" className="text-[#4DB6AC] hover:underline" target="_blank" rel="noopener noreferrer">Terms</a> and <a href="/privacy-policy" className="text-[#4DB6AC] hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
                                </span>
                            </label>
                        </div>

                        {/* Status message */}
                        {status.type === 'error' && (
                            <div className="mt-4 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-lg text-red-400 text-sm">
                                {status.message}
                            </div>
                        )}

                        {status.type === 'success' && (
                            <div className="mt-4 bg-green-500/10 border border-green-500/20 px-4 py-3 rounded-lg 
                            text-green-400 text-sm flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0" />
                                <span>{status.message}</span>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </NodeViewWrapper>
    );
}; 