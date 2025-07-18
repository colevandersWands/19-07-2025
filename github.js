/**
 * GitHub Repository Integration
 * Load repositories directly from browser URLs
 */

import { getFileExtension, getFileBaseName } from './shared/utils/fileUtils.js';

// === URL Parsing ===

export const isGitHubUrl = (url) => {
  return /github\.com\/[\w.-]+\/[\w.-]+/.test(url);
};

export const parseGitHubUrl = (url) => {
  // Handle various GitHub URL formats:
  // https://github.com/microsoft/vscode
  // https://github.com/microsoft/vscode/tree/main/src
  // https://github.com/microsoft/vscode/blob/main/package.json
  
  const match = url.match(/github\.com\/([\w.-]+)\/([\w.-]+)(?:\/(?:tree|blob)\/([\w.-]+)(?:\/(.*))?)?/);
  
  if (!match) return null;
  
  const [, owner, repo, branch = 'main', path = ''] = match;
  
  return {
    owner,
    repo, 
    branch,
    path: path || '',
    baseUrl: `https://api.github.com/repos/${owner}/${repo}`
  };
};

// === GitHub API Calls ===

export const fetchRepoTree = async (owner, repo, branch = 'main') => {
  const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Check for truncated results
    if (data.truncated) {
      console.warn('Repository tree was truncated - some files may be missing');
    }
    
    return data;
  } catch (error) {
    console.error('Failed to fetch repository tree:', error);
    throw error;
  }
};

export const fetchFileContent = async (owner, repo, path, branch = 'main') => {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`File not found: ${path}`);
      }
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Handle different content types
    if (data.type !== 'file') {
      throw new Error(`Path is not a file: ${path}`);
    }
    
    if (data.size > 1024 * 1024) { // 1MB limit
      throw new Error(`File too large: ${data.size} bytes`);
    }
    
    // Decode base64 content
    return atob(data.content.replace(/\s/g, ''));
  } catch (error) {
    console.error(`Failed to fetch file content for ${path}:`, error);
    throw error;
  }
};

// === File Filtering ===

const isTextFile = (path, size) => {
  // Skip binary files
  const binaryExtensions = [
    '.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico', '.webp',
    '.pdf', '.zip', '.tar', '.gz', '.exe', '.dll', '.so',
    '.mp4', '.mp3', '.avi', '.mov', '.wav',
    '.ttf', '.woff', '.woff2', '.eot'
  ];
  
  const isBinary = binaryExtensions.some(ext => path.toLowerCase().endsWith(ext));
  const isTooLarge = size > 100 * 1024; // 100KB limit
  
  return !isBinary && !isTooLarge;
};

const shouldIncludeFile = (item) => {
  return item.type === 'blob' && isTextFile(item.path, item.size);
};

// === Virtual FS Conversion ===

export const githubTreeToVirtualFS = (githubData, repoInfo, filterPath = '') => {
  const { owner, repo, branch } = repoInfo;
  
  // Filter files and apply path filter if specified
  const files = githubData.tree
    .filter(shouldIncludeFile)
    .filter(item => filterPath ? item.path.startsWith(filterPath) : true)
    .map(item => ({
      ...item,
      // Remove filterPath prefix if specified
      relativePath: filterPath ? item.path.slice(filterPath.length).replace(/^\//, '') : item.path
    }))
    .filter(item => item.relativePath); // Remove empty paths
  
  // Build directory structure
  const root = {
    type: 'directory',
    name: filterPath || `${owner}/${repo}`,
    children: []
  };
  
  // Group files by directory
  const pathMap = new Map();
  pathMap.set('', root);
  
  files.forEach(file => {
    const pathParts = file.relativePath.split('/');
    const fileName = pathParts.pop();
    
    // Create directory path
    let currentPath = '';
    let currentDir = root;
    
    pathParts.forEach(part => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      
      if (!pathMap.has(currentPath)) {
        const newDir = {
          type: 'directory',
          name: part,
          dir: currentPath.split('/').slice(0, -1).join('/'),
          children: [],
          path: `/${filterPath ? filterPath + '/' : ''}${currentPath}`,
          error: null
        };
        
        currentDir.children.push(newDir);
        pathMap.set(currentPath, newDir);
      }
      
      currentDir = pathMap.get(currentPath);
    });
    
    // Add file to directory with proper FS schema
    const ext = getFileExtension(fileName);
    const base = getFileBaseName(fileName);
    currentDir.children.push({
      type: 'file',
      name: fileName,
      ext,
      base,
      dir: currentPath,
      content: '', // Will be loaded on demand
      path: `/${filterPath ? filterPath + '/' : ''}${file.relativePath}`,
      lang: ext, // Initialize lang to ext
      error: null,
      githubPath: file.path,
      githubSize: file.size,
      githubRepo: { owner, repo, branch }
    });
  });
  
  // Sort children (directories first, then files)
  const sortChildren = (dir) => {
    if (dir.children) {
      dir.children.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
      
      dir.children.forEach(child => {
        if (child.type === 'directory') {
          sortChildren(child);
        }
      });
    }
  };
  
  sortChildren(root);
  return root;
};

// === Lazy Loading ===


/**
 * Load content for a specific GitHub file
 */
export const loadGitHubFile = async (file) => {
  if (!file.githubRepo || !file.githubPath) {
    throw new Error('File is not from GitHub');
  }
  
  if (file.content) {
    return file.content; // Already loaded
  }
  
  const { owner, repo, branch } = file.githubRepo;
  
  try {
    console.log(`📥 Loading GitHub file: ${file.githubPath}`);
    const content = await fetchFileContent(owner, repo, file.githubPath, branch);
    console.log(`✅ Loaded ${file.name}: ${content.length} characters`);
    
    // Cache the content in the file object
    file.content = content;
    
    return content;
  } catch (error) {
    console.error(`❌ Failed to load GitHub file ${file.githubPath}:`, error);
    throw error;
  }
};