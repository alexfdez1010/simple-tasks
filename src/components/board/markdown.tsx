'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownProps {
  children: string;
  isPreview?: boolean;
}

/**
 * Safely renders user Markdown without HTML or images.
 *
 * @param children - Markdown source text.
 * @param isPreview - Whether the content belongs to the editor preview.
 * @returns Sanitised, styled Markdown markup.
 */
export function Markdown({ children, isPreview = false }: MarkdownProps) {
  if (!children.trim()) {
    return isPreview ? (
      <p className="text-sm text-muted">The preview will appear here.</p>
    ) : null;
  }

  return (
    <div className="task-markdown">
      <ReactMarkdown
        disallowedElements={['img']}
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          a: ({ children: linkChildren, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer">
              {linkChildren}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
