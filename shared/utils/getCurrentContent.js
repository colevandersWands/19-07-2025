/**
 * Utility function to get the current content of a resource
 * This ensures all lenses use the most recent edited version
 * 
 * @param {Object} resource - The resource object
 * @param {Function} getFileEditor - Function to get the file editor from AppContext
 * @param {string} fallbackCode - Fallback code if no content is found
 * @returns {string} The current content (edited or original)
 */
export const getCurrentContent = (resource, getFileEditor, fallbackCode = '') => {
  if (!resource) return fallbackCode;
  
  // If resource has been transformed (e.g., pseudocode), use the transformed content
  if (resource.isPseudocode || resource.originalContent) {
    return resource.content || fallbackCode;
  }
  
  // Try to get the file editor from AppContext
  if (getFileEditor) {
    const file = getFileEditor();
    // Prefer editorContent (latest edited version) over original content
    return file?.editorContent || file?.content || resource.content || fallbackCode;
  }
  
  // Fallback to resource content
  return resource.content || fallbackCode;
};