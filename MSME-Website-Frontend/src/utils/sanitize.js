import DOMPurify from 'dompurify';

// Add hook to enforce rel="noopener noreferrer" on all anchor tags
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    const existingRel = node.getAttribute('rel') || '';
    const relTokens = existingRel.split(/\s+/).filter(Boolean);
    
    if (!relTokens.includes('noopener')) {
      relTokens.push('noopener');
    }
    if (!relTokens.includes('noreferrer')) {
      relTokens.push('noreferrer');
    }
    
    node.setAttribute('rel', relTokens.join(' '));
  }
});

/**
 * Sanitize HTML content to prevent XSS attacks.
 * Use this before rendering any HTML with dangerouslySetInnerHTML.
 * 
 * @param {string} html - The HTML string to sanitize
 * @returns {string} - Sanitized HTML string
 */
export function sanitizeHTML(html) {
  if (!html) return '';
  
  // DOMPurify configuration - allows safe HTML tags
  const config = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'b', 'i', 'em', 'u', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'span', 'div',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img', 'hr'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'src', 'alt', 'width', 'height'],
    ALLOW_DATA_ATTR: false,
  };
  
  const clean = DOMPurify.sanitize(html, config);
  return clean;
}

/**
 * Create sanitized HTML object for use with dangerouslySetInnerHTML
 * 
 * @param {string} html - The HTML string to sanitize
 * @returns {{ __html: string }} - Object for dangerouslySetInnerHTML
 */
export function createSafeHTML(html) {
  return { __html: sanitizeHTML(html) };
}

export default { sanitizeHTML, createSafeHTML };
