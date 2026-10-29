'use client';

import { Button } from '@heroui/react';
import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n/provider';

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

/** Offers installation only when the browser supplies a real install prompt; it never opens one automatically. */
export function PwaInstallButton({ className }: { className?: string }) {
  const { language } = useI18n();
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    /** Retains the browser event for a deliberate user action instead of interrupting work. */
    function available(event: Event) {
      event.preventDefault();
      if (!window.matchMedia('(display-mode: standalone)').matches)
        setPrompt(event as InstallPrompt);
    }
    /** Removes an obsolete invitation after installation from any browser entry point. */
    function installed() {
      setPrompt(null);
    }
    window.addEventListener('beforeinstallprompt', available);
    window.addEventListener('appinstalled', installed);
    return () => {
      window.removeEventListener('beforeinstallprompt', available);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);
  /** Consumes the browser's one-shot prompt without navigating or changing unsaved task state. */
  async function install() {
    if (!prompt || pending) return;
    setPending(true);
    setPrompt(null);
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch {
      return;
    } finally {
      setPending(false);
    }
  }
  if (!prompt) return null;
  return (
    <Button
      className={className}
      variant="ghost"
      isPending={pending}
      onPress={() => void install()}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M10 3v9m-3-3 3 3 3-3M4 13v4h12v-4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {language === 'es' ? 'Instalar aplicación' : 'Install app'}
    </Button>
  );
}
