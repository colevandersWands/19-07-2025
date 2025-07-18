import { useMemo } from 'preact/hooks';
import { useApp } from '../../shared/context/AppContext.jsx';
import { useDebounce } from './useDebounce.js';

/**
 * Custom hook for file editor operations
 * @param {string} filePath - The path of the current file
 * @returns {Object} - File editor utilities
 */
export function useFileEditor(filePath) {
  const { virtualFS, setVirtualFS } = useApp();
  
  // Find file in virtual filesystem
  const findFile = useMemo(() => {
    if (!virtualFS || !filePath) return null;
    
    const searchFile = (node, path) => {
      if (node.path === path) return node;
      if (node.children && Array.isArray(node.children)) {
        for (const child of node.children) {
          const found = searchFile(child, path);
          if (found) return found;
        }
      }
      return null;
    };
    
    return searchFile(virtualFS, filePath);
  }, [virtualFS, filePath]);
  
  // Update file content in virtual filesystem
  const updateFileContent = (content) => {
    if (!virtualFS || !filePath) return;
    
    const updateFileInNode = (node, path, content) => {
      if (node.path === path) {
        return {
          ...node,
          editorContent: content,
          hasChanges: content !== node.content,
        };
      }
      if (node.children && Array.isArray(node.children)) {
        return {
          ...node,
          children: node.children.map((child) =>
            updateFileInNode(child, path, content),
          ),
        };
      }
      return node;
    };
    
    const updatedFS = updateFileInNode(virtualFS, filePath, content);
    setVirtualFS(updatedFS);
  };
  
  // Debounced version of updateFileContent
  const debouncedUpdateFileContent = useDebounce(updateFileContent, 500);
  
  // Get editor instance for the current file
  const getEditorInstance = () => {
    return findFile?.editorInstance || null;
  };
  
  // Get editor container for the current file
  const getEditorContainer = () => {
    return findFile?.editorContainer || null;
  };
  
  // Set editor instance and container for the current file
  const setEditorInstance = (editorInstance, editorContainer) => {
    if (!virtualFS || !filePath) return;
    
    const updateFileInNode = (node, path, instance, container) => {
      if (node.path === path) {
        return {
          ...node,
          editorInstance: instance,
          editorContainer: container,
          hasEditor: true,
        };
      }
      if (node.children && Array.isArray(node.children)) {
        return {
          ...node,
          children: node.children.map((child) =>
            updateFileInNode(child, path, instance, container),
          ),
        };
      }
      return node;
    };
    
    const updatedFS = updateFileInNode(virtualFS, filePath, editorInstance, editorContainer);
    setVirtualFS(updatedFS);
  };
  
  // Clear editor instance for the current file
  const clearEditorInstance = () => {
    if (!virtualFS || !filePath) return;
    
    const updateFileInNode = (node, path) => {
      if (node.path === path) {
        // Clean up the editor instance
        if (node.editorInstance) {
          try {
            node.editorInstance.destroy();
          } catch (error) {
            console.warn('Error destroying editor instance:', error);
          }
        }
        
        // Remove the container from DOM
        if (node.editorContainer && node.editorContainer.parentNode) {
          node.editorContainer.parentNode.removeChild(node.editorContainer);
        }
        
        return {
          ...node,
          editorInstance: null,
          editorContainer: null,
          hasEditor: false,
        };
      }
      if (node.children && Array.isArray(node.children)) {
        return {
          ...node,
          children: node.children.map((child) =>
            updateFileInNode(child, path),
          ),
        };
      }
      return node;
    };
    
    const updatedFS = updateFileInNode(virtualFS, filePath);
    setVirtualFS(updatedFS);
  };
  
  return {
    file: findFile,
    updateFileContent,
    debouncedUpdateFileContent,
    getEditorInstance,
    getEditorContainer,
    setEditorInstance,
    clearEditorInstance,
  };
}