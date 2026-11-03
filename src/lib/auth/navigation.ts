/** Accepts only same-origin relative return paths, excluding login loops. */
export function safeReturnPath(value: string | null): string {
  if (
    !value ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    /[\u0000-\u0020\u007f]/.test(value) ||
    value.startsWith('/login')
  )
    return '/';
  return value;
}
