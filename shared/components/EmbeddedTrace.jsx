import { useState, useRef, useEffect } from 'preact/hooks';
import { useColorize } from '../context/ColorizeContext.jsx';
import styles from './EmbeddedTrace.module.css';

/**
 * EmbeddedTrace - Compact trace functionality for embedding in study lenses
 * Uses SL1's trace system but in a smaller, integrated format
 */
const EmbeddedTrace = ({ code, fileName, onTraceData, scope }) => {
  const { enableColorize } = useColorize();
  const [isTracing, setIsTracing] = useState(false);
  const [traceLog, setTraceLog] = useState([]);
  const [showTraceTable, setShowTraceTable] = useState(false);
  const [showTraceConfig, setShowTraceConfig] = useState(false);
  const [showHoverTable, setShowHoverTable] = useState(false);
  const [showTablesDropdown, setShowTablesDropdown] = useState(false);
  const [hoverTableType, setHoverTableType] = useState('values');
  const traceTableContainerRef = useRef(null);
  const [traceConfig, setTraceConfig] = useState({
    variables: true,
    variablesDeclare: true,
    variablesRead: false,
    variablesAssign: true,
    operators: false,
    operatorsList: '',
    controlFlow: false,
    controlFlowList: '',
    controlFlowErrorHandling: false,
    functions: false,
    functionsList: '',
    this: false,
    lines: true,
    steps: true,
    console: true,
  });

  // Check if SL1 trace system is loaded (using trace-loader.js)
  const ensureTraceSystemLoaded = () => {
    return new Promise((resolve) => {
      if (window.trace && typeof window.trace === 'function') {
        resolve(true);
        return;
      }

      // Check if trace loader is available
      if (window.loadTraceSystem && typeof window.loadTraceSystem === 'function') {
        // Use the custom loader
        window.loadTraceSystem().then(resolve);
        return;
      }

      // Fallback: wait for system to load
      let attempts = 0;
      const maxAttempts = 15; // Give more time

      const checkAgain = () => {
        attempts++;
        if (window.trace && typeof window.trace === 'function') {
          resolve(true);
        } else if (window.traceSystemError) {
          console.error('Trace system failed to load:', window.traceSystemError);
          resolve(false);
        } else if (attempts < maxAttempts) {
          setTimeout(checkAgain, 300);
        } else {
          console.error('SL1 trace system not available after waiting');
          resolve(false);
        }
      };

      setTimeout(checkAgain, 100);
    });
  };

  // Override console.log to capture SL1 trace output
  const captureTraceOutput = (originalLog) => {
    return (...args) => {
      const message = args.join(' ');

      // Parse SL1 trace format: "%c 2. line 19:0 - didClickOk (declare, let)"
      if (
        message.includes('line ') &&
        (message.includes('declare') ||
          message.includes('assign') ||
          message.includes('read') ||
          message.includes('initialize') ||
          message.includes('call'))
      ) {
        // Extract step number, line info, and action from SL1 format
        const stepMatch = message.match(/(\d+)\./);
        const lineMatch = message.match(/line (\d+):(\d+)/);
        const actionMatch = message.match(/\(([^,)]+)/);

        // Debug: log the actual trace message format using original console.log
        // originalLog('🔍 Raw SL1 trace message:', message);

        // Extract variable name: looks for pattern "- variableName" or "- variableName: value"
        // SL1 format: "%c 2. line 19:0 - didClickOk (declare, let)" or "%c 2. line 19:0 - x: 5 (assign)"
        const variable = message.split(' - ')[1].split(' ')[1];
        // originalLog('🔍 Extracted variable:', variable);

        // Value extraction: check for colon after variable name
        // const hasColon = message.includes(':');
        const value = !message.includes(' (declare, ')
          ? message.split(':').pop()?.trim()
          : null;
        let hasValue = value !== null;

        // if (hasColon && variable) {
        //   // Look for "- variableName: value" pattern, value ends at space or parenthesis
        //   const valuePattern = new RegExp(`- ${variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:\\s*([^\s\(]+)`);
        //   const valueMatch = message.match(valuePattern);
        //   // originalLog('🔍 Value pattern:', valuePattern);
        //   // originalLog('🔍 Value match:', valueMatch);

        //   if (valueMatch) {
        //     value = valueMatch[1].trim();
        //     hasValue = true;
        //   }
        // }

        // originalLog('🔍 Final variable:', variable);
        // originalLog('🔍 Final value:', value);
        // originalLog('🔍 Has value:', hasValue);
        // originalLog('🔍 ---');

        const step = stepMatch ? parseInt(stepMatch[1]) : traceLog.length + 1;
        const line = lineMatch ? lineMatch[1] : '?';
        const col = lineMatch ? lineMatch[2] : '?';
        const action = actionMatch ? actionMatch[1] : 'execute';

        // Clean the message - remove %c formatting
        const cleanMessage = message.replace(/%c\s*/, '').trim();

        const entry = {
          step: step,
          line: parseInt(line),
          action: action,
          variable: variable,
          value: value,
          hasValue: hasValue,
          message: cleanMessage,
          timestamp: Date.now(),
        };

        setTraceLog((prev) => [...prev, entry]);
      }

      // Always call original log to maintain console output
      originalLog(...args);
    };
  };

  // No message handling needed - using SL1 trace system directly

  const runTrace = async () => {
    if (!code.trim()) return;

    setIsTracing(true);
    setTraceLog([]);

    try {
      // Check if trace system is available
      if (window.trace && typeof window.trace === 'function') {
        // Capture console output to intercept trace messages
        const originalConsoleLog = console.log;
        console.log = captureTraceOutput(originalConsoleLog);

        try {
          // Use SL1's trace function directly
          window.trace(code);
          // console.log('🔍 Trace execution completed successfully');
        } catch (error) {
          console.error('Trace execution error:', error);
          // Add error to trace log
          setTraceLog((prev) => [
            ...prev,
            {
              step: prev.length + 1,
              action: 'error',
              message: `Error: ${error.message}`,
              timestamp: Date.now(),
            },
          ]);
        }

        // Restore console.log after a delay
        setTimeout(() => {
          console.log = originalConsoleLog;
          setIsTracing(false);
        }, 2000);
      } else {
        // Try to load trace system
        // console.log('🔄 Loading SL1 trace system...');
        const traceSystemReady = await ensureTraceSystemLoaded();

        if (traceSystemReady && window.trace) {
          // Retry tracing
          runTrace();
          return;
        } else {
          console.error('❌ SL1 trace system failed to load');
          setTraceLog([
            {
              step: 1,
              action: 'error',
              message:
                'SL1 trace system not available. Check console for loading errors.',
              timestamp: Date.now(),
            },
          ]);
          setIsTracing(false);
        }
      }
    } catch (error) {
      console.error('Error setting up trace:', error);
      setTraceLog([
        {
          step: 1,
          action: 'error',
          message: `Setup error: ${error.message}`,
          timestamp: Date.now(),
        },
      ]);
      setIsTracing(false);
    }
  };

  const clearTrace = () => {
    setTraceLog([]);
    setShowTraceTable(false);
  };

  const toggleTraceTable = () => {
    setShowTraceTable(!showTraceTable);
  };

  const openTracePopup = () => {
    // Create popup window with code side-by-side with trace table
    const popup = window.open(
      '',
      'traceTable',
      'width=1200,height=700,scrollbars=yes,resizable=yes',
    );

    // Generate code content with optional Prism highlighting and line numbers
    const getCodeContent = () => {
      if (enableColorize) {
        return `<pre class="line-numbers"><code class="language-javascript">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
      } else {
        // Add line numbers manually when not using Prism
        const lines = code.split('\n');
        const numberedLines = lines
          .map(
            (line, index) =>
              `<span class="line-number">${String(index + 1).padStart(3, ' ')}</span><span class="line-content">${line.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>`,
          )
          .join('\n');
        return `<pre class="manual-line-numbers">${numberedLines}</pre>`;
      }
    };

    popup.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Trace Execution - ${fileName}</title>
        ${enableColorize ? '<link rel="stylesheet" href="/static/prism/style.css" />' : ''}
        <style>
          body { 
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; 
            margin: 0; 
            background: #1e1e1e; 
            color: #d4d4d4; 
            display: flex;
            height: 100vh;
          }
          .left-panel {
            width: 50%;
            padding: 20px;
            border-right: 1px solid #464647;
            overflow-y: auto;
          }
          .right-panel {
            width: 50%;
            padding: 20px;
            overflow-y: auto;
          }
          .header { 
            border-bottom: 1px solid #464647; 
            padding-bottom: 8px; 
            margin-bottom: 12px; 
          }
          .manual-line-numbers .line-number {
            display: inline-block;
            width: 3em;
            text-align: right;
            margin-right: 1em;
            color: #666;
            border-right: 1px solid #464647;
            padding-right: 0.5em;
            user-select: none;
          }
          .manual-line-numbers .line-content {
            white-space: pre;
          }
          .trace-table { 
            border-collapse: collapse; 
            width: 100%; 
            font-size: 11px;
          }
          .trace-table th, .trace-table td { 
            border: 1px solid #464647; 
            padding: 6px; 
            text-align: left; 
            vertical-align: top;
          }
          .trace-table th { background: #2d2d30; color: #9cdcfe; font-weight: 600; }
          .trace-row:nth-child(even) { background: #252526; }
          .trace-row:hover { background: #2d2d30; }
          .action-declare { color: #4fc3f7; font-weight: 600; }
          .action-assign { color: #f39c12; font-weight: 600; }
          .action-read { color: #27ae60; font-weight: 600; }
          .action-initialize { color: #9cdcfe; font-weight: 600; }
          .action-error { color: #e74c3c; font-weight: 600; }
          .variable { color: #9cdcfe; font-weight: 500; }
          .value { color: #ce9178; font-weight: 400; }
          .no-value { color: #ebebeba5; font-style: italic; opacity: 0.6; }
          
          /* Annotation styles */
          .annotation-toolbar {
            display: flex;
            gap: 2px;
            align-items: center;
            margin-top: 2px;
            padding: 2px;
            background: #252526;
            border-radius: 3px;
            border: 1px solid #464647;
          }
          .tool-btn {
            background: #383838;
            color: #d4d4d4;
            border: 1px solid #464647;
            padding: 2px 4px;
            border-radius: 2px;
            cursor: pointer;
            font-size: 10px;
          }
          .tool-btn:hover { background: #404040; }
          .tool-btn.active { background: #007acc; color: white; }
          .color-picker {
            background: #383838;
            color: #d4d4d4;
            border: 1px solid #464647;
            padding: 2px;
            border-radius: 2px;
            font-size: 10px;
          }
          .clear-btn {
            background: #d32f2f;
            color: white;
            border: 1px solid #b71c1c;
            padding: 2px 4px;
            border-radius: 2px;
            cursor: pointer;
            font-size: 10px;
          }
          .clear-btn:hover { background: #f44336; }
          
          .code-container-wrapper {
            position: relative;
            background: #252526;
            border: 1px solid #464647;
            border-radius: 4px;
            padding: 4px;
            font-size: 12px;
            line-height: 1.4;
            white-space: pre-wrap;
            overflow-x: auto;
          }
          .code-container {
            background: transparent;
            border: none;
            padding: 0;
            margin: 0;
            position: relative;
            z-index: 1;
          }
          .annotation-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 2;
          }
          .notes-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 3;
          }
          .note-annotation {
            position: absolute;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            max-width: 200px;
            border: 2px solid;
            pointer-events: auto;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          }
          .note-delete {
            position: absolute;
            top: -6px;
            right: -6px;
            background: #ff4444;
            color: white;
            border: none;
            border-radius: 50%;
            width: 16px;
            height: 16px;
            font-size: 10px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
          }
        </style>
        ${enableColorize ? '<script src="/static/prism/script.js"></script>' : ''}
      </head>
      <body>
        <div class="left-panel">
          <div class="header">
            <h2>📝 Code: ${fileName}</h2>
            <div class="annotation-toolbar">
              <button id="penTool" class="tool-btn active" title="Draw freehand">✏️</button>
              <button id="noteTool" class="tool-btn" title="Add text notes">📝</button>
              <button id="eraserTool" class="tool-btn" title="Erase drawings">🧽</button>
              <select id="colorPicker" class="color-picker">
                <option value="#ffeb3b">Yellow</option>
                <option value="#4caf50">Green</option>
                <option value="#2196f3">Blue</option>
                <option value="#ff9800">Orange</option>
                <option value="#e91e63">Pink</option>
              </select>
              <button id="clearAll" class="clear-btn" title="Clear all annotations">🗑️</button>
            </div>
          </div>
          <div class="code-container-wrapper">
            <div class="code-container">${getCodeContent()}</div>
            <svg class="annotation-overlay" id="annotationOverlay">
              <!-- Drawing paths will be added here -->
            </svg>
            <div class="notes-overlay" id="notesOverlay">
              <!-- Note annotations will be added here -->
            </div>
          </div>
        </div>
        <div class="right-panel">
          <div class="header">
            <h2>🔍 Trace Execution</h2>
            <p>Total steps: ${traceLog.length}</p>
          </div>
          <table class="trace-table">
            <thead>
              <tr>
                <th>Line</th>
                <th>Action</th>
                <th>Variable</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              ${traceLog
                .map(
                  (entry, index) => `
                <tr class="trace-row">
                  <td>${entry.line || '?'}</td>
                  <td class="action-${entry.action}">${entry.action}</td>
                  <td class="variable">${entry.variable || ''}</td>
                  <td class="value ${entry.hasValue ? '' : 'no-value'}">${entry.hasValue ? entry.value : '{no value}'}</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>
        </div>
        ${enableColorize ? '<script>if (window.Prism) { Prism.highlightAll(); }</script>' : ''}
        
        <script>
          // Basic annotation functionality
          let currentTool = 'pen';
          let currentColor = '#ffeb3b';
          let isDrawing = false;
          let currentStroke = [];
          let drawingPaths = [];
          let notes = [];
          
          const wrapper = document.querySelector('.code-container-wrapper');
          const overlay = document.getElementById('annotationOverlay');
          const notesOverlay = document.getElementById('notesOverlay');
          
          // Tool selection
          document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
              btn.classList.add('active');
              currentTool = btn.id.replace('Tool', '');
              
              // Update cursor based on tool
              if (currentTool === 'pen') {
                wrapper.style.cursor = 'crosshair';
              } else if (currentTool === 'eraser') {
                wrapper.style.cursor = 'grab';
              } else {
                wrapper.style.cursor = 'default';
              }
            });
          });
          
          // Color selection
          document.getElementById('colorPicker').addEventListener('change', (e) => {
            currentColor = e.target.value;
          });
          
          // Drawing functionality
          wrapper.addEventListener('mousedown', (e) => {
            if (currentTool === 'pen') {
              isDrawing = true;
              const rect = wrapper.getBoundingClientRect();
              const point = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
              };
              currentStroke = [point];
            } else if (currentTool === 'note') {
              const rect = wrapper.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              const text = prompt('Enter note text:');
              if (text) {
                addNote(x, y, text, currentColor);
              }
            }
          });
          
          wrapper.addEventListener('mousemove', (e) => {
            if (isDrawing && currentTool === 'pen') {
              const rect = wrapper.getBoundingClientRect();
              const point = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
              };
              currentStroke.push(point);
              drawCurrentStroke();
            }
          });
          
          wrapper.addEventListener('mouseup', () => {
            if (isDrawing && currentTool === 'pen' && currentStroke.length > 1) {
              drawingPaths.push({
                id: Date.now(),
                points: currentStroke,
                color: currentColor
              });
              currentStroke = [];
              redrawAll();
            }
            isDrawing = false;
          });
          
          function drawCurrentStroke() {
            if (currentStroke.length > 1) {
              const path = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
              path.setAttribute('points', currentStroke.map(p => \`\${p.x},\${p.y}\`).join(' '));
              path.setAttribute('stroke', currentColor);
              path.setAttribute('stroke-width', '2');
              path.setAttribute('fill', 'none');
              path.setAttribute('stroke-linecap', 'round');
              path.setAttribute('stroke-linejoin', 'round');
              path.setAttribute('opacity', '0.7');
              path.setAttribute('class', 'temp-stroke');
              
              // Remove previous temp stroke
              const tempStrokes = overlay.querySelectorAll('.temp-stroke');
              tempStrokes.forEach(s => s.remove());
              
              overlay.appendChild(path);
            }
          }
          
          function redrawAll() {
            overlay.innerHTML = '';
            drawingPaths.forEach(path => {
              const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
              polyline.setAttribute('points', path.points.map(p => \`\${p.x},\${p.y}\`).join(' '));
              polyline.setAttribute('stroke', path.color);
              polyline.setAttribute('stroke-width', '2');
              polyline.setAttribute('fill', 'none');
              polyline.setAttribute('stroke-linecap', 'round');
              polyline.setAttribute('stroke-linejoin', 'round');
              overlay.appendChild(polyline);
            });
          }
          
          function addNote(x, y, text, color) {
            const note = {
              id: Date.now(),
              x: x,
              y: y,
              text: text,
              color: color
            };
            notes.push(note);
            renderNote(note);
          }
          
          function renderNote(note) {
            const noteEl = document.createElement('div');
            noteEl.className = 'note-annotation';
            noteEl.style.left = note.x + 'px';
            noteEl.style.top = note.y + 'px';
            noteEl.style.borderColor = note.color;
            
            const content = document.createElement('div');
            content.textContent = note.text;
            noteEl.appendChild(content);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'note-delete';
            deleteBtn.textContent = '×';
            deleteBtn.onclick = () => deleteNote(note.id);
            noteEl.appendChild(deleteBtn);
            
            notesOverlay.appendChild(noteEl);
          }
          
          function deleteNote(noteId) {
            notes = notes.filter(n => n.id !== noteId);
            renderAllNotes();
          }
          
          function renderAllNotes() {
            notesOverlay.innerHTML = '';
            notes.forEach(note => renderNote(note));
          }
          
          // Clear all functionality
          document.getElementById('clearAll').addEventListener('click', () => {
            if (confirm('Clear all annotations? This cannot be undone.')) {
              drawingPaths = [];
              notes = [];
              overlay.innerHTML = '';
              notesOverlay.innerHTML = '';
            }
          });
          
          // Eraser functionality
          wrapper.addEventListener('click', (e) => {
            if (currentTool === 'eraser') {
              const rect = wrapper.getBoundingClientRect();
              const point = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
              };
              
              // Remove drawing paths that intersect with eraser
              drawingPaths = drawingPaths.filter(path => {
                return !path.points.some(pathPoint => {
                  const distance = Math.sqrt(
                    Math.pow(pathPoint.x - point.x, 2) + Math.pow(pathPoint.y - point.y, 2)
                  );
                  return distance < 20; // Eraser radius
                });
              });
              
              redrawAll();
            }
          });
          
          // Initialize
          wrapper.style.cursor = 'crosshair';
        </script>
      </body>
      </html>
    `);
    popup.document.close();
  };

  const handleConfigChange = (key, value) => {
    setTraceConfig((prev) => ({
      ...prev,
      [key]: value,
    }));

    // Update global trace config if available
    if (window.traceConfig) {
      window.traceConfig[key] = value;
    }
  };

  // Handle trace table creation and cleanup
  useEffect(() => {
    const container = traceTableContainerRef.current;
    if (!container || !showHoverTable) {
      return;
    }

    // Clear any existing trace table
    const existingTable = container.querySelector('trace-table');
    if (existingTable) {
      existingTable.remove();
    }

    // Create new trace table
    if (hoverTableType === 'steps') {
      container.innerHTML = '<trace-table steps></trace-table>';
    } else if (hoverTableType === 'operators') {
      container.innerHTML = '<trace-table operators></trace-table>';
    } else {
      container.innerHTML = '<trace-table></trace-table>';
    }

    // Fallback if web component doesn't work
    const fallbackTimer = setTimeout(() => {
      const traceTable = container.querySelector('trace-table');
      if (!traceTable || !traceTable.shadowRoot) {
        container.innerHTML = `<div style="padding: 20px; border: 1px solid #ccc; background: white; position: fixed; top: 50px; right: 20px; z-index: 1000;">
          <h4>🔥 SL1 ${hoverTableType} Table</h4>
          <p>Trace table component not available. The web component may not be loaded.</p>
          <button onclick="this.parentElement.style.display='none'">Close</button>
        </div>`;
      }
    }, 1000);

    // Cleanup function
    return () => {
      clearTimeout(fallbackTimer);
      if (container) {
        const tables = container.querySelectorAll('trace-table');
        tables.forEach((table) => table.remove());
        container.innerHTML = '';
      }
    };
  }, [showHoverTable, hoverTableType]);

  return (
    <div className={styles.embeddedTrace}>
      <div className={styles.traceControls}>
        <h4>
          🔍 Code Tracing
        </h4>
        <div className={styles.buttonGroup}>
          <button
            className={styles.traceButton}
            onClick={runTrace}
            disabled={isTracing || !code.trim()}
          >
            {isTracing ? '⏳ Tracing...' : '▶️ Run Trace'}
          </button>

          <div className={styles.dropdown}>
            <button
              className={styles.traceButton}
              onClick={() => setShowTraceConfig(!showTraceConfig)}
            >
              ⚙️ Options
            </button>
            {showTraceConfig && (
              <div className={styles.dropdownContent}>
                <div className={styles.configSection}>
                  <label>
                    <input
                      type="checkbox"
                      checked={traceConfig.variables}
                      onChange={(e) => handleConfigChange('variables', e.target.checked)}
                    />
                    Variables
                  </label>
                  <div className={styles.subOptions}>
                    <label>
                      <input
                        type="checkbox"
                        checked={traceConfig.variablesDeclare}
                        onChange={(e) =>
                          handleConfigChange('variablesDeclare', e.target.checked)
                        }
                      />
                      declare
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={traceConfig.variablesAssign}
                        onChange={(e) =>
                          handleConfigChange('variablesAssign', e.target.checked)
                        }
                      />
                      assign
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={traceConfig.variablesRead}
                        onChange={(e) =>
                          handleConfigChange('variablesRead', e.target.checked)
                        }
                      />
                      read
                    </label>
                    <div className={styles.textInput}>
                      <label>Specific variables:</label>
                      <input
                        type="text"
                        placeholder="e.g. x, y, counter"
                        value={traceConfig.variablesList || ''}
                        onChange={(e) =>
                          handleConfigChange('variablesList', e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.configSection}>
                  <label>
                    <input
                      type="checkbox"
                      checked={traceConfig.operators}
                      onChange={(e) => handleConfigChange('operators', e.target.checked)}
                    />
                    Operators
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={traceConfig.controlFlow}
                      onChange={(e) =>
                        handleConfigChange('controlFlow', e.target.checked)
                      }
                    />
                    Control flow
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={traceConfig.functions}
                      onChange={(e) => handleConfigChange('functions', e.target.checked)}
                    />
                    Function calls
                  </label>
                  <div className={styles.textInput}>
                    <label>Specific functions:</label>
                    <input
                      type="text"
                      placeholder="e.g. calculate, render"
                      value={traceConfig.functionsList || ''}
                      onChange={(e) =>
                        handleConfigChange('functionsList', e.target.value)
                      }
                    />
                  </div>
                  <label>
                    <input
                      type="checkbox"
                      checked={traceConfig.this}
                      onChange={(e) => handleConfigChange('this', e.target.checked)}
                    />
                    This keyword
                  </label>
                </div>

                <div className={styles.configSection}>
                  <label>
                    <input
                      type="checkbox"
                      checked={traceConfig.lines}
                      onChange={(e) => handleConfigChange('lines', e.target.checked)}
                    />
                    Line numbers
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={traceConfig.steps}
                      onChange={(e) => handleConfigChange('steps', e.target.checked)}
                    />
                    Step numbers
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={traceConfig.console}
                      onChange={(e) => handleConfigChange('console', e.target.checked)}
                    />
                    Console output
                  </label>
                </div>
              </div>
            )}
          </div>

          <button
            className={styles.traceButton}
            onClick={openTracePopup}
            disabled={traceLog.length === 0}
            title={
              traceLog.length === 0
                ? 'Run trace first to see data'
                : 'Open trace data in popup window'
            }
          >
            🪟 Popup Table
          </button>

          <button className={styles.traceButton} onClick={toggleTraceTable}>
            📊 {showTraceTable ? 'Hide' : 'Show'} ({traceLog.length})
          </button>

          <div className={styles.dropdown}>
            <button
              className={styles.traceButton}
              onClick={() => setShowTablesDropdown(!showTablesDropdown)}
              title="Show/hide trace table options"
            >
              🔥 Trace Tables {showTablesDropdown ? '▼' : '▶'}
            </button>
            {showTablesDropdown && (
              <div className={styles.dropdownContent}>
                <button
                  className={styles.dropdownItem}
                  onClick={() => {
                    setHoverTableType('steps');
                    setShowHoverTable(true);
                    setShowTablesDropdown(false);
                  }}
                >
                  👣 Steps Table
                </button>
                <button
                  className={styles.dropdownItem}
                  onClick={() => {
                    setHoverTableType('values');
                    setShowHoverTable(true);
                    setShowTablesDropdown(false);
                  }}
                >
                  📊 Values Table
                </button>
                <button
                  className={styles.dropdownItem}
                  onClick={() => {
                    setHoverTableType('operators');
                    setShowHoverTable(true);
                    setShowTablesDropdown(false);
                  }}
                >
                  ⚙️ Operators Table
                </button>
              </div>
            )}
          </div>
          <button
            className={styles.traceButton}
            onClick={clearTrace}
            disabled={traceLog.length === 0}
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      {showTraceTable && traceLog.length > 0 && (
        <div className={styles.traceTable}>
          <div className={styles.tableHeader}>
            <span>Step</span>
            <span>Action</span>
            <span>Trace Message</span>
          </div>
          <div className={styles.tableBody}>
            {traceLog.slice(-20).map((entry, index) => (
              <div key={index} className={styles.tableRow}>
                <span>{entry.step}</span>
                <span className={styles.action}>{entry.action}</span>
                <span className={styles.traceMessage}>{entry.message}</span>
              </div>
            ))}
          </div>
          {traceLog.length > 20 && (
            <div className={styles.tableFooter}>
              Showing last 20 of {traceLog.length} trace entries
            </div>
          )}
        </div>
      )}

      {/* SL1 Trace Tables - Direct insertion of web components */}
      {showHoverTable && <div ref={traceTableContainerRef} />}

      {/* Using SL1 trace system directly - no iframe needed */}
    </div>
  );
};

export default EmbeddedTrace;
