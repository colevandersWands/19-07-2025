import { useState, useEffect, useRef } from 'preact/hooks';
import styles from './StepThroughModal.module.css';

const isJavaScript = (language = '') =>
  language === '.js' || language === 'js' || language === 'javascript';

/**
 * Step-Through Modal - Large popup with Python Tutor/JSViz visualization
 * Used in Editor mode as an alternative to full Step-Throughs study mode
 */
const StepThroughModal = ({ isOpen, onClose, code, fileName, language }) => {
  const [selectedTool, setSelectedTool] = useState('pythontutor');
  const [iframeSrc, setIframeSrc] = useState('');
  const [newTabUrl, setNewTabUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const modalRef = useRef(null);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Generate visualization URLs
  useEffect(() => {
    if (!code.trim() || !isOpen) {
      setIframeSrc('');
      setIsLoading(false);
      return;
    }

    try {
      let iframeUrl = '';
      let tabUrl = '';

      if (selectedTool === 'pythontutor') {
        const encodedCode = encodeURIComponent(code);

        // For iframe: Use iframe-embed URL
        const iframeBaseUrl = 'https://pythontutor.com/iframe-embed.html#code=';
        const iframeOptions = {
          codeDivHeight: '500',
          codeDivWidth: '450',
          cumulative: 'false',
          curInstr: '0',
          heapPrimitives: 'nevernest',
          origin: 'opt-frontend.js',
          py: isJavaScript(language) ? 'js' : language === '.py' ? 'py3' : 'py3',
          rawInputLstJSON: '%5B%5D',
          textReferences: 'false',
        };

        const iframeQueryString = Object.entries(iframeOptions)
          .map(([key, value]) => `${key}=${value}`)
          .join('&');

        iframeUrl = `${iframeBaseUrl}${encodedCode}&${iframeQueryString}`;

        // For new tab: Use regular Python Tutor URLs
        const tabBaseUrls = {
          '.py': 'https://pythontutor.com/visualize.html#code=',
          '.js': 'https://pythontutor.com/javascript.html#code=',
          js: 'https://pythontutor.com/javascript.html#code=',
          javascript: 'https://pythontutor.com/javascript.html#code=',
          '.java': 'https://pythontutor.com/java.html#code=',
          '.c': 'https://pythontutor.com/c.html#code=',
          '.cpp': 'https://pythontutor.com/cpp.html#code=',
        };

        const tabBaseUrl = tabBaseUrls[language] || tabBaseUrls['.py'];
        const tabOptions = {
          cumulative: 'false',
          heapPrimitives: 'nevernest',
          textReferences: 'false',
          py: language === '.js' ? 'js' : '3',
          rawInputLstJSON: '%5B%5D',
          curInstr: '0',
        };

        const tabQueryString = Object.entries(tabOptions)
          .map(([key, value]) => `${key}=${value}`)
          .join('&');

        tabUrl = `${tabBaseUrl}${encodedCode}&${tabQueryString}`;
      } else if (selectedTool === 'jsviz' && isJavaScript(language)) {
        // JSViz uses jsviz.klve.nl with LZ-string compression
        const encodedCode = window.LZString
          ? window.LZString.compressToEncodedURIComponent(code)
          : encodeURIComponent(code); // fallback
        const jsvizUrl = `https://jsviz.klve.nl/#?code=${encodedCode}`;

        iframeUrl = jsvizUrl;
        tabUrl = jsvizUrl;
      }

      setIframeSrc(iframeUrl);
      setNewTabUrl(tabUrl);
      setIsLoading(false);
    } catch (error) {
      console.error('Error generating visualization URL:', error);
      setIsLoading(false);
    }
  }, [code, language, selectedTool, isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalContent}
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h3>🔍 Step-Through Visualization</h3>
          <div className={styles.headerInfo}>
            <span className={styles.fileName}>{fileName}</span>
            <div className={styles.toolSelector}>
              <select
                value={selectedTool}
                onChange={(e) => setSelectedTool(e.target.value)}
                className={styles.toolSelect}
              >
                <option value="pythontutor">Python Tutor</option>
                {isJavaScript(language) && <option value="jsviz">JSViz</option>}
              </select>
            </div>
            <button
              className={styles.openExternalButton}
              onClick={() => window.open(newTabUrl, '_blank')}
              title="Open in new tab"
            >
              🔗 Open External
            </button>
            <button className={styles.closeButton} onClick={onClose} title="Close modal">
              ✕
            </button>
          </div>
        </div>

        <div className={styles.modalBody}>
          {isLoading ? (
            <div className={styles.loadingState}>
              <div className={styles.loadingSpinner}>🔄</div>
              <p>Loading step-through visualization...</p>
            </div>
          ) : !code.trim() ? (
            <div className={styles.emptyState}>
              <p>No code to visualize</p>
            </div>
          ) : (
            <div className={styles.iframeContainer}>
              <iframe
                src={iframeSrc}
                className={styles.stepThroughIframe}
                title={`${selectedTool === 'jsviz' ? 'JSViz' : 'Python Tutor'} visualization for ${fileName}`}
                frameBorder="0"
                allowFullScreen
                onLoad={() => undefined}
                onError={(e) =>
                  console.error(`${selectedTool} iframe error in modal:`, e)
                }
              />
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <div className={styles.instructions}>
            <h4>💡 How to Use</h4>
            <ul>
              <li>
                <strong>Step Through:</strong> Use the controls in the visualization to
                step through execution
              </li>
              <li>
                <strong>Tool Selection:</strong> Switch between Python Tutor and JSViz
                using the dropdown
              </li>
              <li>
                <strong>External View:</strong> Click "Open External" for the full
                experience in a new tab
              </li>
              <li>
                <strong>Close Modal:</strong> Press Escape or click the X button to return
                to the editor
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepThroughModal;
