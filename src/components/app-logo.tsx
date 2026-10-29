import Image from 'next/image';
import appIcon from '@/app/icon.png';

/** Displays the original app artwork at the requested size; the surrounding brand supplies its name. */
export function AppLogo({ className = 'size-9' }: { className?: string }) {
  return (
    <Image
      src={appIcon}
      alt=""
      aria-hidden="true"
      className={className}
      sizes="40px"
      priority
    />
  );
}
