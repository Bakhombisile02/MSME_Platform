/**
 * Search Highlighting Utilities
 * 
 * Functions to highlight search terms in text content.
 * Uses DOMPurify for XSS protection when rendering highlighted HTML.
 */

import { sanitizeHTML } from './sanitize';

/**
 * Escape special regex characters in a string
 * @param {string} string - The string to escape
 * @returns {string} - Escaped string safe for use in RegExp
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Highlight search terms in text by wrapping them with <mark> tags
 * 
 * @param {string} text - The text to highlight
 * @param {string[]} searchTerms - Array of search terms to highlight
 * @param {Object} options - Configuration options
 * @param {string} options.className - CSS class for highlight (default: 'search-highlight')
 * @param {boolean} options.caseSensitive - Case sensitive matching (default: false)
 * @param {number} options.maxLength - Truncate text to this length, 0 for no truncation (default: 0)
 * @returns {string} - HTML string with highlighted terms (sanitized)
 * 
 * @example
 * highlightSearchTerms('Hello World', ['world']) 
 * // Returns: 'Hello <mark class="search-highlight">World</mark>'
 */
export function highlightSearchTerms(text, searchTerms = [], options = {}) {
  if (!text || typeof text !== 'string') return '';
  if (!searchTerms || searchTerms.length === 0) return sanitizeHTML(text);
  
  const {
    className = 'search-highlight',
    caseSensitive = false,
    maxLength = 0
  } = options;
  
  let processedText = text;
  
  // Truncate if needed
  if (maxLength > 0 && processedText.length > maxLength) {
    processedText = processedText.substring(0, maxLength) + '...';
  }
  
  // Build regex pattern for all search terms
  const escapedTerms = searchTerms
    .filter(term => term && term.trim())
    .map(term => escapeRegExp(term.trim()));
  
  if (escapedTerms.length === 0) return sanitizeHTML(processedText);
  
  const flags = caseSensitive ? 'g' : 'gi';
  const pattern = new RegExp(`(${escapedTerms.join('|')})`, flags);
  
  // Replace matches with highlighted version
  const highlighted = processedText.replace(pattern, `<mark class="${className}">$1</mark>`);
  
  // Sanitize to prevent XSS (DOMPurify allows <mark> by default)
  return sanitizeHTML(highlighted);
}

/**
 * Get a snippet of text around the first matching search term
 * Useful for showing relevant excerpts in search results
 * 
 * @param {string} text - The full text
 * @param {string[]} searchTerms - Search terms to find
 * @param {Object} options - Configuration options
 * @param {number} options.snippetLength - Length of snippet on each side (default: 100)
 * @param {string} options.ellipsis - String to use for truncation (default: '...')
 * @returns {string} - Highlighted snippet or truncated text if no match
 * 
 * @example
 * getSearchSnippet('A very long description about bakery services', ['bakery'], { snippetLength: 20 })
 * // Returns: '...ption about <mark class="search-highlight">bakery</mark> services'
 */
export function getSearchSnippet(text, searchTerms = [], options = {}) {
  if (!text || typeof text !== 'string') return '';
  
  const {
    snippetLength = 100,
    ellipsis = '...',
    className = 'search-highlight'
  } = options;
  
  if (!searchTerms || searchTerms.length === 0) {
    // No search terms - return truncated text
    if (text.length <= snippetLength * 2) return sanitizeHTML(text);
    return sanitizeHTML(text.substring(0, snippetLength * 2)) + ellipsis;
  }
  
  // Find first match position
  const lowerText = text.toLowerCase();
  let firstMatchIndex = -1;
  let matchedTerm = '';
  
  for (const term of searchTerms) {
    const index = lowerText.indexOf(term.toLowerCase());
    if (index !== -1 && (firstMatchIndex === -1 || index < firstMatchIndex)) {
      firstMatchIndex = index;
      matchedTerm = term;
    }
  }
  
  if (firstMatchIndex === -1) {
    // No match found - return truncated text
    if (text.length <= snippetLength * 2) return sanitizeHTML(text);
    return sanitizeHTML(text.substring(0, snippetLength * 2)) + ellipsis;
  }
  
  // Extract snippet around match
  const start = Math.max(0, firstMatchIndex - snippetLength);
  const end = Math.min(text.length, firstMatchIndex + matchedTerm.length + snippetLength);
  
  let snippet = text.substring(start, end);
  
  // Add ellipsis
  if (start > 0) snippet = ellipsis + snippet;
  if (end < text.length) snippet = snippet + ellipsis;
  
  // Highlight all terms in snippet
  return highlightSearchTerms(snippet, searchTerms, { className });
}

/**
 * Check if text contains any of the search terms
 * 
 * @param {string} text - Text to search
 * @param {string[]} searchTerms - Terms to find
 * @returns {boolean} - True if any term found
 */
export function hasSearchMatch(text, searchTerms = []) {
  if (!text || !searchTerms || searchTerms.length === 0) return false;
  
  const lowerText = text.toLowerCase();
  return searchTerms.some(term => 
    term && lowerText.includes(term.toLowerCase())
  );
}

/**
 * Find which fields in an object contain search matches
 * 
 * @param {Object} obj - Object with string fields to search
 * @param {string[]} searchTerms - Terms to find
 * @param {string[]} fieldsToSearch - Array of field names to check
 * @returns {string[]} - Array of field names that contain matches
 * 
 * @example
 * findMatchedFields(
 *   { name: 'Best Bakery', description: 'Fresh bread daily', town: 'Mbabane' },
 *   ['bakery'],
 *   ['name', 'description', 'town']
 * )
 * // Returns: ['name']
 */
export function findMatchedFields(obj, searchTerms = [], fieldsToSearch = []) {
  if (!obj || !searchTerms || searchTerms.length === 0) return [];
  
  return fieldsToSearch.filter(field => {
    const value = obj[field];
    return typeof value === 'string' && hasSearchMatch(value, searchTerms);
  });
}
