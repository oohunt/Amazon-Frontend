"use client";

import { useEffect, useState, Fragment } from 'react';

import { ScriptLocation } from '@/lib/models/CustomScript';

// Custom script interface
interface CustomScript {
    _id: string;
    name: string;
    content: string;
    location: ScriptLocation;
    enabled: boolean;
    createdAt?: string;
    updatedAt?: string;
}

// Script loader for server and client
export function HeadScripts() {
    return <ClientScriptsLoader location={ScriptLocation.HEAD} />;
}

export function BodyStartScripts() {
    return <ClientScriptsLoader location={ScriptLocation.BODY_START} />;
}

export function BodyEndScripts() {
    return <ClientScriptsLoader location={ScriptLocation.BODY_END} />;
}

// Pure client-side script loader — note: does not return div element
function ClientScriptsLoader({ location }: { location: ScriptLocation }) {
    // Use state to store script content instead of referencing DOM
    const [isLoaded, setIsLoaded] = useState(false);
    const [scriptElements, setScriptElements] = useState<React.ReactNode[]>([]);

    useEffect(() => {
        // Prevent duplicate loading
        if (isLoaded) return;

        // Get and inject scripts
        const loadScripts = async () => {
            try {
                // Ensure deduplication script is loaded only once
                if (location === ScriptLocation.HEAD) {
                    // Only inject deduplication helper script in HeadScripts
                    injectDeduplicatorScript();
                }

                // Get all scripts for this position
                const scripts = await fetchScripts(location);

                if (scripts && scripts.length > 0) {
                    // Prepare script element without actually inserting into DOM
                    const elements = prepareScriptElements(scripts);

                    setScriptElements(elements);
                }

                setIsLoaded(true);
            } catch {
                setIsLoaded(true); // Mark as loaded even on error to prevent infinite Retry
            }
        };

        loadScripts();
    }, [location, isLoaded]);

    // return Fragment instead of div to avoid inserting div into head
    return <>{scriptElements}</>;
}

// Get script data
async function fetchScripts(location: ScriptLocation): Promise<CustomScript[]> {
    const response = await fetch(`/api/settings/custom-scripts?location=${location}`, {
        cache: 'no-store',
        next: { revalidate: 0 },
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch scripts: ${response.statusText}`);
    }

    const data = await response.json();

    return data.items || [];
}

// Inject deduplication helper script
function injectDeduplicatorScript() {
    // Avoid duplicate injection
    if (typeof window !== 'undefined' && !window.__CUSTOM_SCRIPTS_DEDUPLICATOR_INJECTED__) {
        window.__CUSTOM_SCRIPTS_DEDUPLICATOR_INJECTED__ = true;

        const deduplicatorCode = `
      (function() {
        if (window.__CUSTOM_SCRIPTS_DEDUPLICATOR_RUNNING__) return;
        window.__CUSTOM_SCRIPTS_DEDUPLICATOR_RUNNING__ = true;
        
        // Record processed script IDs
        var processedScripts = {};
        
        // Deduplication function
        function deduplicateScripts() {
          document.querySelectorAll('script[data-custom-script]').forEach(function(script) {
            var id = script.id;
            if (id && processedScripts[id]) {
              if (script.parentNode) {
                script.parentNode.removeChild(script);
              }
            } else if (id) {
              processedScripts[id] = true;
            }
          });
        }
        
        // Execute deduplication once immediately
        deduplicateScripts();
        
        // Listen for DOM changes
        var observer = new MutationObserver(function(mutations) {
          var needsDedupe = false;
          mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
              mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1 && 
                    node.tagName === 'SCRIPT' && 
                    node.hasAttribute('data-custom-script')) {
                  needsDedupe = true;
                }
              });
            }
          });
          
          if (needsDedupe) {
            deduplicateScripts();
          }
        });
        
        // Listen to the entire document
        observer.observe(document, { childList: true, subtree: true });
      })();
    `;

        // Create and add script directly on client side
        const scriptEl = document.createElement('script');

        scriptEl.id = 'script-deduplicator';
        scriptEl.textContent = deduplicatorCode;
        document.head.appendChild(scriptEl);
    }
}

// create script element without immediately inserting into DOM
function prepareScriptElements(scripts: CustomScript[]): React.ReactNode[] {
    return scripts.map(script => {
        const scriptId = `custom-script-${script._id}`;
        const content = script.content || '';

        // Check if it is a src script
        const srcMatch = content.match(/src=["']([^"']*)["']/);
        const isSrcScript = srcMatch && srcMatch[1];

        if (content.trim().startsWith('<script') && content.trim().endsWith('</script>')) {
            // Extract content inside script tag
            const scriptContent = extractScriptContent(content);

            if (isSrcScript) {
                // External script, using nonce for security
                const nonce = generateRandomId();
                const scriptSrc = srcMatch ? srcMatch[1] : '';

                return (
                    <script
                        key={scriptId}
                        id={scriptId}
                        src={scriptSrc}
                        data-custom-script="true"
                        data-location={script.location}
                        nonce={nonce}
                        defer={true}
                    />
                );
            } else {
                // Inline scripts
                return (
                    <script
                        key={scriptId}
                        id={scriptId}
                        dangerouslySetInnerHTML={{ __html: scriptContent }}
                        data-custom-script="true"
                        data-location={script.location}
                    />
                );
            }
        } else {
            // Pure content script
            return (
                <script
                    key={scriptId}
                    id={scriptId}
                    dangerouslySetInnerHTML={{ __html: content }}
                    data-custom-script="true"
                    data-location={script.location}
                />
            );
        }
    });
}

// Extract script content
function extractScriptContent(scriptTag: string): string {
    if (scriptTag.trim().startsWith('<script') && scriptTag.trim().endsWith('</script>')) {
        const openTagEnd = scriptTag.indexOf('>');
        const closeTagStart = scriptTag.lastIndexOf('<');

        if (openTagEnd !== -1 && closeTagStart !== -1) {
            return scriptTag.substring(openTagEnd + 1, closeTagStart);
        }
    }

    return scriptTag;
}

// Generate random ID
function generateRandomId(): string {
    return Math.random().toString(36).substring(2, 9);
}

// Extend Window interface to support global variables we added
declare global {
    interface Window {
        __CUSTOM_SCRIPTS_DEDUPLICATOR_INJECTED__?: boolean;
        __CUSTOM_SCRIPTS_DEDUPLICATOR_RUNNING__?: boolean;
    }
}
