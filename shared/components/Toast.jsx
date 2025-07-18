import { useState, useEffect } from 'preact/hooks';
import styles from './Toast.module.css';

/**
 * Toast notification component for user feedback
 * @param {Object} props - Component props
 * @param {string} props.message - Message to display
 * @param {string} [props.type='info'] - Toast type: 'success', 'error', 'warning', 'info'
 * @param {number} [props.duration=3000] - Duration in milliseconds
 * @param {function(): void} [props.onClose] - Callback when toast is closed
 * @param {boolean} [props.isVisible=true] - Whether toast is visible
 * @returns {JSX.Element|null} Toast component
 */
const Toast = ({ 
  message, 
  type = 'info', 
  duration = 3000, 
  onClose,
  isVisible = true 
}) => {
  const [visible, setVisible] = useState(isVisible);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setVisible(true);
      setAnimating(true);
      
      if (duration > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isVisible, duration]);

  const handleClose = () => {
    setAnimating(false);
    setTimeout(() => {
      setVisible(false);
      if (onClose) onClose();
    }, 300); // Match CSS animation duration
  };

  if (!visible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': 
      default: return 'ℹ️';
    }
  };

  return (
    <div 
      className={`${styles.toast} ${styles[type]} ${animating ? styles.visible : styles.hidden}`}
      role="alert"
      aria-live="polite"
    >
      <div className={styles.toastContent}>
        <span className={styles.toastIcon}>{getIcon()}</span>
        <span className={styles.toastMessage}>{message}</span>
        <button 
          className={styles.toastClose}
          onClick={handleClose}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default Toast;