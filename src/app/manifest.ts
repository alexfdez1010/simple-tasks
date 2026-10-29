import type { MetadataRoute } from 'next';

/** Defines a stable install identity and original-brand icons for supported PWA launchers. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Simple Tasks',
    short_name: 'Tasks',
    description: 'A shared workspace for people, agents and connected work',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f5f6f5',
    theme_color: '#32654b',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
