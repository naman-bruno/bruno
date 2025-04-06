/**
 * Utilities for detecting file formats
 */

/**
 * Detect the format of a file based on its content
 * @param {string} content - The file content
 * @returns {string} - The detected format ('bru' or 'yaml')
 */
const detectFormatFromContent = (content) => {
  if (!content || typeof content !== 'string') {
    return 'bru'; // Default to BRU if no content
  }
  
  // Clean the content by removing whitespace at the beginning
  const trimmedContent = content.trim();
  
  // Check for YAML indicators
  const isYaml = (
    // YAML starts with --- or a document indicator
    trimmedContent.startsWith('---') ||
    // Check for common YAML patterns like key: value
    /^[\w]+:(\s|$)/.test(trimmedContent) ||
    // Look for indented YAML structures
    /^[\w]+:\s*\n\s+[\w]+:/.test(trimmedContent)
  );
  
  return isYaml ? 'yaml' : 'bru';
};

/**
 * Detect format based on file extension
 * @param {string} filename - The filename
 * @returns {string} - The detected format ('bru' or 'yaml')
 */
const detectFormatFromFilename = (filename) => {
  if (!filename) {
    return 'bru'; // Default to BRU if no filename
  }
  
  const lowercaseName = filename.toLowerCase();
  
  if (lowercaseName.endsWith('.yml') || lowercaseName.endsWith('.yaml')) {
    return 'yaml';
  }
  
  return 'bru';
};

/**
 * Get the file extension for a given format
 * @param {string} format - The format ('bru' or 'yaml')
 * @returns {string} - The file extension including dot
 */
const getExtensionForFormat = (format) => {
  return format === 'yaml' ? '.yml' : '.bru';
};

/**
 * Get format from collection configuration
 * @param {Object} collectionConfig - Collection configuration object (bruno.json)
 * @returns {string} - The format ('bru' or 'yaml')
 */
const getFormatFromCollectionConfig = (collectionConfig) => {
  if (!collectionConfig) {
    return 'bru'; // Default to BRU
  }
  
  return collectionConfig.fileFormat === 'yaml' ? 'yaml' : 'bru';
};

module.exports = {
  detectFormatFromContent,
  detectFormatFromFilename,
  getExtensionForFormat,
  getFormatFromCollectionConfig
}; 