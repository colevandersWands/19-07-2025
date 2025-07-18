/**
 * Virtual File System Operations
 */

import {
  isGitHubUrl,
  parseGitHubUrl,
  fetchRepoTree,
  githubTreeToVirtualFS,
  loadGitHubFile,
} from './github.js';

let virtualFS = null;

export const getVirtualFS = () => virtualFS;

export const setVirtualFS = (fs) => {
  virtualFS = fs;
  return fs;
};

export const loadFS = async (source = './public/variablesing.json') => {
  try {
    if (isGitHubUrl(source)) {
      const repoInfo = parseGitHubUrl(source);
      if (!repoInfo) {
        throw new Error('Invalid GitHub URL format');
      }

      const githubData = await fetchRepoTree(
        repoInfo.owner,
        repoInfo.repo,
        repoInfo.branch,
      );
      virtualFS = githubTreeToVirtualFS(githubData, repoInfo, repoInfo.path);
    } else {
      const response = await fetch(source);
      virtualFS = await response.json();

      // Add root and toCwd to loaded virtual FS
      addVirtualFSMetadata(virtualFS, '/');
    }

    return virtualFS;
  } catch (error) {
    console.error('Failed to load file system:', error);
    throw error;
  }
};

export const getFile = (path) => {
  if (!path || !virtualFS) {
    return null;
  }

  // Handle absolute paths by removing leading slash
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const parts = cleanPath.split('/').filter((p) => p);

  let current = virtualFS;

  for (const part of parts) {
    if (current?.children) {
      current = current.children.find((child) => child.name === part);
      if (!current) {
        console.warn(`File path segment "${part}" not found in virtual filesystem`);
        return null;
      }
    } else {
      console.warn(`No children found for path segment "${part}"`);
      return null;
    }
  }

  return current?.type === 'file' ? current : null;
};

export const updateFile = (path, content) => {
  const file = getFile(path);
  if (file) {
    file.content = content;
  }
};

// Cache lens preferences for a file during study session
export const cacheLensPreferences = (path, lensNames) => {
  const file = getFile(path);
  if (file) {
    if (!file.studyCache) {
      file.studyCache = {};
    }
    file.studyCache.lenses = [...lensNames];
    file.studyCache.lastModified = new Date().toISOString();
  }
};

// Get cached lens preferences for a file
export const getCachedLensPreferences = (path) => {
  const file = getFile(path);
  if (file?.studyCache?.lenses) {
    return file.studyCache.lenses;
  }
  return null;
};

// Check if a file has cached lens preferences
export const hasCachedLenses = (path) => {
  const file = getFile(path);
  return !!file?.studyCache?.lenses;
};

// Clear cached lens preferences for a file
export const clearCachedLenses = (path) => {
  const file = getFile(path);
  if (file?.studyCache) {
    delete file.studyCache.lenses;
    if (Object.keys(file.studyCache).length === 0) {
      delete file.studyCache;
    }
  }
};

export const loadFileContent = async (file) => {
  // Check if it's a GitHub file that needs lazy loading
  if (file.githubRepo && !file.content) {
    try {
      file.content = await loadGitHubFile(file);
    } catch (error) {
      console.error(`❌ Failed to load ${file.name}:`, error);
      file.content = `// Error loading file: ${error.message}`;
    }
  }
  return file.content || '';
};

const countFiles = (dir) => {
  let count = 0;
  const traverse = (node) => {
    if (node.type === 'file') {
      count++;
    } else if (node.children) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  };
  traverse(dir);
  return count;
};

const addVirtualFSMetadata = (node, root) => {
  // Add root reference
  node.root = root;

  // Calculate toCwd for files and directories
  if (node.dir !== undefined) {
    const depth = node.dir.split('/').filter((p) => p).length;
    node.toCwd = depth === 0 ? '.' : '../'.repeat(depth).slice(0, -1);
  }

  // Initialize lang from ext for files
  if (node.type === 'file' && node.ext && !node.lang) {
    node.lang = node.ext;
  }

  // Recursively process children
  if (node.children) {
    for (const child of node.children) {
      addVirtualFSMetadata(child, root);
    }
  }
};

export const getRandomFile = (dir = virtualFS) => {
  if (!dir) {
    console.warn('getRandomFile called with null/undefined directory, using virtualFS');
    dir = virtualFS;
  }

  if (!dir) {
    console.warn('No virtual filesystem available for getRandomFile');
    return null;
  }

  const files = [];
  const collect = (node) => {
    if (!node) return;
    if (node.type === 'file') files.push(node);
    else if (node.children) {
      for (const child of node.children) {
        collect(child);
      }
    }
  };
  collect(dir);
  return files.length > 0 ? files[Math.floor(Math.random() * files.length)] : null;
};

export const findSimilarFile = (requestedPath) => {
  if (!virtualFS || !requestedPath) {
    return null;
  }

  // Try to find files with similar names or in similar directories
  const allFiles = [];
  const collect = (node) => {
    if (!node) return;
    if (node.type === 'file') allFiles.push(node);
    else if (node.children) {
      for (const child of node.children) {
        collect(child);
      }
    }
  };
  collect(virtualFS);

  // Extract the directory and filename from the requested path
  const pathParts = requestedPath.split('/').filter((p) => p);
  const requestedDir = pathParts.slice(0, -1).join('/');
  const requestedFilename = pathParts[pathParts.length - 1];

  // Try to find a file with similar name in the same directory
  if (requestedDir && requestedFilename) {
    const similarFiles = allFiles.filter((file) => {
      const fileDir = file.path.split('/').slice(0, -1).join('/');
      return fileDir.includes(requestedDir) || requestedDir.includes(fileDir);
    });

    if (similarFiles.length > 0) {
      return similarFiles[0];
    }
  }

  // Fallback to any file in a similar directory structure
  const dirKeywords = pathParts.slice(0, -1);
  if (dirKeywords.length > 0) {
    const matchingFiles = allFiles.filter((file) => {
      return dirKeywords.some((keyword) => file.path.includes(keyword));
    });

    if (matchingFiles.length > 0) {
      return matchingFiles[0];
    }
  }

  return null;
};
