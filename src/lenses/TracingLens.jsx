import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { useColorize } from '../../shared/context/ColorizeContext.jsx';
import { useApp } from '../../shared/context/AppContext.jsx';
import { getCurrentContent } from '../../shared/utils/getCurrentContent.js';
import styles from './TracingLens.module.css';

/**
 * TracingLens - Interactive code tracing using SL1's proven trace library
 * Uses Aran instrumentation for deep code analysis
 * NO CONSOLE OUTPUT UI - trace logs directly to devtools console
 * PRESERVES SL1 trace table layouts - custom-designed for beginner JS learners
 */
const TracingLens = ({ resource }) => {
  const fileName = resource?.name || '';
  const { enableColorize } = useColorize();
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

  const [isTracing, setIsTracing] = useState(false);
  const [traceTableVisible, setTraceTableVisible] = useState(false);
  const iframeRef = useRef(null);
  const traceContainerRef = useRef(null);

  // Create the trace HTML content using SL1's proven approach
  const createTraceHTML = (sourceCode) => {
    const prismCSS = enableColorize
      ? '<link rel="stylesheet" href="/static/prism/style.css">'
      : '';
    return `<!DOCTYPE html>
<html>
<head>
    ${prismCSS}
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        margin: 0;
        padding: 20px;
        background: #1e1e1e;
        color: #d4d4d4;
      }
      .trace-controls {
        margin-bottom: 20px;
        padding: 15px;
        background: #252526;
        border-radius: 6px;
        border: 1px solid #464647;
      }
      .trace-button {
        background: #007acc;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        margin-right: 10px;
        font-size: 14px;
      }
      .trace-button:hover {
        background: #005a9e;
      }
      .trace-button:disabled {
        background: #464647;
        cursor: not-allowed;
      }
      .code-display {
        background: #2d2d30;
        border-radius: 6px;
        overflow: hidden;
        border: 1px solid #464647;
      }
      pre {
        margin: 0;
        font-size: 14px;
        line-height: 1.4;
      }
      .instructions {
        margin-top: 20px;
        padding: 15px;
        background: #252526;
        border-radius: 6px;
        border: 1px solid #464647;
      }
      .instructions h4 {
        margin-top: 0;
        color: #4fc3f7;
      }
      .instructions ul {
        margin: 10px 0;
        padding-left: 20px;
      }
      .instructions li {
        margin: 8px 0;
        line-height: 1.5;
      }
      .instructions strong {
        color: #4fc3f7;
      }
    </style>
</head>
<body>
    <div class="trace-controls">
        <button class="trace-button" onclick="runTrace()">🔍 Run Trace</button>
        <button class="trace-button" onclick="showTraceTable()">📊 Show Trace Table</button>
        <button class="trace-button" onclick="clearTrace()">🗑️ Clear Trace</button>
    </div>

    <trace-table-button></trace-table-button>

    <div class="code-display">
        <pre class="${enableColorize ? 'language-js' : ''}"><code class="${enableColorize ? 'language-js line-numbers' : ''}">${sourceCode}</code></pre>
    </div>

    <div class="instructions">
        <h4>🎯 How to Use Tracing</h4>
        <ul>
            <li><strong>Run Trace:</strong> Execute code with full instrumentation</li>
            <li><strong>Show Trace Table:</strong> Open the interactive trace table</li>
            <li><strong>Check Console:</strong> All trace output goes to browser DevTools</li>
            <li><strong>Drag Tables:</strong> Double-click to enable dragging, single-click to disable</li>
            <li><strong>Variable Tracking:</strong> See all variable changes step-by-step</li>
        </ul>
    </div>

    ${enableColorize ? '<script src="/static/prism/script.js"></script>' : ''}
    <script src="/static/aran-build.js"></script>
    
    <script src="/static/parsonizer/jquery.min.js"></script>
    <script src="/static/parsonizer/jquery-ui.min.js"></script>
    <script src="/static/wc-trace-table/configurable-button.js" type="module"></script>
    <script src="/static/wc-trace-table/index.js" type="module"></script>
    
    <script id="trace" async type="module" src="/static/index.js"></script>

    <script>
        let traceReady = false;
        
        // Wait for trace script to load
        const traceScript = document.getElementById('trace');
        if (traceScript) {
            traceScript.addEventListener('load', () => {
                traceReady = true;
            });
        }
        
        // Also check if trace is already available
        if (window.trace) {
            traceReady = true;
        }

        function runTrace() {
            if (!traceReady) {
                console.warn('⚠️ Trace system not ready yet');
                return;
            }
            
            console.clear();
            
            try {
                window.trace(decodeURI("${encodeURI(sourceCode)}"));
            } catch (error) {
                console.error('❌ Trace execution error:', error);
            }
        }

        function showTraceTable() {
            const existingTable = document.querySelector('trace-table');
            if (existingTable) {
                existingTable.remove();
            }
            
            const traceTable = document.createElement('trace-table');
            document.body.appendChild(traceTable);
            
        }

        function clearTrace() {
            console.clear();
            
            const existingTable = document.querySelector('trace-table');
            if (existingTable) {
                existingTable.remove();
            }
        }

        // Auto-run trace on load if code is simple enough
        window.addEventListener('load', () => {
            const codeLines = decodeURI("${encodeURI(sourceCode)}").split('\\n').filter(line => line.trim()).length;
            if (codeLines <= 10) {
                setTimeout(() => {
                    runTrace();
                }, 1000);
            }
        });
    </script>
</body>
</html>`;
  };

  // Handle iframe creation and content
  useEffect(() => {
    if (!code.trim()) return;

    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.background = '#1e1e1e';

    iframe.onload = () => {
      const traceHTML = createTraceHTML(code);
      iframe.contentDocument.open();
      iframe.contentDocument.write(traceHTML);
      iframe.contentDocument.close();
    };

    iframe.src = 'about:blank';

    if (traceContainerRef.current) {
      // Clear existing content
      traceContainerRef.current.innerHTML = '';
      traceContainerRef.current.appendChild(iframe);
    }

    iframeRef.current = iframe;

    // Cleanup
    return () => {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    };
  }, [code, enableColorize]);

  if (!code.trim()) {
    return (
      <div className={styles.tracingLens}>
        <div className={styles.header}>
          <h3>🔍 Code Tracing</h3>
          <span className={styles.subtitle}>Using SL1's proven trace library</span>
        </div>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📝</div>
          <h3>No Code to Trace</h3>
          <p>Select a JavaScript file to start tracing code execution</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.tracingLens}>
      <div className={styles.header}>
        <h3>🔍 Code Tracing</h3>
        {fileName && <span className={styles.fileName}>{fileName}</span>}
        <span className={styles.subtitle}>Using SL1's proven trace library</span>
      </div>

      <div className={styles.traceContainer} ref={traceContainerRef}>
        {/* Iframe content will be inserted here */}
      </div>

      <div className={styles.instructions}>
        <h4>🎯 About Code Tracing</h4>
        <ul>
          <li>
            <strong>Full instrumentation:</strong> Uses Aran to analyze every line of code
          </li>
          <li>
            <strong>DevTools integration:</strong> All output goes to browser console
          </li>
          <li>
            <strong>Interactive tables:</strong> Custom-designed for beginner JS learners
          </li>
          <li>
            <strong>Variable tracking:</strong> See how variables change during execution
          </li>
          <li>
            <strong>Proven system:</strong> Battle-tested with students and educators
          </li>
        </ul>
      </div>
    </div>
  );
};

export default TracingLens;
