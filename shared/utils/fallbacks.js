/**
 * Fallback implementations for unsupported features
 */

/**
 * Fallback for clipboard operations when Clipboard API is not available
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Promise that resolves to success status
 */
export const fallbackCopyToClipboard = (text) => {
  return new Promise((resolve) => {
    try {
      // Create a temporary textarea element
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      textarea.style.pointerEvents = 'none';
      
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, 99999); // For mobile devices
      
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      
      resolve(success);
    } catch (error) {
      console.warn('Fallback copy failed:', error);
      resolve(false);
    }
  });
};

/**
 * Fallback for local storage when not available
 */
export class FallbackStorage {
  constructor() {
    this.data = new Map();
  }
  
  setItem(key, value) {
    this.data.set(key, String(value));
  }
  
  getItem(key) {
    return this.data.get(key) || null;
  }
  
  removeItem(key) {
    this.data.delete(key);
  }
  
  clear() {
    this.data.clear();
  }
  
  get length() {
    return this.data.size;
  }
  
  key(index) {
    const keys = Array.from(this.data.keys());
    return keys[index] || null;
  }
}

/**
 * Fallback for dynamic imports when not supported
 * @param {string} modulePath - Path to the module
 * @returns {Promise<any>} Promise that resolves to the module or null
 */
export const fallbackDynamicImport = async (modulePath) => {
  console.warn(`Dynamic import not supported, cannot load: ${modulePath}`);
  return null;
};

/**
 * Fallback for ResizeObserver when not supported
 */
export class FallbackResizeObserver {
  constructor(callback) {
    this.callback = callback;
    this.observed = new Set();
    this.checkSize = this.checkSize.bind(this);
  }
  
  observe(element) {
    if (this.observed.size === 0) {
      this.startPolling();
    }
    
    this.observed.add({
      element,
      lastWidth: element.offsetWidth,
      lastHeight: element.offsetHeight
    });
  }
  
  unobserve(element) {
    this.observed.forEach(item => {
      if (item.element === element) {
        this.observed.delete(item);
      }
    });
    
    if (this.observed.size === 0) {
      this.stopPolling();
    }
  }
  
  disconnect() {
    this.observed.clear();
    this.stopPolling();
  }
  
  startPolling() {
    this.intervalId = setInterval(this.checkSize, 100);
  }
  
  stopPolling() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  checkSize() {
    this.observed.forEach(item => {
      const { element, lastWidth, lastHeight } = item;
      const currentWidth = element.offsetWidth;
      const currentHeight = element.offsetHeight;
      
      if (currentWidth !== lastWidth || currentHeight !== lastHeight) {
        item.lastWidth = currentWidth;
        item.lastHeight = currentHeight;
        
        this.callback([{
          target: element,
          contentRect: {
            width: currentWidth,
            height: currentHeight
          }
        }]);
      }
    });
  }
}

/**
 * Fallback for Intersection Observer when not supported
 */
export class FallbackIntersectionObserver {
  constructor(callback, options = {}) {
    this.callback = callback;
    this.options = options;
    this.observed = new Set();
    this.checkIntersection = this.checkIntersection.bind(this);
  }
  
  observe(element) {
    if (this.observed.size === 0) {
      this.startPolling();
    }
    
    this.observed.add({
      element,
      wasIntersecting: false
    });
  }
  
  unobserve(element) {
    this.observed.forEach(item => {
      if (item.element === element) {
        this.observed.delete(item);
      }
    });
    
    if (this.observed.size === 0) {
      this.stopPolling();
    }
  }
  
  disconnect() {
    this.observed.clear();
    this.stopPolling();
  }
  
  startPolling() {
    this.intervalId = setInterval(this.checkIntersection, 100);
  }
  
  stopPolling() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  checkIntersection() {
    this.observed.forEach(item => {
      const { element, wasIntersecting } = item;
      const rect = element.getBoundingClientRect();
      const isIntersecting = rect.top < window.innerHeight && rect.bottom > 0;
      
      if (isIntersecting !== wasIntersecting) {
        item.wasIntersecting = isIntersecting;
        
        this.callback([{
          target: element,
          isIntersecting,
          intersectionRatio: isIntersecting ? 1 : 0
        }]);
      }
    });
  }
}

/**
 * Show user-friendly message when a feature is not supported
 * @param {string} featureName - Name of the unsupported feature
 * @param {string} [fallbackMessage] - Optional fallback message
 */
export const showUnsupportedFeatureMessage = (featureName, fallbackMessage) => {
  const message = fallbackMessage || `Your browser doesn't support ${featureName}. Some features may be limited.`;
  
  // Try to show a non-intrusive notification
  if (window.Notification && Notification.permission === 'granted') {
    new Notification('Study Lenses', { body: message });
  } else {
    console.warn(message);
    // Could also show a toast notification in the UI
  }
};