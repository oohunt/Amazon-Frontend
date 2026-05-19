'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

export function Analytics() {
    // Load analytics script in production environment only
    const [isProduction, setIsProduction] = useState(false);

    useEffect(() => {
        // Check environment in client component
        setIsProduction(process.env.NODE_ENV === 'production');
    }, []);

    // Get analytics tool ID from environment variables
    const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    const MS_CLARITY_ID = process.env.NEXT_PUBLIC_MS_CLARITY_ID;

    // If not production or missing required IDs, don't show analytics
    if (!isProduction || !GA_MEASUREMENT_ID || !MS_CLARITY_ID) {
        return null;
    }

    return (
        <>
            {/* Google Analytics (gtag.js) */}
            <Script
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            />
            <Script
                id="google-analytics"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', '${GA_MEASUREMENT_ID}');
                    `,
                }}
            />

            {/* Microsoft Clarity */}
            <Script
                id="microsoft-clarity"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
                        (function(c,l,a,r,i,t,y){
                            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                        })(window, document, "clarity", "script", "${MS_CLARITY_ID}");
                    `,
                }}
            />
        </>
    );
} 