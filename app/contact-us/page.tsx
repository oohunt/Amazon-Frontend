'use client';

import { useState } from "react";
import { useForm } from "react-hook-form";
import { FaFacebook, FaInstagram, FaPinterest, FaTwitter, FaYoutube } from "react-icons/fa";

// Form data type
type ContactFormData = {
    name: string;
    email: string;
    subject: string;
    message: string;
};

export default function ContactPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<{
        type: 'success' | 'error' | null;
        message: string;
    }>({ type: null, message: '' });

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<ContactFormData>({
        defaultValues: {
            name: '',
            email: '',
            subject: '',
            message: ''
        }
    });

    const onSubmit = async (data: ContactFormData) => {
        setIsSubmitting(true);
        setSubmitStatus({ type: null, message: '' });

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (result.success) {
                setSubmitStatus({
                    type: 'success',
                    message: result.message || 'Your message has been sent successfully, we will reply to you as soon as possible!'
                });
                reset();
            } else {
                setSubmitStatus({
                    type: 'error',
                    message: result.message || 'Failed to submit the form'
                });
            }
        } catch {
            setSubmitStatus({
                type: 'error',
                message: 'An error occurred while submitting the form, please try again later'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const socialLinks = [
        {
            name: 'Facebook',
            icon: FaFacebook,
            url: '#',
            color: 'bg-blue-600'
        },
        {
            name: 'Instagram',
            icon: FaInstagram,
            url: '#',
            color: 'bg-[#C13584]' // Instagram brand color
        },
        {
            name: 'Pinterest',
            icon: FaPinterest,
            url: '#',
            color: 'bg-[#E60023]' // Pinterest brand color
        },
        {
            name: 'Twitter',
            icon: FaTwitter,
            url: '#',
            color: 'bg-[#1DA1F2]' // Twitter brand color
        },
        {
            name: 'YouTube',
            icon: FaYoutube,
            url: '#',
            color: 'bg-[#FF0000]' // YouTube brand color
        }
    ];

    const faqs = [
        {
            question: "How does Oohunt find the best deals?",
            answer: "Our technology continuously monitors prices across major retailers, identifying discounts and verifying them in real-time to ensure you get accurate information."
        },
        {
            question: "Is Oohunt free to use?",
            answer: "Yes, Oohunt is completely free for all users. We help you find the best deals without any subscription fees or hidden costs."
        },
        {
            question: "How often are deals updated?",
            answer: "Our system updates prices and deals in real-time, ensuring you always have access to the most current information available."
        },
        {
            question: "Can I suggest a product to be tracked?",
            answer: "Absolutely! Feel free to email us with product suggestions, and we&apos;ll consider adding them to our tracking system."
        }
    ];

    return (
        <>
            <h1 className="text-4xl font-bold mb-6">Contact Us</h1>
            <p className="text-gray-500 mb-8">Get in touch with the Oohunt team</p>

            <section className="mb-8">
                <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                    <h2 className="text-2xl font-semibold mb-6">Contact Information</h2>

                    <div className="mb-8">
                        <h3 className="text-xl font-semibold mb-4">Email Us</h3>
                        <p className="mb-2">
                            For any questions, suggestions, or feedback, please email us at:
                        </p>
                        <a
                            href="mailto:@oohunt.admincom"
                            className="text-xl text-blue-600 font-medium hover:underline"
                        >
                            admin@oohunt.com
                        </a>
                        <p className="mt-3 text-gray-600">
                            We typically respond to all inquiries within 2-3 business days.
                        </p>
                    </div>

                    <div className="border-t border-gray-200 pt-8">
                        <h3 className="text-xl font-semibold mb-4">Send Us A Message</h3>

                        {submitStatus.type && (
                            <div
                                className={`p-4 mb-4 rounded-md ${submitStatus.type === 'success'
                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                    : 'bg-red-50 text-red-700 border border-red-200'
                                    }`}
                            >
                                {submitStatus.message}
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div>
                                <label htmlFor="name" className="block text-gray-700 mb-2">
                                    Your name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    {...register('name', {
                                        required: "Name is required",
                                        minLength: {
                                            value: 2,
                                            message: "Name must be at least 2 characters"
                                        },
                                        maxLength: {
                                            value: 50,
                                            message: "Name cannot exceed 50 characters"
                                        }
                                    })}
                                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Please enter your name"
                                    disabled={isSubmitting}
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.name.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-gray-700 mb-2">
                                    Email address <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    {...register('email', {
                                        required: "Email address is required",
                                        pattern: {
                                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                            message: "Please enter a valid email address"
                                        }
                                    })}
                                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Please enter your email address"
                                    disabled={isSubmitting}
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.email.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="subject" className="block text-gray-700 mb-2">
                                    Subject <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="subject"
                                    {...register('subject', {
                                        required: "Subject is required",
                                        minLength: {
                                            value: 5,
                                            message: "Subject must be at least 5 characters"
                                        },
                                        maxLength: {
                                            value: 100,
                                            message: "Subject cannot exceed 100 characters"
                                        }
                                    })}
                                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.subject ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="What is this about?"
                                    disabled={isSubmitting}
                                />
                                {errors.subject && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.subject.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="message" className="block text-gray-700 mb-2">
                                    Message content <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="message"
                                    rows={5}
                                    {...register('message', {
                                        required: "Message content is required",
                                        minLength: {
                                            value: 20,
                                            message: "Message content must be at least 20 characters"
                                        }
                                    })}
                                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.message ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Please enter your message here..."
                                    disabled={isSubmitting}
                                />
                                {errors.message && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.message.message}
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`${isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                                    } text-white px-6 py-3 rounded-md transition-colors duration-300 flex items-center justify-center`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Sending...
                                    </>
                                ) : 'Send message'}
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            <section className="mb-8 bg-gray-100 rounded-lg p-8">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-semibold mb-4">Connect With Us</h2>
                    <p className="max-w-2xl mx-auto">
                        Follow us on social media to stay updated with the latest deals and promotions
                    </p>
                </div>

                <div className="flex flex-wrap justify-center gap-6 max-w-3xl mx-auto">
                    {socialLinks.map((social) => {
                        const IconComponent = social.icon;

                        return (
                            <a
                                key={social.name}
                                href={social.url}
                                className={`${social.color} text-white w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-300 hover:scale-110`}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Follow us on ${social.name}`}
                            >
                                <IconComponent size={20} />
                            </a>
                        );
                    })}
                </div>

                <div className="text-center mt-4 text-gray-600">
                    <p>Click on any of the icons above to visit our social media profiles</p>
                </div>
            </section>

            <section className="mb-8">
                <div className="bg-white rounded-lg shadow-md p-8">
                    <h2 className="text-2xl font-semibold mb-6">About Oohunt</h2>
                    <p className="mb-4">
                        Oohunt helps consumers make informed decisions while shopping online, saving both time and money.
                        We are committed to providing transparent, accurate price comparisons and deal information.
                    </p>
                    <p>
                        Our platform continuously tracks prices and promotions from major retailers, alerting you when products
                        you&apos;re interested in go on sale, ensuring you never miss the best deals available.
                    </p>
                </div>
            </section>

            <section className="mb-8 bg-gray-100 rounded-lg p-8">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
                    <p>
                        Find quick answers to common questions about Oohunt
                    </p>
                </div>

                <div>
                    {faqs.map((faq) => (
                        <div
                            key={faq.question}
                            className="bg-white rounded-lg shadow-md p-6 mb-4"
                        >
                            <h3 className="text-xl font-semibold mb-2">{faq.question}</h3>
                            <p className="text-gray-700">{faq.answer}</p>
                        </div>
                    ))}

                    <div className="text-center mt-6">
                        <p>
                            Still have questions? <a href="mailto:admin@oohunt.com" className="text-blue-600 hover:underline">Email us</a> and we&apos;ll get back to you within 2-3 business days.
                        </p>
                    </div>
                </div>
            </section>
        </>
    );
} 