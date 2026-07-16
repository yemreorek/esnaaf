'use client';
import { useEffect } from 'react';

export default function FetchInterceptor() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const originalFetch = window.fetch;
      window.fetch = async function(...args) {
        let [resource, config] = args;
        if (!config) config = {};
        
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
