import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

/** Renders the compact workflow-board product mark. */
export function BoardIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <rect x="3" y="3.5" width="4" height="13" rx="1.4" fill="currentColor" />
      <rect
        x="8.5"
        y="3.5"
        width="3.5"
        height="8"
        rx="1.3"
        fill="currentColor"
        opacity="0.72"
      />
      <rect
        x="13.5"
        y="3.5"
        width="3.5"
        height="10.5"
        rx="1.3"
        fill="currentColor"
        opacity="0.44"
      />
    </svg>
  );
}

/** Renders a compact plus icon. */
export function PlusIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path
        d="M10 4v12M4 10h12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Renders a compact settings sliders icon. */
export function SettingsIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 5h12M4 10h12M4 15h12M7 3v4m6 1v4m-4 1v4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Renders a compact edit icon. */
export function EditIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path
        d="m12.8 4.2 3 3L7 16H4v-3l8.8-8.8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Renders a compact drag handle icon. */
export function GripIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" {...props}>
      <circle cx="7" cy="5" r="1.2" />
      <circle cx="13" cy="5" r="1.2" />
      <circle cx="7" cy="10" r="1.2" />
      <circle cx="13" cy="10" r="1.2" />
      <circle cx="7" cy="15" r="1.2" />
      <circle cx="13" cy="15" r="1.2" />
    </svg>
  );
}

/** Renders a compact chevron icon. */
export function ChevronIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path
        d="m7 5 5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Renders a compact calendar icon. */
export function CalendarIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <rect
        x="3.5"
        y="5"
        width="13"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M6.5 3.5v3m7-3v3M4 8.5h12"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
