import Toast from './Toast.jsx';
import { useToast } from '../hooks/useToast.js';
import styles from './ToastContainer.module.css';

/**
 * Container component for managing multiple toast notifications
 * @returns {JSX.Element} Toast container with all active toasts
 */
const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className={styles.toastContainer}>
      {toasts.map((toast, index) => (
        <div 
          key={toast.id} 
          className={styles.toastWrapper}
          style={{ 
            '--toast-index': index,
            zIndex: 9999 - index 
          }}
        >
          <Toast
            message={toast.message}
            type={toast.type}
            duration={0} // Container manages timing
            onClose={() => removeToast(toast.id)}
            isVisible={true}
          />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;