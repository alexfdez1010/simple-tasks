'use client';

import { Link } from '@heroui/react';
import type { ReactNode } from 'react';

/** Provides a focused HeroUI client boundary for links composed inside server-rendered pages. */
export function AppLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
