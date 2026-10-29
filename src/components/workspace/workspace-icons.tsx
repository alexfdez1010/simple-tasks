import type { SVGProps } from 'react';

const paths = {
  more: 'M4 10h.01M10 10h.01M16 10h.01',
  edit: 'm12.8 4.2 3 3L7 16H4v-3l8.8-8.8Z',
  trash: 'M3.5 5.5h13M8 3h4l1 2.5M5.5 5.5l.8 11h7.4l.8-11M8.5 8.5v5M11.5 8.5v5',
  tasks:
    'M5 4h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm2 5 2 2 4-4M7 15h6',
  chart: 'M4 17V9m6 8V3m6 14v-6',
  connections:
    'm8 12 4-4M7 14l-1 1a3.5 3.5 0 0 1-5-5l4-4a3.5 3.5 0 0 1 5 0m0 8a3.5 3.5 0 0 0 5 0l4-4a3.5 3.5 0 0 0-5-5l-1 1',
  search: 'm14 14 4 4M15.5 8.5a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z',
  plus: 'M10 4v12M4 10h12',
  minus: 'M4 10h12',
  arrow: 'M4 10h12m-5-5 5 5-5 5',
  chevron: 'm8 5 5 5-5 5',
  refresh: 'M16 7a6.5 6.5 0 1 0 .2 6M16 3v4h-4',
  folder:
    'M3 5a2 2 0 0 1 2-2h3l2 3h5a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5Z',
  people:
    'M12 17v-2a4 4 0 0 0-8 0v2m12 0v-2a4 4 0 0 0-2-3.5M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3-2.5a3 3 0 0 1 0 5',
  check: 'm5 10 3.5 3.5L15 7',
  close: 'm5 5 10 10M5 15 15 5',
  fit: 'M7 3H3v4m10-4h4v4M3 13v4h4m10-4v4h-4',
} as const;

/** Renders a decorative 20px line icon; the parent control supplies its accessible name. */
export function WorkspaceIcon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: keyof typeof paths }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d={paths[name]}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
