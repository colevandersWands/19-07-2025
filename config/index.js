/**
 * Configuration System
 * Three-tier config system: defaults → local → runtime
 */

// Default configuration embedded in JS
import { defaults } from './defaults.js';

// === Config Loading and Merging ===

export const loaddefaults = () => defaults;

// Deep merge function (similar to SL1's approach)
const deepMerge = (target, source) => {
  const result = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
};

// Load local config from virtual filesystem or fetch
export const loadLocalConfig = async (path = './lenses.json', virtualFS = null) => {
  try {
    // If we have virtual FS, try to find config files in the directory hierarchy
    if (virtualFS && path.startsWith('/')) {
      return await loadConfigFromVirtualFS(path, virtualFS);
    }
    
    // For virtual FS without path or local development, don't fetch - return empty config
    if (virtualFS || path === './lenses.json') {
      return {};
    }
    
    // Otherwise fetch from URL (only for explicit external paths)
    const response = await fetch(path);
    if (!response.ok) return {};
    return await response.json();
  } catch (error) {
    // Graceful fallback - no local config is fine
    return {};
  }
};

// Load and merge config files from virtual FS directory hierarchy
export const loadConfigFromVirtualFS = async (filePath, virtualFS) => {
  const pathParts = filePath.split('/').filter(p => p);
  let mergedConfig = {};
  
  // Walk up the directory tree looking for lenses.json files
  for (let i = 1; i <= pathParts.length; i++) {
    const dirPath = '/' + pathParts.slice(0, i).join('/');
    const configPath = dirPath + '/lenses.json';
    const configFile = findFileInVirtualFS(virtualFS, configPath);
    
    if (configFile && configFile.content) {
      try {
        const config = JSON.parse(configFile.content);
        mergedConfig = deepMerge(mergedConfig, config);
      } catch (error) {
        console.warn(`Invalid JSON in ${dirPath}/lenses.json:`, error);
      }
    }
  }
  
  return mergedConfig;
};

// Find a file in the virtual filesystem
const findFileInVirtualFS = (fs, targetPath) => {
  const parts = targetPath.split('/').filter(p => p);
  let current = fs;
  
  // Skip the first part if it matches the root directory name
  const searchParts = parts[0] === fs.name ? parts.slice(1) : parts;
  
  // Navigate through the directory structure
  for (const part of searchParts) {
    if (current?.children) {
      current = current.children.find(child => child.name === part);
      if (!current) return null;
    } else {
      return null;
    }
  }
  
  return current?.type === 'file' ? current : null;
};

// Parse runtime config from URL parameters or query object
export const parseRuntimeConfig = (queryParams = {}, lensName = null) => {
  const runtimeConfig = {
    lenses: {},
    query: {},
  };

  // Parse lens-specific parameters
  for (const [key, value] of Object.entries(queryParams)) {
    if (key.includes('.')) {
      // Lens-specific config: "embed.template=minimal"
      const [targetLens, configKey] = key.split('.');
      if (!runtimeConfig.lenses[targetLens]) {
        runtimeConfig.lenses[targetLens] = {};
      }
      runtimeConfig.lenses[targetLens][configKey] = value;
    } else if (lensName) {
      // If we have a specific lens context, treat all params as lens queries
      runtimeConfig.query[key] = value;
    } else {
      // General query parameter
      runtimeConfig.query[key] = value;
    }
  }

  return runtimeConfig;
};

// Compile final config for a specific lens
export const compileLensConfig = async (
  lensName,
  queryParams = {},
  localConfigPath = null,
  virtualFS = null,
) => {
  // 1. Load all config tiers
  const defaultConf = loaddefaults();
  const localConf = localConfigPath ? await loadLocalConfig(localConfigPath, virtualFS) : {};
  const runtimeConf = parseRuntimeConfig(queryParams, lensName);

  // 2. Get lens-specific configs from each tier
  const defaultLensConfig = defaultConf.lenses[lensName] || {};
  const localLensConfig = localConf.lenses?.[lensName] || {};
  const runtimeLensConfig = runtimeConf.lenses[lensName] || {};

  // 3. Deep merge in priority order: default → local → runtime
  const lensConfig = deepMerge(
    deepMerge(defaultLensConfig, localLensConfig),
    runtimeLensConfig,
  );

  // 4. Build complete config object (similar to SL1's lens config interface)
  return {
    // Lens identifier and runtime values
    lensName,
    queryParams: runtimeConf.query,

    // Lens-specific configuration
    config: lensConfig,

    // Resource paths
    static: {
      own: `/lenses/${lensName}/static`,
      shared: defaultConf.core.sharedStatic,
    },

    // Core system info
    core: defaultConf.core,

    // Full configs for debugging/inspection
    _tiers: {
      default: defaultLensConfig,
      local: localLensConfig,
      runtime: runtimeLensConfig,
    },
  };
};

// Get default lens pipeline for a file extension
export const getDefaultLenses = (fileExtension) => {
  const defaultConf = loaddefaults();
  const defaults = defaultConf.defaults;
  return defaults[fileExtension] || defaults['.js']; // fallback to .js defaults
};

// Get default lenses for a file with virtual filesystem config inheritance
export const getDefaultLensesForFile = async (filePath, fileExtension, virtualFS = null) => {
  if (virtualFS && filePath) {
    // Load merged config from virtual FS hierarchy
    const config = await loadConfigFromVirtualFS(filePath, virtualFS);
    if (config.defaults && config.defaults[fileExtension]) {
      return config.defaults[fileExtension];
    }
  }
  
  // Fallback to system defaults
  return getDefaultLenses(fileExtension);
};

// Compile config for entire pipeline
export const compilePipelineConfig = async (
  lensNames = [],
  queryParams = {},
  localConfigPath = null,
  virtualFS = null,
) => {
  const configs = {};

  for (const lensName of lensNames) {
    configs[lensName] = await compileLensConfig(lensName, queryParams, localConfigPath, virtualFS);
  }

  return configs;
};

// === Utility Functions ===

// Parse query string to object (browser-friendly)
export const parseQueryString = (queryString = '') => {
  const params = {};
  const urlParams = new URLSearchParams(queryString);

  for (const [key, value] of urlParams) {
    // Try to parse as JSON for complex values, fall back to string
    try {
      params[key] = JSON.parse(value);
    } catch {
      params[key] = value;
    }
  }

  return params;
};

// Serialize config for frontend use (similar to SL1 pattern)
export const serializeConfig = (config) => {
  return JSON.stringify(config, null, 2);
};
