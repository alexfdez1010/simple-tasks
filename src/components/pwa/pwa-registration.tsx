'use client';

import { useEffect } from 'react';

/** Registers the public offline fallback after load; unsupported or insecure browsers retain the normal web app. */
export function PwaRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
    /** Registration failures leave network navigation unchanged and never reload an open task draft. */
    function register() {
      void navigator.serviceWorker
        .register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .catch(() => undefined);
    }
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
    return () => window.removeEventListener('load', register);
  }, []);
  return null;
}
