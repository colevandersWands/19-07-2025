import { useState, useRef, useEffect } from 'preact/hooks';
import { createTestingFramework } from '../utils/testingFramework.js';
import styles from './RunCode.module.css';

/**
 * RunCode Component - Executes JavaScript code in a sandboxed iframe
 * Based on SL1's run-it implementation but adapted for Preact
 */
const RunCode = ({ 
  code = '', 
  scopedCode = null, // Code from current selection scope
  buttonText = 'Run Code',
  onExecute = null,
  showOptions = true,
  language = 'javascript' // 'javascript', 'html', 'css'
}) => {
  const [config, setConfig] = useState({
    debug: false,
    type: 'script', // 'script' or 'module'
    testing: false, // Enable testing framework
    loopGuard: {
      active: false,
      max: 100
    }
  });
  
  const [isRunning, setIsRunning] = useState(false);
  const [showOptionsPanel, setShowOptionsPanel] = useState(false);
  const iframeContainerRef = useRef(null);
  
  // Clean up any existing iframes
  const cleanupIframes = () => {
    if (iframeContainerRef.current) {
      while (iframeContainerRef.current.firstChild) {
        iframeContainerRef.current.removeChild(iframeContainerRef.current.firstChild);
      }
    }
  };
  
  // Simple loop guard implementation (improved version)
  const addLoopGuard = (codeToGuard) => {
    if (!config.loopGuard.active) return codeToGuard;
    
    // Simple regex-based loop guard for basic cases
    // TODO: Implement full AST-based approach from SL1 for production
    let guardedCode = codeToGuard;
    let loopCount = 0;
    
    // Guard while loops - inject counter check
    guardedCode = guardedCode.replace(/while\s*\(([^)]+)\)/g, (match, condition) => {
      loopCount++;
      const guardVar = `loopGuard_${loopCount}`;
      return `let ${guardVar} = 0; while ((${condition}) && ++${guardVar} <= ${config.loopGuard.max})`;
    });
    
    // Guard for loops - inject counter check in condition
    guardedCode = guardedCode.replace(/for\s*\(([^;]*);([^;]*);([^)]*)\)/g, (match, init, condition, increment) => {
      loopCount++;
      const guardVar = `loopGuard_${loopCount}`;
      return `for (${init}, ${guardVar} = 0; (${condition || 'true'}) && ++${guardVar} <= ${config.loopGuard.max}; ${increment})`;
    });
    
    // Add error throwing when limit exceeded
    if (loopCount > 0) {
      guardedCode = `
// Loop Guard Protection (max ${config.loopGuard.max} iterations per loop)
const throwLoopError = () => { throw new Error('⚠️ Loop guard triggered! Loop exceeded ${config.loopGuard.max} iterations. This prevents infinite loops.'); };

${guardedCode}`;
    }
    
    return guardedCode;
  };
  
  // Execute code in iframe
  const runCode = async () => {
    // Use scoped code if available, otherwise whole file
    const codeToRun = scopedCode || code;
    
    if (!codeToRun.trim()) {
      console.warn('No code to execute');
      return;
    }
    
    // Handle different file types
    if (language === 'html' || codeToRun.trim().startsWith('<')) {
      runHTML(codeToRun);
      return;
    }
    
    if (language === 'css') {
      runCSS(codeToRun);
      return;
    }
    
    // Default to JavaScript execution
    runJavaScript(codeToRun);
  };
  
  // Run HTML content
  const runHTML = (htmlCode) => {
    setIsRunning(true);
    cleanupIframes();
    
    try {
      const iframe = document.createElement('iframe');
      iframe.style.cssText = `
        width: 100%;
        height: 400px;
        border: 1px solid #464647;
        background: white;
        border-radius: 4px;
      `;
      
      iframe.onload = () => {
        iframe.contentDocument.open();
        iframe.contentDocument.write(htmlCode);
        iframe.contentDocument.close();
        
        if (onExecute) {
          onExecute({ success: true, code: htmlCode, type: 'html' });
        }
      };
      
      iframe.src = 'about:blank';
      
      if (iframeContainerRef.current) {
        iframeContainerRef.current.appendChild(iframe);
      }
      
    } catch (error) {
      console.error('HTML execution error:', error);
      if (onExecute) {
        onExecute({ success: false, error: error.message, type: 'html' });
      }
    } finally {
      setIsRunning(false);
    }
  };
  
  // Run CSS (show preview with sample HTML)
  const runCSS = (cssCode) => {
    setIsRunning(true);
    cleanupIframes();
    
    try {
      const sampleHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            ${cssCode}
          </style>
        </head>
        <body>
          <h1>CSS Preview</h1>
          <p>This is a paragraph to demonstrate your CSS.</p>
          <div class="example">Sample div with class "example"</div>
          <button>Sample button</button>
          <ul>
            <li>List item 1</li>
            <li>List item 2</li>
          </ul>
        </body>
        </html>
      `;
      
      runHTML(sampleHTML);
      
      if (onExecute) {
        onExecute({ success: true, code: cssCode, type: 'css' });
      }
      
    } catch (error) {
      console.error('CSS execution error:', error);
      if (onExecute) {
        onExecute({ success: false, error: error.message, type: 'css' });
      }
    }
  };
  
  // Run JavaScript code
  const runJavaScript = async (jsCode) => {
    setIsRunning(true);
    cleanupIframes();
    
    try {
      // console.log('🚀 RunCode: Starting execution of:', jsCode.substring(0, 100) + '...'); // Remove app logging
      
      // Prepare code with optional modifications
      let finalCode = jsCode;
      
      if (config.loopGuard.active) {
        finalCode = addLoopGuard(finalCode);
      }
      
      if (config.debug) {
        finalCode = `debugger;\n\n${finalCode}\n\ndebugger;`;
      }
      
      // Create console output area FIRST
      const consoleOutput = document.createElement('div');
      consoleOutput.style.cssText = `
        font-family: Monaco, Menlo, 'Ubuntu Mono', monospace;
        font-size: 12px;
        color: #d4d4d4;
        background: #1e1e1e;
        padding: 10px;
        white-space: pre-wrap;
        max-height: 200px;
        overflow-y: auto;
        border: 1px solid #464647;
        margin-top: 5px;
        border-radius: 4px;
      `;
      consoleOutput.textContent = '📝 Code Output:\n';
      
      // Create iframe for execution
      const iframe = document.createElement('iframe');
      iframe.style.cssText = `
        width: 100%;
        height: 0px;
        border: none;
        display: none;
      `;
      
      // Add both to container immediately
      if (iframeContainerRef.current) {
        iframeContainerRef.current.appendChild(consoleOutput);
        iframeContainerRef.current.appendChild(iframe);
      }
      
      // Set up iframe load handler
      iframe.onload = () => {
        try {
          // console.log('🔧 RunCode: Iframe loaded, setting up execution environment'); // Remove app logging
          
          const iframeWindow = iframe.contentWindow;
          const iframeDocument = iframe.contentDocument;
          
          if (!iframeWindow || !iframeDocument) {
            throw new Error('Failed to access iframe window or document');
          }
          
          // Override console methods to capture output
          const originalConsole = iframeWindow.console;
          iframeWindow.console = {
            ...originalConsole,
            log: (...args) => {
              const output = args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
              ).join(' ');
              consoleOutput.textContent += output + '\n';
              originalConsole.log(...args);
            },
            error: (...args) => {
              const output = 'ERROR: ' + args.map(arg => String(arg)).join(' ');
              consoleOutput.textContent += output + '\n';
              consoleOutput.style.color = '#f14c4c';
              originalConsole.error(...args);
            },
            warn: (...args) => {
              const output = 'WARN: ' + args.map(arg => String(arg)).join(' ');
              consoleOutput.textContent += output + '\n';
              originalConsole.warn(...args);
            }
          };

          // Initialize testing framework if enabled (after console override)
          if (config.testing) {
            createTestingFramework(iframeWindow);
          }
          
          // Add global error handling
          iframeWindow.addEventListener('error', (event) => {
            // Check for common testing framework errors
            if (event.message.includes('describe is not defined') || 
                event.message.includes('it is not defined') || 
                event.message.includes('expect is not defined')) {
              
              const helpMsg = `💡 TESTING FRAMEWORK ERROR

It looks like you're trying to use unit tests (describe, it, expect) but the "Unit Tests" option is not enabled.

To fix this:
1. Click the "⚙️ Options" button below the Run Code button
2. Check the "Testing Framework" checkbox
3. Try running your code again

Your testing functions will then be available!`;
              
              consoleOutput.textContent += helpMsg + '\n\n';
              consoleOutput.style.color = '#f39c12'; // Orange for helpful warnings
            } else {
              const errorMsg = `ERROR: ${event.message} (Line: ${event.lineno})`;
              consoleOutput.textContent += errorMsg + '\n';
              consoleOutput.style.color = '#f14c4c';
            }
            console.error('RunCode iframe error:', event);
          });
          
          // Create and execute script
          const script = document.createElement('script');
          script.textContent = finalCode;
          
          if (config.type === 'module') {
            script.type = 'module';
          }
          
          // Execute the script
          iframeDocument.body.appendChild(script);
          // console.log('✅ RunCode: Script executed successfully'); // Remove app logging
          
          // Call onExecute callback if provided
          if (onExecute) {
            onExecute({ success: true, code: finalCode, type: 'javascript' });
          }
          
        } catch (error) {
          console.error('❌ RunCode execution error:', error);
          consoleOutput.textContent += `EXECUTION ERROR: ${error.message}\n`;
          consoleOutput.style.color = '#f14c4c';
          
          if (onExecute) {
            onExecute({ success: false, error: error.message, type: 'javascript' });
          }
        }
      };
      
      // Set iframe error handler
      iframe.onerror = (error) => {
        console.error('❌ RunCode iframe error:', error);
        consoleOutput.textContent += `IFRAME ERROR: ${error}\n`;
        consoleOutput.style.color = '#f14c4c';
      };
      
      // Load empty page in iframe
      iframe.src = 'about:blank';
      
    } catch (error) {
      console.error('❌ RunCode setup error:', error);
      if (onExecute) {
        onExecute({ success: false, error: error.message, type: 'javascript' });
      }
    } finally {
      setTimeout(() => setIsRunning(false), 100); // Small delay to see the running state
    }
  };
  
  const handleConfigChange = (key, value) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const handleLoopGuardChange = (key, value) => {
    setConfig(prev => ({
      ...prev,
      loopGuard: {
        ...prev.loopGuard,
        [key]: value
      }
    }));
  };
  
  return (
    <div className={styles.runCodeContainer}>
      <div className={styles.buttonContainer}>
        <button 
          className={styles.runButton}
          onClick={runCode}
          disabled={isRunning || !(scopedCode || code).trim()}
        >
          {isRunning ? '🔄 Running...' : `▶️ ${buttonText}`}
        </button>
        
        {showOptions && (
          <div className={styles.optionsContainer}>
            <button 
              className={styles.optionsButton}
              onClick={() => setShowOptionsPanel(!showOptionsPanel)}
            >
              ⚙️ Options
            </button>
            
            {showOptionsPanel && (
              <div className={styles.optionsPanel}>
                <label>
                  <input 
                    type="checkbox" 
                    checked={config.debug}
                    onChange={(e) => handleConfigChange('debug', e.target.checked)}
                  />
                  Debug Mode
                </label>
                
                <label>
                  <input 
                    type="checkbox" 
                    checked={config.type === 'module'}
                    onChange={(e) => handleConfigChange('type', e.target.checked ? 'module' : 'script')}
                  />
                  ES Module
                </label>
                
                <label>
                  <input 
                    type="checkbox" 
                    checked={config.testing}
                    onChange={(e) => handleConfigChange('testing', e.target.checked)}
                  />
                  Testing Framework
                </label>
                
                <label>
                  <input 
                    type="checkbox" 
                    checked={config.loopGuard.active}
                    onChange={(e) => handleLoopGuardChange('active', e.target.checked)}
                  />
                  Loop Guard
                </label>
                
                {config.loopGuard.active && (
                  <label>
                    Max Iterations:
                    <input 
                      type="number" 
                      value={config.loopGuard.max}
                      onChange={(e) => handleLoopGuardChange('max', parseInt(e.target.value) || 100)}
                      min="1"
                      max="10000"
                      className={styles.numberInput}
                    />
                  </label>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Container for iframe and console output */}
      <div ref={iframeContainerRef} className={styles.executionContainer}></div>
    </div>
  );
};

export default RunCode;