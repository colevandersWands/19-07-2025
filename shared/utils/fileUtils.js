/**
 * File utility functions for handling file operations
 */

/**
 * Read a file as text using FileReader API
 * @param {File} file - The file object to read
 * @returns {Promise<string>} Promise resolving to file content as text
 */
export const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

/**
 * Get file extension from filename
 * @param {string} filename - The filename to extract extension from
 * @returns {string} File extension with dot (e.g., '.js') or empty string if no extension
 */
export const getFileExtension = (filename) => {
  const parts = filename.split('.');
  return parts.length > 1 ? `.${parts.pop()}` : '';
};

/**
 * Get base name (filename without extension)
 * @param {string} filename - The filename to extract base name from
 * @returns {string} Base name without extension
 */
export const getFileBaseName = (filename) => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.slice(0, -1).join('.') : filename;
};