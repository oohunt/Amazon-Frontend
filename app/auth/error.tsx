'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

// Define error message mapping
const errorMessages: Record<string, string> = {
    Configuration: "Server configuration error, please contact the administrator",
    AccessDenied: "Access denied. You may not have sufficient permissions or an error occurred during sign in",
    Verification: "The sign-in link has expired or has already been used",
    CredentialsSignin: "Invalid username or password",
    Default: "An error occurred during authentication",

    // Special message for MongoDB connection errors
    DatabaseConnection: "Database connection error. In development you can still sign in",

    // Special message for Google sign-in errors
    GoogleOAuthError: "An error occurred during Google sign in, please try again later"
};

export default function ErrorPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [errorDesc, setErrorDesc] = useState<string>("");
    const [redirectCount, setRedirectCount] = useState(0);

    useEffect(() => {

        // Check redirect counter to prevent infinite loops
        const count = searchParams?.get("redirectCount");

        if (count) {
            setRedirectCount(parseInt(count, 10));
            // If too many redirects have occurred, automatically go to the homepage
            if (parseInt(count, 10) > 10) {
                router.push("/");

                return;
            }
        }

        // Get error information from the URL
        const errorType = searchParams?.get("error") || "Default";
        const errorDescParam = searchParams?.get("error_description");

        setError(errorType);

        if (errorDescParam) {
            setErrorDesc(decodeURIComponent(errorDescParam));
        } else {
            // Show the corresponding message based on error type
            setErrorDesc(errorMessages[errorType] || errorMessages.Default);

            // If AccessDenied error in development environment, add more details
            if (errorType === "AccessDenied" && process.env.NODE_ENV === "development") {
                setErrorDesc(prev => `${prev}\n\nIn development, this may be caused by a MongoDB connection failure. Please check your database configuration.`);
            }
        }
    }, [searchParams, router]);

    // Handle return to home button
    const handleReturnHome = () => {
        router.push("/");
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-red-600">
                        Authentication Error
                    </h2>
                    <p className="mt-2 text-center text-lg whitespace-pre-line">
                        {error ? errorDesc : "Loading..."}
                    </p>
                    {redirectCount > 0 && (
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Redirect count detected: {redirectCount}
                        </p>
                    )}
                </div>
                <div className="flex justify-center space-x-4">
                    <Link
                        href="/auth/signin"
                        className="rounded-md bg-indigo-600 py-2 px-4 text-sm font-semibold text-white hover:bg-indigo-500"
                    >
                        Back to Sign In
                    </Link>
                    <button
                        onClick={handleReturnHome}
                        className="rounded-md bg-gray-600 py-2 px-4 text-sm font-semibold text-white hover:bg-gray-500"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
} 