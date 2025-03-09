/**
 * Safely gets the first character of a string, with fallback
 * @param str The string to get the first character from
 * @param fallback Fallback character if string is undefined/null/empty
 * @returns The first character or fallback
 */
export function safeFirstChar(str: string | null | undefined, fallback: string = '?'): string {
  if (!str) return fallback;
  return str.length > 0 ? str.charAt(0) : fallback;
}

/**
 * Safely gets a string value with fallback
 * @param str The string to check
 * @param fallback Fallback string if input is undefined/null
 * @returns The string or fallback
 */
export function safeString(str: string | null | undefined, fallback: string = ''): string {
  return str || fallback;
} 