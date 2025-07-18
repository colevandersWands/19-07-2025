import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import { useToast } from '../hooks/useToast.js';
import ToastContainer from '../components/ToastContainer.jsx';

/**
 * Context for toast notifications
 */
const ToastContext = createContext();

/**
 * Toast provider component
 * @param {Object} props - Component props
 * @param {JSX.Element} props.children - Child components
 * @returns {JSX.Element} Toast provider with container
 */
export const ToastProvider = ({ children }) => {
  const toastMethods = useToast();

  return (
    <ToastContext.Provider value={toastMethods}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

/**
 * Hook to use toast notifications
 * @returns {Object} Toast management functions
 */
export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};