'use client';

import { Button, Link } from '@heroui/react';
import Image from 'next/image';
import type { ReactNode } from 'react';

import appIcon from '@/app/icon.png';
import { PlusIcon } from '@/components/board/icons';
import { useI18n } from '@/lib/i18n/provider';

interface BoardHeaderProps {
  children: ReactNode;
  onCreate: () => void;
  columnNavigation: ReactNode;
}

/** Composes named workspace navigation and creation; injected children own settings. */
export function BoardHeader({
  children,
  onCreate,
  columnNavigation,
}: BoardHeaderProps) {
  const { t } = useI18n();
  return (
    <header className="board-toolbar-wrap">
      <div className="board-toolbar">
        <div className="flex min-w-0 items-center gap-2.5">
          <Image
            alt=""
            className="board-mark"
            priority
            sizes="32px"
            src={appIcon}
          />
          <h1 className="text-xl font-semibold tracking-tight">
            {t('board.title')}
          </h1>
        </div>
        <Button className="board-create min-h-11" onPress={onCreate}>
          <PlusIcon className="size-4" />
          {t('task.new')}
        </Button>
        <nav className="board-actions" aria-label={t('board.home')}>
          <Link className="board-action-link" aria-current="page" href="/">
            {t('board.home')}
          </Link>
          <Link className="board-action-link" href="/statistics">
            {t('board.statistics')}
          </Link>
          <Link className="board-action-link" href="/connections">
            {t('board.connections')}
          </Link>
          {children}
        </nav>
        {columnNavigation}
      </div>
    </header>
  );
}
