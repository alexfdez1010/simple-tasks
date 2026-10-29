import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { AppProviders } from '@/app/providers';
import { getCurrentLanguage } from '@/lib/i18n/server';
import { translate } from '@/lib/i18n/translations';

import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

/** Builds localized document metadata from the persisted language preference. */
export async function generateMetadata(): Promise<Metadata> {
  const language = await getCurrentLanguage();
  return {
    title: translate(language, 'app.title'),
    applicationName: 'Simple Tasks',
    appleWebApp: {
      capable: true,
      title: 'Simple Tasks',
      statusBarStyle: 'default',
    },
    icons: {
      apple: [
        {
          url: '/icons/apple-touch-icon.png',
          sizes: '180x180',
          type: 'image/png',
        },
      ],
    },
    description: translate(language, 'app.description'),
  };
}

export const viewport: Viewport = {
  themeColor: [
    { color: '#f5f6f5', media: '(prefers-color-scheme: light)' },
    { color: '#151a17', media: '(prefers-color-scheme: dark)' },
  ],
  viewportFit: 'cover',
};

/**
 * Renders the application document with the request's persisted language.
 *
 * @param props - The route subtree rendered inside the document shell.
 * @returns The localized HTML document and shared application providers.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.JSX.Element> {
  const language = await getCurrentLanguage();

  return (
    <html lang={language}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppProviders language={language}>{children}</AppProviders>
      </body>
    </html>
  );
}
