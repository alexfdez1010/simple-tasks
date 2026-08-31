import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

/** Renders the branching rule mark used for automation navigation. */
export function RuleIcon(props: IconProps): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M6 5v8.5A4.5 4.5 0 0 0 10.5 18H18M6 10h6a4 4 0 0 0 4-4V5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <circle cx="6" cy="5" r="2" fill="currentColor" />
      <circle cx="18" cy="18" r="2" fill="currentColor" />
      <circle cx="16" cy="5" r="2" fill="currentColor" />
    </svg>
  );
}

/** Renders a compact back arrow. */
export function BackIcon(props: IconProps): React.JSX.Element {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path
        d="m12.5 4.5-5 5.5 5 5.5M8 10h8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

/** Renders a compact edit pencil. */
export function EditRuleIcon(props: IconProps): React.JSX.Element {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path
        d="m12.7 4.1 3.2 3.2L7.2 16H4v-3.2l8.7-8.7Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

/** Renders a compact calendar with one marked date. */
export function ScheduledIcon(props: IconProps): React.JSX.Element {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <rect
        x="3.25"
        y="4.5"
        width="13.5"
        height="12"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path d="M3.5 8h13M6.5 3v3M13.5 3v3" stroke="currentColor" />
      <circle cx="10" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

/** Renders a small plus mark. */
export function AddRuleIcon(props: IconProps): React.JSX.Element {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path
        d="M10 4v12M4 10h12"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}
