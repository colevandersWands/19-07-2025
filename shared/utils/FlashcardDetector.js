/**
 * Flashcard Directory Detection Utility
 * Detects directories containing leitner.json configuration files
 */

/**
 * Check if a file system node represents a flashcard directory
 * @param {Object} node - File system node (directory)
 * @returns {boolean} - True if this is a flashcard directory
 */
export const isFlashcardDirectory = (node) => {
  if (!node || node.type !== 'directory' || !node.children) {
    return false;
  }
  
  // Check if directory contains leitner.json
  return node.children.some(child => 
    child.type === 'file' && child.name === 'leitner.json'
  );
};

/**
 * Get leitner.json configuration from a flashcard directory
 * @param {Object} directory - Directory node that contains leitner.json
 * @returns {Object|null} - Parsed leitner configuration or null
 */
export const getLeitnerConfig = (directory) => {
  if (!isFlashcardDirectory(directory)) {
    return null;
  }
  
  const leitnerFile = directory.children.find(child => 
    child.type === 'file' && child.name === 'leitner.json'
  );
  
  if (!leitnerFile || !leitnerFile.content) {
    return null;
  }
  
  try {
    return JSON.parse(leitnerFile.content);
  } catch (error) {
    console.error('Failed to parse leitner.json:', error);
    return null;
  }
};

/**
 * Get all markdown files from a flashcard directory
 * @param {Object} directory - Directory node
 * @returns {Array<Object>} - Array of markdown file nodes
 */
export const getFlashcardFiles = (directory) => {
  if (!directory || directory.type !== 'directory' || !directory.children) {
    return [];
  }
  
  const markdownFiles = [];
  
  // Recursively collect all .md files from directory and subdirectories
  const collectMarkdownFiles = (node) => {
    if (node.type === 'file' && node.name.endsWith('.md')) {
      markdownFiles.push(node);
    } else if (node.type === 'directory' && node.children) {
      node.children.forEach(collectMarkdownFiles);
    }
  };
  
  directory.children.forEach(collectMarkdownFiles);
  
  return markdownFiles;
};

/**
 * Check if a file path belongs to a flashcard directory
 * @param {string} filePath - File path to check
 * @param {Object} virtualFS - Virtual file system root
 * @returns {Object|null} - Flashcard directory info or null
 */
export const getFlashcardDirectoryForFile = (filePath, virtualFS) => {
  if (!filePath || !virtualFS) {
    return null;
  }
  
  // Walk up the directory tree to find a flashcard directory
  const pathParts = filePath.split('/').filter(p => p);
  
  // Check each parent directory level
  for (let i = pathParts.length - 1; i >= 0; i--) {
    const dirPath = '/' + pathParts.slice(0, i).join('/');
    const directory = findNodeByPath(virtualFS, dirPath);
    
    if (directory && isFlashcardDirectory(directory)) {
      return {
        directory,
        path: dirPath,
        config: getLeitnerConfig(directory),
        files: getFlashcardFiles(directory)
      };
    }
  }
  
  return null;
};

/**
 * Find a node in the virtual file system by path
 * @param {Object} virtualFS - Virtual file system root
 * @param {string} path - Path to find
 * @returns {Object|null} - Found node or null
 */
const findNodeByPath = (virtualFS, path) => {
  if (!virtualFS || !path) {
    return null;
  }
  
  if (path === '/' || path === '') {
    return virtualFS;
  }
  
  const parts = path.split('/').filter(p => p);
  let current = virtualFS;
  
  for (const part of parts) {
    if (!current.children) {
      return null;
    }
    
    current = current.children.find(child => child.name === part);
    if (!current) {
      return null;
    }
  }
  
  return current;
};

/**
 * Validate flashcard directory structure
 * @param {Object} directory - Directory to validate
 * @returns {Object} - Validation result with errors and warnings
 */
export const validateFlashcardDirectory = (directory) => {
  const validation = {
    isValid: false,
    errors: [],
    warnings: [],
    stats: {
      totalCards: 0,
      subdirectories: 0,
      leitnerBoxes: 0
    }
  };
  
  if (!isFlashcardDirectory(directory)) {
    validation.errors.push('Directory does not contain leitner.json configuration file');
    return validation;
  }
  
  const config = getLeitnerConfig(directory);
  if (!config) {
    validation.errors.push('Failed to parse leitner.json configuration');
    return validation;
  }
  
  const flashcardFiles = getFlashcardFiles(directory);
  validation.stats.totalCards = flashcardFiles.length;
  
  if (flashcardFiles.length === 0) {
    validation.warnings.push('No markdown flashcard files found in directory');
  }
  
  // Count subdirectories
  validation.stats.subdirectories = directory.children.filter(child => 
    child.type === 'directory'
  ).length;
  
  // Validate leitner box structure
  if (config.boxes) {
    validation.stats.leitnerBoxes = Object.keys(config.boxes).length;
    
    // Check for valid box numbers (1-7)
    const validBoxNumbers = Object.keys(config.boxes).every(boxNum => {
      const num = parseInt(boxNum);
      return num >= 1 && num <= 7;
    });
    
    if (!validBoxNumbers) {
      validation.warnings.push('Leitner boxes should be numbered 1-7');
    }
  } else {
    validation.warnings.push('No box configuration found in leitner.json');
  }
  
  validation.isValid = validation.errors.length === 0;
  return validation;
};