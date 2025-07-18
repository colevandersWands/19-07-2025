/**
 * Centralized URL Management for Study Lenses
 * Handles hash-based routing with proper parameter management
 */

export class URLManager {
  /**
   * Parse the current URL hash into components
   * Format: #/file/path?lens1=params&lens2=params
   */
  static parseURL() {
    const hash = window.location.hash.slice(1); // Remove #
    if (!hash) return { filePath: null, lensParams: {}, activeLenses: [], pseudocode: false, compressedCode: null, colorize: true };
    
    const [filePath, queryString] = hash.split('?');
    
    if (!queryString) {
      return { filePath, lensParams: {}, activeLenses: [], pseudocode: false, compressedCode: null, colorize: true };
    }
    
    const urlParams = new URLSearchParams(queryString);
    const lensParams = {};
    const activeLenses = [];
    
    // Extract special parameters
    const pseudocode = urlParams.get('pseudocode') === 'true';
    const compressedCode = urlParams.get('code');
    const colorize = urlParams.get('colorize') !== 'false'; // Default to true
    
    // Parse each parameter - could be lens-specific configs
    for (const [key, value] of urlParams.entries()) {
      // Skip special parameters
      if (key === 'pseudocode' || key === 'code' || key === 'colorize') {
        continue;
      }
      lensParams[key] = value;
      activeLenses.push(key);
    }
    
    return { filePath, lensParams, activeLenses, pseudocode, compressedCode, colorize };
  }
  
  /**
   * Build a clean URL with file path and lens parameters
   * Completely replaces existing URL to avoid accumulation
   */
  static buildURL(filePath, lensConfig = {}, options = {}) {
    let url = '';
    
    // Add file path if provided (unless using compressed code)
    if (filePath && !options.compressedCode) {
      // Ensure absolute path from virdir root
      const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
      url = cleanPath;
    }
    
    // Add lens parameters
    const params = new URLSearchParams();
    Object.entries(lensConfig).forEach(([lens, config]) => {
      if (config) {
        params.set(lens, config);
      }
    });
    
    // Add special parameters
    if (options.pseudocode) {
      params.set('pseudocode', 'true');
    }
    if (options.compressedCode) {
      params.set('code', options.compressedCode);
    }
    if (options.colorize === false) {
      params.set('colorize', 'false');
    }
    
    const queryString = params.toString();
    if (queryString) {
      url += '?' + queryString;
    }
    
    return url;
  }
  
  /**
   * Update the URL completely, replacing all existing parameters
   */
  static updateURL(filePath, lensConfig = {}, options = {}) {
    const newURL = this.buildURL(filePath, lensConfig, options);
    const fullURL = newURL ? `#${newURL}` : '#';
    
    window.history.replaceState({}, '', fullURL);
  }
  
  /**
   * Add or update a specific lens configuration
   * Preserves other lens configs but replaces the specified one
   */
  static updateLensConfig(lensName, config) {
    const { filePath, lensParams, pseudocode, compressedCode, colorize } = this.parseURL();
    
    // Update or add the specific lens config
    const newLensConfig = { ...lensParams };
    if (config) {
      newLensConfig[lensName] = config;
    } else {
      delete newLensConfig[lensName];
    }
    
    this.updateURL(filePath, newLensConfig, { pseudocode, compressedCode, colorize });
  }
  
  /**
   * Switch to a different file, preserving current lens configurations
   */
  static switchFile(newFilePath) {
    const { lensParams, pseudocode, compressedCode, colorize } = this.parseURL();
    this.updateURL(newFilePath, lensParams, { pseudocode, compressedCode, colorize });
  }
  
  /**
   * Clear all lens parameters, keeping only the file path
   */
  static clearLensParams() {
    const { filePath } = this.parseURL();
    this.updateURL(filePath, {});
  }
  
  /**
   * Get current file path from URL
   */
  static getCurrentFilePath() {
    const { filePath } = this.parseURL();
    return filePath;
  }
  
  /**
   * Get configuration for a specific lens
   */
  static getLensConfig(lensName) {
    const { lensParams } = this.parseURL();
    return lensParams[lensName] || null;
  }
  
  /**
   * Check if a specific lens is active
   */
  static isLensActive(lensName) {
    const { activeLenses } = this.parseURL();
    return activeLenses.includes(lensName);
  }
  
  /**
   * Get pseudocode setting from URL
   */
  static getPseudocode() {
    const { pseudocode } = this.parseURL();
    return pseudocode;
  }
  
  /**
   * Toggle pseudocode setting
   */
  static togglePseudocode() {
    const { filePath, lensParams, pseudocode, compressedCode, colorize } = this.parseURL();
    this.updateURL(filePath, lensParams, { pseudocode: !pseudocode, compressedCode, colorize });
  }
  
  /**
   * Get colorize setting from URL
   */
  static getColorize() {
    const { colorize } = this.parseURL();
    return colorize;
  }
  
  /**
   * Toggle colorize setting
   */
  static toggleColorize() {
    const { filePath, lensParams, pseudocode, compressedCode, colorize } = this.parseURL();
    this.updateURL(filePath, lensParams, { pseudocode, compressedCode, colorize: !colorize });
  }
  
  /**
   * Get compressed code from URL
   */
  static getCompressedCode() {
    const { compressedCode } = this.parseURL();
    return compressedCode;
  }
  
  /**
   * Share code selection - replaces file path with compressed code
   */
  static shareCodeSelection(code, lensConfig = {}) {
    const { pseudocode, colorize } = this.parseURL();
    
    // Simple compression - in production you might use LZ-string or similar
    const compressed = btoa(encodeURIComponent(code));
    
    this.updateURL(null, lensConfig, { pseudocode, compressedCode: compressed, colorize });
    
    // Return shareable URL
    return window.location.href;
  }
  
  /**
   * Decompress shared code
   */
  static decompressCode(compressedCode) {
    try {
      return decodeURIComponent(atob(compressedCode));
    } catch (error) {
      console.error('Failed to decompress code:', error);
      return null;
    }
  }
  
  /**
   * Check if current URL is a code share
   */
  static isCodeShare() {
    const { isCodeShare } = this.parseURL();
    return isCodeShare;
  }
  
  /**
   * Get all current URL state for complete reconstruction
   */
  static getFullState() {
    return this.parseURL();
  }
  
  /**
   * Set complete URL state (for full restoration)
   */
  static setFullState(state) {
    const { filePath, lensParams, pseudocode, compressedCode, colorize } = state;
    this.updateURL(filePath, lensParams, { pseudocode, compressedCode, colorize });
  }
}

export default URLManager;