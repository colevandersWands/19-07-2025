import { createContext } from 'preact';
import { useContext, useState, useEffect } from 'preact/hooks';
import URLManager from '../utils/urlManager.js';

/**
 * Context for managing global syntax colorization state
 */
const ColorizeContext = createContext();

export const ColorizeProvider = ({ children }) => {
  const [enableColorize, setEnableColorize] = useState(true);

  // Initialize from URL on mount
  useEffect(() => {
    const urlColorize = URLManager.getColorize();
    setEnableColorize(urlColorize);
  }, []);

  // Listen for URL changes (e.g., browser navigation)
  useEffect(() => {
    const handleHashChange = () => {
      const urlColorize = URLManager.getColorize();
      setEnableColorize(urlColorize);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const toggleColorize = () => {
    URLManager.toggleColorize();
    setEnableColorize(!enableColorize);
  };

  return (
    <ColorizeContext.Provider value={{
      enableColorize,
      toggleColorize
    }}>
      {children}
    </ColorizeContext.Provider>
  );
};

export const useColorize = () => {
  const context = useContext(ColorizeContext);
  if (!context) {
    throw new Error('useColorize must be used within a ColorizeProvider');
  }
  return context;
};

export default ColorizeContext;