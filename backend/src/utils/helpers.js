/**
 * Helper utilities
 */

/**
 * Sanitize filename
 */
function sanitizeFilename(name) {
  return name
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 200)
    .trim() || 'video';
}

module.exports = { sanitizeFilename };

