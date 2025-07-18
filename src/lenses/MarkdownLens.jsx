import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { useApp } from '../../shared/context/AppContext.jsx';
import { getCurrentContent } from '../../shared/utils/getCurrentContent.js';
import RunCode from '../../shared/components/RunCode.jsx';
import StepThroughModal from '../components/StepThroughModal.jsx';
import EmbeddedTrace from '../../shared/components/EmbeddedTrace.jsx';
import styles from './MarkdownLens.module.css';

// Import marked for robust markdown parsing
import { marked } from 'marked';
import { baseUrl } from 'marked-base-url';

// Import Prism.js for syntax highlighting
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/themes/prism-tomorrow.css'; // Dark theme to match editor

/**
 * Markdown Exercise Component - Renders markdown files as HTML
 */
const MarkdownExercise = ({ resource }) => {
  const { updateFileContent, trackStudyAction, virtualFS } = useApp();

  const [html, setHtml] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Interactive toolbar state
  const [showStepThroughModal, setShowStepThroughModal] = useState(false);
  const [selectedCodeBlock, setSelectedCodeBlock] = useState(null);

  // Panel management state
  const [activePanel, setActivePanel] = useState('none'); // 'none' | 'run' | 'trace'
  const [runCode, setRunCode] = useState('');
  const [runLanguage, setRunLanguage] = useState('javascript');
  const [tracedCode, setTracedCode] = useState('');
  const [tracedLanguage, setTracedLanguage] = useState('javascript');

  // Annotation state
  const [selectedTool, setSelectedTool] = useState('none');
  const [selectedColor, setSelectedColor] = useState('#ffeb3b');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState([]);
  const [drawingPaths, setDrawingPaths] = useState(resource.drawingPaths || []);

  const contentRef = useRef(null);
  const overlayRef = useRef(null);

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

  // Configure marked with base URL and custom renderer
  const configureMarked = useCallback(() => {
    const renderer = new marked.Renderer();

    // Configure base URL for assets
    marked.use(baseUrl('/19-07-2025/content-assets/'));

    // Configure marked options
    marked.setOptions({
      breaks: true,
      gfm: true,
    });

    // Custom code block renderer with toolbar placeholder
    renderer.code = (code, language) => {
      const lang = language || 'javascript';
      const codeId = `code-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      return `
        <div class="code-block-container" data-language="${lang}">
          <div class="code-toolbar-placeholder" data-code-id="${codeId}" data-lang="${lang}"></div>
          <pre class="line-numbers language-${lang}"><code id="${codeId}">${code.text}</code></pre>
        </div>
      `;
    };

    return renderer;
  }, []);

  // Add interactive toolbars to code blocks
  const addInteractiveToolbars = useCallback(() => {
    if (!contentRef.current) return;

    const toolbarPlaceholders = contentRef.current.querySelectorAll(
      '.code-toolbar-placeholder',
    );
    toolbarPlaceholders.forEach((placeholder) => {
      const codeId = placeholder.getAttribute('data-code-id');
      const language = placeholder.getAttribute('data-lang');
      const codeElement = document.getElementById(codeId);

      if (codeElement && !placeholder.querySelector('.code-toolbar')) {
        const code = codeElement.textContent || '';

        // Create toolbar
        const toolbar = document.createElement('div');
        toolbar.className = 'code-toolbar';

        // Run Code button
        const runButton = document.createElement('button');
        runButton.className = 'toolbar-button run-button';
        runButton.innerHTML = '▶️ Run';
        runButton.onclick = () => handleRunCode(code, language);

        // Trace button
        const traceButton = document.createElement('button');
        traceButton.className = 'toolbar-button trace-button';
        traceButton.innerHTML = '🔍 Trace';
        traceButton.onclick = () => handleTrace(code, language);

        // Step-Through button
        const stepButton = document.createElement('button');
        stepButton.className = 'toolbar-button step-button';
        stepButton.innerHTML = '👣 Step-Through';
        stepButton.onclick = () => handleStepThrough(code, language);

        toolbar.appendChild(runButton);
        toolbar.appendChild(traceButton);
        toolbar.appendChild(stepButton);

        placeholder.appendChild(toolbar);
      }
    });
  }, []);

  // Panel management functions
  const showRunPanel = useCallback((code, language) => {
    setRunCode(code);
    setRunLanguage(language);
    setActivePanel('run');
    trackStudyAction('markdown_run_code', resource, {
      language,
      codeLength: code.length,
    });
  }, [resource, trackStudyAction]);

  const showTracePanel = useCallback((code, language) => {
    setTracedCode(code);
    setTracedLanguage(language);
    setActivePanel('trace');
    trackStudyAction('markdown_trace_code', resource, {
      language,
      codeLength: code.length,
    });
  }, [resource, trackStudyAction]);

  const closePanels = useCallback(() => {
    setActivePanel('none');
  }, []);

  // Toolbar button handlers
  const handleRunCode = useCallback(
    (code, language) => {
      showRunPanel(code, language);
    },
    [showRunPanel],
  );

  const handleTrace = useCallback(
    (code, language) => {
      showTracePanel(code, language);
    },
    [showTracePanel],
  );

  const handleStepThrough = useCallback(
    (code, language) => {
      setSelectedCodeBlock({ code, language });
      setShowStepThroughModal(true);
      trackStudyAction('markdown_step_through', resource, {
        language,
        codeLength: code.length,
      });
    },
    [resource, trackStudyAction],
  );

  const handleAnnotate = useCallback(
    (codeId) => {
      // Toggle annotation mode for this code block
      console.log('Annotating code block:', codeId);
      trackStudyAction('markdown_annotate_code', resource, { codeId });
    },
    [resource, trackStudyAction],
  );

  // Process markdown using marked with custom renderer
  const processMarkdown = useCallback(
    async (content) => {
      try {
        // Step 1: Parse markdown with marked
        const renderer = configureMarked();
        const html = marked(content, { renderer });

        // Step 2: Apply Prism highlighting to code blocks
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        const codeBlocks = tempDiv.querySelectorAll('pre code');
        codeBlocks.forEach((block) => {
          const language = block.className.match(/language-(\w+)/)?.[1] || 'javascript';
          const code = block.textContent || '';

          // Map common language aliases
          const languageMap = {
            js: 'javascript',
            jsx: 'javascript',
            py: 'python',
            html: 'markup',
            xml: 'markup',
          };

          const prismLang = languageMap[language] || language;

          // Apply Prism highlighting if language is supported
          if (Prism.languages[prismLang]) {
            try {
              const highlighted = Prism.highlight(
                code,
                Prism.languages[prismLang],
                prismLang,
              );
              block.innerHTML = highlighted;
            } catch (error) {
              console.warn('Prism highlighting failed for language:', language, error);
            }
          }
        });

        return tempDiv.innerHTML;
      } catch (error) {
        console.error('Markdown processing failed:', error);
        return `<p>Error processing markdown: ${error.message}</p>`;
      }
    },
    [configureMarked],
  );

  useEffect(() => {
    if (!resource || !resource.content) {
      setHtml('');
      setIsLoading(false);
      return;
    }

    const renderMarkdown = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get current content from resource or editor
        const currentContent = getCurrentContent(resource, getFileEditor, '');
        const htmlContent = await processMarkdown(currentContent);
        setHtml(htmlContent);
        setIsLoading(false);

        // Post-process: Add interactive toolbars to code blocks
        setTimeout(() => {
          addInteractiveToolbars();
        }, 0);
      } catch (err) {
        console.error('Failed to render markdown:', err);
        setError(
          'Failed to render markdown: ' +
            (err instanceof Error ? err.message : 'Unknown error'),
        );
        setIsLoading(false);
      }
    };

    renderMarkdown();
  }, [resource, processMarkdown, addInteractiveToolbars, getFileEditor]);

  // Initialize drawing paths
  useEffect(() => {
    if (resource.drawingPaths) {
      setDrawingPaths(resource.drawingPaths);
    }
  }, [resource]);

  // Save drawing paths to resource
  const saveDrawingPaths = (newPaths) => {
    setDrawingPaths(newPaths);

    // Track the drawing action without triggering file content update
    trackStudyAction('markdown_draw', resource, {
      drawingPathsCount: newPaths.length,
    });
  };

  // Handle mouse events for drawing
  const handleMouseDown = (event) => {
    if (selectedTool === 'pen') {
      setIsDrawing(true);
      const rect = contentRef.current.getBoundingClientRect();
      const point = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      setCurrentStroke([point]);
    }
  };

  const handleMouseMove = (event) => {
    if (isDrawing && selectedTool === 'pen') {
      const rect = contentRef.current.getBoundingClientRect();
      const point = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      setCurrentStroke((prev) => [...prev, point]);
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && selectedTool === 'pen' && currentStroke.length > 1) {
      const newPath = {
        id: Date.now(),
        points: currentStroke,
        color: selectedColor,
        tool: 'pen',
        timestamp: Date.now(),
      };
      saveDrawingPaths([...drawingPaths, newPath]);
      setCurrentStroke([]);
    }
    setIsDrawing(false);
  };

  // Handle eraser functionality
  const handleErase = (event) => {
    if (selectedTool === 'eraser') {
      const rect = contentRef.current.getBoundingClientRect();
      const point = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };

      // Remove drawing paths that intersect with eraser
      const remainingPaths = drawingPaths.filter((path) => {
        return !path.points.some((pathPoint) => {
          const distance = Math.sqrt(
            Math.pow(pathPoint.x - point.x, 2) + Math.pow(pathPoint.y - point.y, 2),
          );
          return distance < 20; // Eraser radius
        });
      });

      if (remainingPaths.length !== drawingPaths.length) {
        saveDrawingPaths(remainingPaths);
      }
    }
  };

  // Clear all drawings
  const handleClearAll = () => {
    if (confirm('Clear all drawings? This cannot be undone.')) {
      saveDrawingPaths([]);
      trackStudyAction('markdown_drawings_cleared', resource);
    }
  };

  // Tool and color configurations
  const tools = [
    {
      id: 'none',
      name: 'Select',
      icon: '👆',
      description: 'Normal selection (no drawing)',
    },
    { id: 'pen', name: 'Pen', icon: '✏️', description: 'Draw freehand' },
    { id: 'eraser', name: 'Eraser', icon: '🧽', description: 'Erase drawings' },
  ];

  const colors = [
    { name: 'Yellow', value: '#ffeb3b' },
    { name: 'Green', value: '#4caf50' },
    { name: 'Blue', value: '#2196f3' },
    { name: 'Orange', value: '#ff9800' },
    { name: 'Pink', value: '#e91e63' },
    { name: 'Purple', value: '#9c27b0' },
  ];

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}>🔄</div>
          <p>Rendering markdown...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h3>❌ Markdown Rendering Error</h3>
          <p>{error}</p>
          <details>
            <summary>Raw Content</summary>
            <pre>{resource.content}</pre>
          </details>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.filename}>📄 {resource.name}</h2>
      </div>

      {/* Annotation Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolGroup}>
          <label className={styles.toolLabel}>Tools:</label>
          <div className={styles.tools}>
            {tools.map((tool) => (
              <button
                key={tool.id}
                className={`${styles.toolButton} ${selectedTool === tool.id ? styles.active : ''}`}
                onClick={() => setSelectedTool(tool.id)}
                title={tool.description}
              >
                {tool.icon} {tool.name}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.toolGroup}>
          <label className={styles.toolLabel}>Colors:</label>
          <div className={styles.colors}>
            {colors.map((color) => (
              <button
                key={color.value}
                className={`${styles.colorButton} ${selectedColor === color.value ? styles.active : ''}`}
                style={{ backgroundColor: color.value }}
                onClick={() => setSelectedColor(color.value)}
                title={color.name}
              />
            ))}
          </div>
        </div>

        <div className={styles.toolGroup}>
          <button
            className={`${styles.toolButton} ${activePanel === 'trace' ? styles.active : ''}`}
            onClick={() => setActivePanel(activePanel === 'trace' ? 'none' : 'trace')}
            title="Toggle trace panel"
          >
            🔍 Trace Panel
          </button>
          <button
            className={`${styles.toolButton} ${activePanel === 'run' ? styles.active : ''}`}
            onClick={() => setActivePanel(activePanel === 'run' ? 'none' : 'run')}
            title="Toggle run panel"
          >
            ▶️ Run Panel
          </button>
        </div>

        <div className={styles.toolGroup}>
          {drawingPaths.length > 0 && (
            <button
              className={`${styles.actionButton} ${styles.clearButton}`}
              onClick={handleClearAll}
            >
              🗑️ Clear All
            </button>
          )}
        </div>
      </div>

      {/* Single Panel Area */}
      {activePanel === 'run' && (
        <div className={styles.runPanel}>
          <div className={styles.panelHeader}>
            <h3>▶️ Run Code</h3>
            <button
              className={styles.panelClose}
              onClick={closePanels}
              title="Close run panel"
            >
              ✕
            </button>
          </div>
          <div className={styles.panelContent}>
            {runCode ? (
              <RunCode
                code={runCode}
                language={runLanguage}
                buttonText="Run Code"
                showOptions={true}
                onExecute={() => console.log('Code executed')}
                scopedCode={null}
              />
            ) : (
              <p className={styles.panelHint}>
                Click the "▶️ Run" button on any code block to run it here.
              </p>
            )}
          </div>
        </div>
      )}

      {activePanel === 'trace' && (
        <div className={styles.tracePanel}>
          <div className={styles.panelHeader}>
            <h3>🔍 Trace Code</h3>
            <button
              className={styles.panelClose}
              onClick={closePanels}
              title="Close trace panel"
            >
              ✕
            </button>
          </div>
          <div className={styles.panelContent}>
            {tracedCode ? (
              <EmbeddedTrace
                code={tracedCode}
                fileName={resource.name}
                scope={null}
                onTraceData={(data) => console.log('Trace data:', data)}
              />
            ) : (
              <p className={styles.panelHint}>
                Click the "🔍 Trace" button on any code block to trace it here.
              </p>
            )}
          </div>
        </div>
      )}

      <div className={styles.content}>
        <div
          className={styles.markdownContainer}
          ref={contentRef}
          onMouseDown={selectedTool !== 'none' ? handleMouseDown : undefined}
          onMouseMove={selectedTool !== 'none' ? handleMouseMove : undefined}
          onMouseUp={selectedTool !== 'none' ? handleMouseUp : undefined}
          onClick={selectedTool === 'eraser' ? handleErase : undefined}
          style={{
            cursor:
              selectedTool === 'pen'
                ? 'crosshair'
                : selectedTool === 'eraser'
                  ? 'grab'
                  : 'default',
          }}
        >
          <div className={styles.markdown} dangerouslySetInnerHTML={{ __html: html }} />

          {/* Drawing overlay */}
          <svg className={styles.drawingOverlay} ref={overlayRef}>
            {/* Existing drawing paths */}
            {drawingPaths.map((path) => (
              <polyline
                key={path.id}
                points={path.points.map((p) => `${p.x},${p.y}`).join(' ')}
                stroke={path.color}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}

            {/* Current stroke while drawing */}
            {currentStroke.length > 1 && (
              <polyline
                points={currentStroke.map((p) => `${p.x},${p.y}`).join(' ')}
                stroke={selectedColor}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.7"
              />
            )}
          </svg>
        </div>
      </div>

      {/* Step-Through Modal */}
      {showStepThroughModal && selectedCodeBlock && (
        <StepThroughModal
          isOpen={showStepThroughModal}
          onClose={() => setShowStepThroughModal(false)}
          code={selectedCodeBlock.code}
          fileName={resource.name}
          language={selectedCodeBlock.language}
        />
      )}
    </div>
  );
};

export default MarkdownExercise;
