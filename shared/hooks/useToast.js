import { useState, useCallback } from 'preact/hooks';

/**
 * Custom hook for managing toast notifications
 * @returns {Object} Toast management functions and state
 */
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  /**
   * Add a new toast notification
   * @param {string} message - Message to display
   * @param {string} [type='info'] - Toast type: 'success', 'error', 'warning', 'info'
   * @param {number} [duration=3000] - Duration in milliseconds, 0 for permanent
   * @returns {string} Toast ID
   */
  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      type,
      duration,
      timestamp: Date.now()
    };
    
    setToasts(prev => [...prev, toast]);
    
    // Auto-remove toast after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration + 300); // Add 300ms for animation
    }
    
    return id;
  }, []);

  /**
   * Remove a toast by ID
   * @param {string} id - Toast ID to remove
   */
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  /**
   * Clear all toasts
   */
  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  /**
   * Show success toast
   * @param {string} message - Success message
   * @param {number} [duration=3000] - Duration in milliseconds
   * @returns {string} Toast ID
   */
  const showSuccess = useCallback((message, duration = 3000) => {
    return showToast(message, 'success', duration);
  }, [showToast]);

  /**
   * Show error toast
   * @param {string} message - Error message
   * @param {number} [duration=5000] - Duration in milliseconds (longer for errors)
   * @returns {string} Toast ID
   */
  const showError = useCallback((message, duration = 5000) => {
    return showToast(message, 'error', duration);
  }, [showToast]);

  /**
   * Show warning toast
   * @param {string} message - Warning message
   * @param {number} [duration=4000] - Duration in milliseconds
   * @returns {string} Toast ID
   */
  const showWarning = useCallback((message, duration = 4000) => {
    return showToast(message, 'warning', duration);
  }, [showToast]);

  /**
   * Show info toast
   * @param {string} message - Info message
   * @param {number} [duration=3000] - Duration in milliseconds
   * @returns {string} Toast ID
   */
  const showInfo = useCallback((message, duration = 3000) => {
    return showToast(message, 'info', duration);
  }, [showToast]);

  return {
    toasts,
    showToast,
    removeToast,
    clearToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};