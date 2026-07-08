'use client';
import { useEffect } from 'react';

export default function FetchInterceptor() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const originalFetch = window.fetch;
      window.fetch = async function(...args) {
        let [resource, config] = args;
        if (!config) config = {};
        
        // Remove manual Authorization header
        if (config.headers) {
          const newHeaders = new Headers(config.headers);
          newHeaders.delete('Authorization');
          
          if (!(config.headers instanceof Headers) && !Array.isArray(config.headers)) {
            const obj: Record<string, string> = {};
            newHeaders.forEach((value, key) => {
              obj[key] = value;
            });
            config.headers = obj;
          } else {
            config.headers = newHeaders;
          }
        }

        // Force include credentials for API calls
        if (typeof resource === 'string' && resource.startsWith('/api/')) {
          config.credentials = 'include';
        }
        
        return originalFetch(resource, config);
      };
    }
  }, []);
  return null;
}
