/**
 * Feature detection utilities for graceful degradation
 */

/**
 * Check if the browser supports the Clipboard API
 * @returns {boolean} True if clipboard API is supported
 */
export const supportsClipboard = () => {
  return navigator && navigator.clipboard && typeof navigator.clipboard.writeText === 'function';
};

/**
 * Check if the browser supports local storage
 * @returns {boolean} True if local storage is supported
 */
export const supportsLocalStorage = () => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Check if the browser supports the File API
 * @returns {boolean} True if File API is supported
 */
export const supportsFileAPI = () => {
  return window.File && window.FileReader && window.FileList && window.Blob;
};

/**
 * Check if the browser supports dynamic imports
 * @returns {boolean} True if dynamic imports are supported
 */
export const supportsDynamicImports = () => {
  try {
    new Function('import("")');
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Check if the browser supports ES6 modules
 * @returns {boolean} True if ES6 modules are supported
 */
export const supportsES6Modules = () => {
  const script = document.createElement('script');
  return 'noModule' in script;
};

/**
 * Check if the browser supports CSS Grid
 * @returns {boolean} True if CSS Grid is supported
 */
export const supportsCSSGrid = () => {
  return CSS && CSS.supports && CSS.supports('display', 'grid');
};

/**
 * Check if the browser supports CSS custom properties (variables)
 * @returns {boolean} True if CSS custom properties are supported
 */
export const supportsCSSCustomProperties = () => {
  return window.CSS && CSS.supports && CSS.supports('color', 'var(--fake-var)');
};

/**
 * Check if the browser supports touch events
 * @returns {boolean} True if touch events are supported
 */
export const supportsTouchEvents = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

/**
 * Check if the browser supports the Intersection Observer API
 * @returns {boolean} True if Intersection Observer is supported
 */
export const supportsIntersectionObserver = () => {
  return 'IntersectionObserver' in window;
};

/**
 * Check if the browser supports the ResizeObserver API
 * @returns {boolean} True if ResizeObserver is supported
 */
export const supportsResizeObserver = () => {
  return 'ResizeObserver' in window;
};

/**
 * Check if the browser supports Web Workers
 * @returns {boolean} True if Web Workers are supported
 */
export const supportsWebWorkers = () => {
  return typeof Worker !== 'undefined';
};

/**
 * Get a comprehensive feature support report
 * @returns {Object} Object containing all feature support flags
 */
export const getFeatureSupport = () => {
  return {
    clipboard: supportsClipboard(),
    localStorage: supportsLocalStorage(),
    fileAPI: supportsFileAPI(),
    dynamicImports: supportsDynamicImports(),
    es6Modules: supportsES6Modules(),
    cssGrid: supportsCSSGrid(),
    cssCustomProperties: supportsCSSCustomProperties(),
    touchEvents: supportsTouchEvents(),
    intersectionObserver: supportsIntersectionObserver(),
    resizeObserver: supportsResizeObserver(),
    webWorkers: supportsWebWorkers()
  };
};