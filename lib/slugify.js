/**
 * lib/slugify.js
 * Converts a string to a URL-friendly slug.
 * e.g., "HTTPS Enforced" -> "https-enforced"
 * "robots.txt configuration" -> "robots-txt-configuration"
 */
export function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')       // Replace spaces and underscores with -
    .replace(/[^\w\-]+/g, '')      // Remove all non-word chars (except -)
    .replace(/\-\-+/g, '-')        // Replace multiple - with single -
    .replace(/^-+/, '')            // Trim - from start of text
    .replace(/-+$/, '');           // Trim - from end of text
}
