/**
 * Base Path Utility
 * Provides consistent base path handling for development and production
 */

// Get the base path from the HTML document
export function getBasePath() {
  // Check if we're in development or production
  const isDev = import.meta.env.DEV;
  
  if (isDev) {
    return '';
  }
  
  // In production, use the configured base path
  return '/19-07-2025';
}

// Get the full path with base path
export function getFullPath(path) {
  const basePath = getBasePath();
  
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Combine base path with the clean path
  return basePath ? `${basePath}/${cleanPath}` : `/${cleanPath}`;
}

// Get static asset path
export function getStaticPath(path) {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Always prefix with static/
  const staticPath = cleanPath.startsWith('static/') ? cleanPath : `static/${cleanPath}`;
  
  return getFullPath(staticPath);
}