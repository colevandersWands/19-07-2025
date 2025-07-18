import { useState, useEffect, useCallback } from 'preact/hooks';
import { useApp } from '../../shared/context/AppContext.jsx';
import { getCurrentContent } from '../../shared/utils/getCurrentContent.js';
import URLManager from '../../shared/utils/urlManager.js';
import styles from './StepThroughsLens.module.css';

/**
 * Step-Throughs Lens - Visualize code execution using external tools
 * Shows interactive step-by-step code execution with visual stack/heap
 */
const StepThroughsLens = ({ resource }) => {
  const fileName = resource?.name || '';
  const lang = resource?.lang || '.py';
  const { virtualFS } = useApp();
  
  // Get file editor to access latest content
  const getFileEditor = useCallback(() => {
    if (!virtualFS || !resource.path) return null;
    
    const findFile = (node, path) => {
      if (node.path === path) return node;
      if (node.children && Array.isArray(node.children)) {
        for (const child of node.children) {
          const found = findFile(child, path);
          if (found) return found;
        }
      }
      return null;
    };
    
    return findFile(virtualFS, resource.path);
  }, [virtualFS, resource.path]);
  
  // Get current content (edited or original)
  const code = getCurrentContent(resource, getFileEditor, '');
  
  const [iframeSrc, setIframeSrc] = useState('');
  const [newTabUrl, setNewTabUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTool, setSelectedTool] = useState('pythontutor'); // 'pythontutor' or 'jsviz'
  
  // URL-based configuration for tool selection
  useEffect(() => {
    const notionalConfig = URLManager.getLensConfig('notional');
    
    if (notionalConfig && notionalConfig !== 'active') {
      try {
        const params = new URLSearchParams(notionalConfig.replace(/[+]/g, '&').replace(/:/g, '='));
        const tool = params.get('tool');
        if (tool && (tool === 'pythontutor' || tool === 'jsviz')) {
          setSelectedTool(tool);
        }
      } catch (error) {
        console.warn('Failed to parse notional parameters:', error);
      }
    }
  }, []);
  
  // Update URL when tool selection changes
  useEffect(() => {
    const config = selectedTool === 'pythontutor' ? 'active' : `tool:${selectedTool}`;
    URLManager.updateLensConfig('notional', config);
  }, [selectedTool]);
  
  // Generate Python Tutor URL based on language and code
  useEffect(() => {
    if (!code.trim()) {
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
          'codeDivHeight': '400',
          'codeDivWidth': '350', 
          'cumulative': 'false',
          'curInstr': '0',
          'heapPrimitives': 'nevernest',
          'origin': 'opt-frontend.js',
          'py': lang === '.js' ? 'js' : (lang === '.py' ? 'py3' : 'py3'),
          'rawInputLstJSON': '%5B%5D',
          'textReferences': 'false'
        };
        
        const iframeQueryString = Object.entries(iframeOptions)
          .map(([key, value]) => `${key}=${value}`)
          .join('&');
        
        iframeUrl = `${iframeBaseUrl}${encodedCode}&${iframeQueryString}`;
        
        // For new tab: Use regular Python Tutor URLs (SL1 style)
        const tabBaseUrls = {
          '.py': 'https://pythontutor.com/visualize.html#code=',
          '.js': 'https://pythontutor.com/javascript.html#code=',
          '.java': 'https://pythontutor.com/java.html#code=',
          '.c': 'https://pythontutor.com/c.html#code=',
          '.cpp': 'https://pythontutor.com/cpp.html#code='
        };
        
        const tabBaseUrl = tabBaseUrls[lang] || tabBaseUrls['.py'];
        const tabOptions = {
          'cumulative': 'false',
          'heapPrimitives': 'nevernest',
          'textReferences': 'false',
          'py': lang === '.js' ? 'js' : '3',
          'rawInputLstJSON': '%5B%5D',
          'curInstr': '0'
        };
        
        const tabQueryString = Object.entries(tabOptions)
          .map(([key, value]) => `${key}=${value}`)
          .join('&');
        
        tabUrl = `${tabBaseUrl}${encodedCode}&${tabQueryString}`;
        
      } else if (selectedTool === 'jsviz' && lang === '.js') {
        // JSViz uses jsviz.klve.nl with LZ-string compression (from SL1 wc-open-in)
        const encodedCode = window.LZString ? 
          window.LZString.compressToEncodedURIComponent(code) : 
          encodeURIComponent(code); // fallback
        const jsvizUrl = `https://jsviz.klve.nl/#?code=${encodedCode}`;
        
        iframeUrl = jsvizUrl;
        tabUrl = jsvizUrl;
      }
      
      setIframeSrc(iframeUrl);
      setNewTabUrl(tabUrl);
      setIsLoading(false);
      
      console.log(`Generated ${selectedTool} URLs for`, lang, 'file:', fileName);
      console.log('Iframe URL:', iframeUrl);
      console.log('New tab URL:', tabUrl);
    } catch (error) {
      console.error('Error generating Python Tutor URL:', error);
      setIsLoading(false);
    }
  }, [code, lang, fileName, selectedTool]);
  
  if (!code.trim()) {
    return (
      <div className={styles.stepThroughsLens}>
        <div className={styles.header}>
          <h3>🔍 Step-Throughs</h3>
          {fileName && <span className={styles.fileName}>{fileName}</span>}
        </div>
        <div className={styles.emptyState}>
          <p>No code to visualize</p>
          <p>Select a file with code content to see the execution visualization.</p>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className={styles.stepThroughsLens}>
        <div className={styles.header}>
          <h3>🔍 Step-Throughs</h3>
          {fileName && <span className={styles.fileName}>{fileName}</span>}
        </div>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}>🔄</div>
          <p>Loading execution visualization...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.stepThroughsLens}>
      <div className={styles.header}>
        <h3>🧠 Notional Machines</h3>
        {fileName && <span className={styles.fileName}>{fileName}</span>}
        <div className={styles.headerActions}>
          <div className={styles.toolSelector}>
            <select 
              value={selectedTool} 
              onChange={(e) => setSelectedTool(e.target.value)}
              className={styles.toolSelect}
            >
              <option value="pythontutor">Python Tutor</option>
              {lang === '.js' && <option value="jsviz">JSViz</option>}
            </select>
          </div>
          <button 
            className={styles.openExternalButton}
            onClick={() => window.open(newTabUrl, '_blank')}
            title="Open in new tab"
          >
            🔗 Open External
          </button>
        </div>
      </div>
      
      <div className={styles.iframeContainer}>
        <iframe
          src={iframeSrc}
          className={styles.tutorIframe}
          title={`${selectedTool === 'jsviz' ? 'JSViz' : 'Python Tutor'} visualization for ${fileName}`}
          frameBorder="0"
          allowFullScreen
          onLoad={() => console.log(`${selectedTool} iframe loaded`)}
          onError={(e) => console.error(`${selectedTool} iframe error:`, e)}
        />
      </div>
      
      <div className={styles.instructions}>
        <h4>📚 How to Use {selectedTool === 'jsviz' ? 'JSViz' : 'Step-Throughs'}</h4>
        {selectedTool === 'jsviz' ? (
          <ul>
            <li><strong>Interactive Execution:</strong> Run code step-by-step with visual feedback</li>
            <li><strong>Variable Tracking:</strong> See how variables change during execution</li>
            <li><strong>Modern Interface:</strong> Clean, modern JavaScript visualization tool (jsviz.klve.nl)</li>
            <li><strong>External Opening:</strong> "Open External" button opens the same tool in a new tab</li>
            <li><strong>Tool Selection:</strong> Switch between Python Tutor and JSViz using the dropdown</li>
          </ul>
        ) : (
          <ul>
            <li><strong>Step Through:</strong> Use the "Forward" and "Back" buttons to step through execution</li>
            <li><strong>Visualize Data:</strong> Watch variables change in the stack and heap visualization</li>
            <li><strong>Understand Flow:</strong> See how your code executes line by line</li>
            <li><strong>Debug:</strong> Identify where logic errors occur in your program</li>
            <li><strong>Multi-Language:</strong> Supports Python, JavaScript, Java, C, and C++</li>
            <li><strong>External Opening:</strong> "Open External" uses regular Python Tutor (not iframe-embed)</li>
            <li><strong>Tool Selection:</strong> Switch between Python Tutor and JSViz using the dropdown</li>
          </ul>
        )}
        <p><em>Note: Both tools work best with short, educational code snippets.</em></p>
      </div>
    </div>
  );
};

export default StepThroughsLens;