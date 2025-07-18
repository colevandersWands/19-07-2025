import { useState, useRef, useEffect, useCallback } from 'preact/hooks';
import { useApp } from '../../shared/context/AppContext.jsx';
import { useColorize } from '../../shared/context/ColorizeContext.jsx';
import { getCurrentContent } from '../../shared/utils/getCurrentContent.js';
import CodeBlock, { InlineCode } from '../../shared/components/CodeBlock.jsx';
import EmbeddedTrace from '../../shared/components/EmbeddedTrace.jsx';
import { convertCodeToSvg, convertCodeToFlowTree } from 'js2flowchart';
import styles from './HighlightLens.module.css';

/**
 * Highlight Exercise - Syntax highlighted code viewing with annotation tools
 */
const HighlightExercise = ({ resource }) => {
  const { updateFileContent, trackStudyAction, virtualFS } = useApp();
  const { enableColorize } = useColorize();
  
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
  const getCurrentCode = useCallback(() => {
    return getCurrentContent(resource, getFileEditor, '');
  }, [resource, getFileEditor]);
  
  // View mode state (needs to be declared first)
  const [viewMode, setViewMode] = useState('code'); // 'code' or 'flowchart'
  
  // Annotation state
  const [selectedTool, setSelectedTool] = useState('highlight');
  const [selectedColor, setSelectedColor] = useState('#ffeb3b');
  const [isDrawing, setIsDrawing] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [notePosition, setNotePosition] = useState({ x: 0, y: 0 });
  const [noteText, setNoteText] = useState('');
  const [currentStroke, setCurrentStroke] = useState([]);
  const [prismLoaded, setPrismLoaded] = useState(!!window.Prism);
  
  // Separate annotation states for each view mode
  const [codeAnnotations, setCodeAnnotations] = useState(resource.codeAnnotations || []);
  const [codeDrawingPaths, setCodeDrawingPaths] = useState(resource.codeDrawingPaths || []);
  const [flowchartAnnotations, setFlowchartAnnotations] = useState(resource.flowchartAnnotations || []);
  const [flowchartDrawingPaths, setFlowchartDrawingPaths] = useState(resource.flowchartDrawingPaths || []);
  
  // Current view annotations (computed based on viewMode)
  const annotations = viewMode === 'code' ? codeAnnotations : flowchartAnnotations;
  const drawingPaths = viewMode === 'code' ? codeDrawingPaths : flowchartDrawingPaths;
  
  // Flowchart-specific state
  const [flowchartSvg, setFlowchartSvg] = useState('');
  const [flowchartError, setFlowchartError] = useState(null);
  const [flowchartLoading, setFlowchartLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [astInfo, setAstInfo] = useState(null);
  
  const codeRef = useRef(null);
  const overlayRef = useRef(null);
  const svgContainerRef = useRef(null);
  
  // Initialize annotations from resource
  useEffect(() => {
    if (resource.codeAnnotations) {
      setCodeAnnotations(resource.codeAnnotations);
    }
    if (resource.codeDrawingPaths) {
      setCodeDrawingPaths(resource.codeDrawingPaths);
    }
    if (resource.flowchartAnnotations) {
      setFlowchartAnnotations(resource.flowchartAnnotations);
    }
    if (resource.flowchartDrawingPaths) {
      setFlowchartDrawingPaths(resource.flowchartDrawingPaths);
    }
    
    // Handle legacy annotations (migrate to code view if they exist)
    if (resource.annotations && !resource.codeAnnotations) {
      setCodeAnnotations(resource.annotations);
    }
    if (resource.drawingPaths && !resource.codeDrawingPaths) {
      setCodeDrawingPaths(resource.drawingPaths);
    }
  }, [resource]);

  // Listen for Prism loading
  useEffect(() => {
    const handlePrismLoaded = () => {
      Prism = window.Prism;
      setPrismLoaded(true);
    };
    
    window.addEventListener('prismLoaded', handlePrismLoaded);
    
    return () => {
      window.removeEventListener('prismLoaded', handlePrismLoaded);
    };
  }, []);

  // Conditionally load Prism based on colorize setting
  useEffect(() => {
    if (enableColorize) {
      // Load Prism CSS
      if (!document.querySelector('link[href*="prism"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/static/prism/style.css';
        document.head.appendChild(link);
      }
      
      // Load Prism JS
      if (!window.Prism) {
        const script = document.createElement('script');
        script.src = '/static/prism/script.js';
        script.onload = () => {
          setPrismLoaded(true);
          // Trigger re-render when Prism loads
          setTimeout(() => {
            if (window.Prism) {
              window.dispatchEvent(new CustomEvent('prismLoaded'));
            }
          }, 100);
        };
        document.head.appendChild(script);
      } else {
        setPrismLoaded(true);
      }
    } else {
      // Disable Prism highlighting when colorize is disabled
      setPrismLoaded(false);
    }
  }, [enableColorize]);
  
  // Generate flowchart from code
  const generateFlowchart = async (sourceCode) => {
    if (!sourceCode.trim()) {
      setFlowchartSvg('');
      setFlowchartError(null);
      return;
    }

    setFlowchartLoading(true);
    setFlowchartError(null);

    try {
      // Generate flowchart tree with full AST analysis
      const flowTree = convertCodeToFlowTree(sourceCode, {
        maxDepth: 50,
        isDebug: false
      });

      // Convert flow tree to SVG
      const svg = convertCodeToSvg(sourceCode, {
        maxDepth: 50,
        isDebug: false,
      });

      setFlowchartSvg(svg);
      setAstInfo(flowTree);

      // Make flowchart nodes clickable
      setTimeout(() => {
        enhanceFlowchartInteractivity();
      }, 100);

    } catch (err) {
      console.error('Flowchart generation error:', err);
      setFlowchartError(`Failed to generate flowchart: ${err.message}`);
      setFlowchartSvg('');
    } finally {
      setFlowchartLoading(false);
    }
  };

  // Enhance flowchart with click handlers and highlighting
  const enhanceFlowchartInteractivity = () => {
    if (!svgContainerRef.current) return;

    const svgElement = svgContainerRef.current.querySelector('svg');
    if (!svgElement) return;

    // Add click handlers to flowchart nodes
    const nodes = svgElement.querySelectorAll('g[data-node-id], rect, circle, polygon');
    
    nodes.forEach((node, index) => {
      // Add hover effects
      node.style.cursor = 'pointer';
      node.addEventListener('mouseenter', () => {
        node.style.opacity = '0.8';
        node.style.filter = 'brightness(1.2)';
      });
      
      node.addEventListener('mouseleave', () => {
        if (selectedNode !== node) {
          node.style.opacity = '1';
          node.style.filter = 'none';
        }
      });

      // Add click handlers
      node.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Clear previous selection
        if (selectedNode) {
          selectedNode.style.outline = 'none';
          selectedNode.style.filter = 'none';
        }

        // Highlight selected node
        node.style.outline = '3px solid #007acc';
        node.style.filter = 'brightness(1.3)';
        setSelectedNode(node);

        console.log('Flowchart node selected:', node);
      });
    });
  };

  // Generate flowchart when switching to flowchart mode
  useEffect(() => {
    if (viewMode === 'flowchart') {
      const currentCode = getCurrentCode();
      generateFlowchart(currentCode);
    }
  }, [viewMode, getCurrentCode]);

  // Toggle between code and flowchart view
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'code' ? 'flowchart' : 'code');
  };
  
  // Save annotations to resource
  const saveAnnotations = (newAnnotations) => {
    if (viewMode === 'code') {
      setCodeAnnotations(newAnnotations);
    } else {
      setFlowchartAnnotations(newAnnotations);
    }
    
    // Save annotations to the resource
    const updatedResource = {
      ...resource,
      codeAnnotations: viewMode === 'code' ? newAnnotations : codeAnnotations,
      flowchartAnnotations: viewMode === 'flowchart' ? newAnnotations : flowchartAnnotations,
      codeDrawingPaths: codeDrawingPaths,
      flowchartDrawingPaths: flowchartDrawingPaths
    };
    
    // Don't call updateFileContent for annotations - this causes unnecessary remounting
    // updateFileContent(resource.path, resource.content);
    
    trackStudyAction('code_annotate', resource, {
      annotationType: selectedTool,
      annotationsCount: newAnnotations.length,
      drawingPathsCount: drawingPaths.length,
      viewMode: viewMode
    });
  };

  // Save drawing paths to resource
  const saveDrawingPaths = (newPaths) => {
    if (viewMode === 'code') {
      setCodeDrawingPaths(newPaths);
    } else {
      setFlowchartDrawingPaths(newPaths);
    }
    
    // Update resource with drawing paths
    const updatedResource = {
      ...resource,
      codeAnnotations: codeAnnotations,
      flowchartAnnotations: flowchartAnnotations,
      codeDrawingPaths: viewMode === 'code' ? newPaths : codeDrawingPaths,
      flowchartDrawingPaths: viewMode === 'flowchart' ? newPaths : flowchartDrawingPaths
    };
    
    // Don't call updateFileContent for drawing paths - this causes unnecessary remounting
    // updateFileContent(resource.path, resource.content);
    
    trackStudyAction('code_draw', resource, {
      drawingPathsCount: newPaths.length,
      viewMode: viewMode
    });
  };
  
  // Handle mouse events for drawing and annotations
  const handleMouseDown = (event) => {
    if (selectedTool === 'pen') {
      setIsDrawing(true);
      const rect = codeRef.current.getBoundingClientRect();
      const point = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
      setCurrentStroke([point]);
    } else if (selectedTool === 'note') {
      const rect = codeRef.current.getBoundingClientRect();
      setNotePosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      });
      setShowNoteInput(true);
      setNoteText('');
    }
  };

  const handleMouseMove = (event) => {
    if (isDrawing && selectedTool === 'pen') {
      const rect = codeRef.current.getBoundingClientRect();
      const point = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
      setCurrentStroke(prev => [...prev, point]);
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && selectedTool === 'pen' && currentStroke.length > 1) {
      const newPath = {
        id: Date.now(),
        points: currentStroke,
        color: selectedColor,
        tool: 'pen',
        timestamp: Date.now()
      };
      saveDrawingPaths([...drawingPaths, newPath]);
      setCurrentStroke([]);
    }
    setIsDrawing(false);
  };

  // Handle eraser functionality
  const handleErase = (event) => {
    if (selectedTool === 'eraser') {
      const rect = codeRef.current.getBoundingClientRect();
      const point = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
      
      // Remove drawing paths that intersect with eraser
      const remainingPaths = drawingPaths.filter(path => {
        return !path.points.some(pathPoint => {
          const distance = Math.sqrt(
            Math.pow(pathPoint.x - point.x, 2) + Math.pow(pathPoint.y - point.y, 2)
          );
          return distance < 20; // Eraser radius
        });
      });
      
      if (remainingPaths.length !== drawingPaths.length) {
        saveDrawingPaths(remainingPaths);
      }
    }
  };
  
  // Handle line highlighting
  const handleLineHighlight = (lineNumber) => {
    if (selectedTool === 'highlight') {
      const newAnnotation = {
        id: Date.now(),
        type: 'highlight',
        lineNumber,
        color: selectedColor,
        timestamp: Date.now()
      };
      
      saveAnnotations([...annotations, newAnnotation]);
    }
  };
  
  // Handle note creation
  const handleCreateNote = () => {
    if (noteText.trim()) {
      const newAnnotation = {
        id: Date.now(),
        type: 'note',
        text: noteText.trim(),
        position: notePosition,
        color: selectedColor,
        timestamp: Date.now()
      };
      
      saveAnnotations([...annotations, newAnnotation]);
    }
    
    setShowNoteInput(false);
    setNoteText('');
  };
  
  // Handle annotation deletion
  const handleDeleteAnnotation = (annotationId) => {
    const updatedAnnotations = annotations.filter(ann => ann.id !== annotationId);
    saveAnnotations(updatedAnnotations);
  };
  
  // Clear all annotations and drawings for current view
  const handleClearAll = () => {
    const viewName = viewMode === 'code' ? 'code' : 'flowchart';
    if (confirm(`Clear all annotations and drawings from ${viewName} view? This cannot be undone.`)) {
      saveAnnotations([]);
      saveDrawingPaths([]);
      trackStudyAction('annotations_cleared', resource, { viewMode: viewMode });
    }
  };
  
  // Copy code to clipboard
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(getCurrentCode());
      trackStudyAction('code_copy', resource);
      // TODO: Show toast notification
      console.log('Code copied to clipboard');
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };
  
  // Get language for Prism
  const getLanguageForFile = (filename, lang) => {
    if (lang) return lang.replace('.', '');
    
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap = {
      'js': 'javascript',
      'jsx': 'jsx', 
      'ts': 'typescript',
      'tsx': 'tsx',
      'py': 'python',
      'html': 'markup',
      'css': 'css',
      'json': 'json',
      'md': 'markdown',
      'sh': 'bash',
      'yml': 'yaml',
      'yaml': 'yaml'
    };
    
    return langMap[ext] || 'javascript';
  };

  // Render code with syntax highlighting
  const renderCodeWithSyntaxHighlighting = (content) => {
    const prismLang = getLanguageForFile(resource.name, resource.lang);
    
    return (
      <div className={styles.codeWrapper}>
        <CodeBlock 
          language={prismLang} 
          className={`${styles.syntaxHighlightedCode} line-numbers`}
        >
          {content}
        </CodeBlock>
        
        {/* Annotation overlay */}
        <div className={styles.annotationOverlay}>
          {content.split('\n').map((line, index) => {
            const lineNumber = index + 1;
            const lineAnnotations = annotations.filter(ann => 
              ann.type === 'highlight' && ann.lineNumber === lineNumber
            );
            
            const highlightStyle = lineAnnotations.length > 0 ? {
              backgroundColor: lineAnnotations[0].color + '40', // Add transparency
              borderLeft: `3px solid ${lineAnnotations[0].color}`
            } : {};
            
            return (
              <div 
                key={lineNumber}
                className={styles.annotationLine}
                style={highlightStyle}
                onClick={() => handleLineHighlight(lineNumber)}
              />
            );
          })}
        </div>
      </div>
    );
  };

  // Render flowchart
  const renderFlowchart = () => {
    if (flowchartLoading) {
      return (
        <div className={styles.flowchartLoading}>
          <div className={styles.loadingIcon}>⚙️</div>
          <p>Generating flowchart...</p>
        </div>
      );
    }

    if (flowchartError) {
      return (
        <div className={styles.flowchartError}>
          <div className={styles.errorIcon}>❌</div>
          <p>{flowchartError}</p>
          <button 
            className={styles.retryButton}
            onClick={() => generateFlowchart(getCurrentCode())}
          >
            🔄 Retry
          </button>
        </div>
      );
    }

    if (!flowchartSvg) {
      return (
        <div className={styles.flowchartEmpty}>
          <div className={styles.emptyIcon}>📊</div>
          <p>No flowchart generated yet</p>
        </div>
      );
    }

    return (
      <div className={styles.flowchartWrapper}>
        <div 
          className={styles.svgContainer}
          ref={svgContainerRef}
          dangerouslySetInnerHTML={{ __html: flowchartSvg }}
        />
      </div>
    );
  };
  
  // Annotation tools configuration
  const tools = [
    { id: 'highlight', name: 'Highlight', icon: '🖍️', description: 'Highlight lines' },
    { id: 'pen', name: 'Pen', icon: '✏️', description: 'Draw freehand' },
    { id: 'eraser', name: 'Eraser', icon: '🧽', description: 'Erase drawings' },
    { id: 'note', name: 'Note', icon: '📝', description: 'Add text notes' },
    { id: 'arrow', name: 'Arrow', icon: '➡️', description: 'Draw arrows (coming soon)' },
    { id: 'circle', name: 'Circle', icon: '⭕', description: 'Circle text (coming soon)' }
  ];
  
  const colors = [
    { name: 'Yellow', value: '#ffeb3b' },
    { name: 'Green', value: '#4caf50' },
    { name: 'Blue', value: '#2196f3' },
    { name: 'Orange', value: '#ff9800' },
    { name: 'Pink', value: '#e91e63' },
    { name: 'Purple', value: '#9c27b0' }
  ];
  
  return (
    <div className={styles.highlightContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.fileInfo}>
          <div className={styles.titleSection}>
            <h2 className={styles.title}>🔍 Highlight & Annotate</h2>
            <button
              className={`${styles.actionButton} ${styles.viewToggleButton}`}
              onClick={toggleViewMode}
              title={viewMode === 'code' ? 'Switch to flowchart view' : 'Switch to code view'}
            >
              {viewMode === 'code' ? '📊 Code to Flowchart' : '📄 Flowchart to Code'}
            </button>
          </div>
          <div className={styles.fileDetails}>
            <span className={styles.fileName}>{resource.name}</span>
            <span className={styles.fileType}>{resource.lang}</span>
            <span className={styles.annotationCount}>
              {annotations.length} annotations
            </span>
            <button 
              className={styles.askMeButton}
              onClick={async () => {
                try {
                  // Load SL1 ask-me modules using script tag approach
                  if (!window.askOpenEnded) {
                    console.log('Loading SL1 ask-me library...');
                    
                    // Load the script dynamically instead of using import
                    await new Promise((resolve, reject) => {
                      const script = document.createElement('script');
                      script.type = 'module';
                      script.textContent = `
                        import { askOpenEnded } from '/static/ask/component/ask-questions.js';
                        window.askOpenEnded = askOpenEnded;
                        window.dispatchEvent(new CustomEvent('askMeLoaded'));
                      `;
                      script.onload = resolve;
                      script.onerror = reject;
                      document.head.appendChild(script);
                    });
                    
                    // Wait for the custom event
                    await new Promise((resolve) => {
                      const handler = () => {
                        window.removeEventListener('askMeLoaded', handler);
                        resolve();
                      };
                      window.addEventListener('askMeLoaded', handler);
                    });
                  }
                  
                  // Use current code
                  const codeToAnalyze = getCurrentCode();
                  console.log('Analyzing code for questions...');
                  
                  // Generate and log questions using SL1 library
                  window.askOpenEnded(codeToAnalyze);
                  
                } catch (error) {
                  console.error('Error loading SL1 ask-me library:', error);
                  console.log('Fallback: Manual code analysis questions');
                  console.log('--- --- --- --- --- --- ---');
                  console.log('Consider these questions about your code:');
                  console.log('- What does this code do step by step?');
                  console.log('- What are the main variables and their purposes?');
                  console.log('- Are there any patterns or structures you recognize?');
                  console.log('--- --- --- --- --- --- ---');
                }
              }}
              title="Generate questions about this code (logged to console)"
            >
              💬 Ask Me
            </button>
          </div>
        </div>
      </div>
      
      {/* Annotation Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolGroup}>
          <label className={styles.toolLabel}>Tools:</label>
          <div className={styles.tools}>
            {tools.map(tool => {
              // Disable highlight tool in flowchart mode
              const isDisabled = (viewMode === 'flowchart' && tool.id === 'highlight') || 
                                !['highlight', 'pen', 'eraser', 'note'].includes(tool.id);
              
              return (
                <button
                  key={tool.id}
                  className={`${styles.toolButton} ${selectedTool === tool.id ? styles.active : ''}`}
                  onClick={() => setSelectedTool(tool.id)}
                  title={tool.description}
                  disabled={isDisabled}
                >
                  {tool.icon} {tool.name}
                </button>
              );
            })}
          </div>
        </div>
        
        <div className={styles.toolGroup}>
          <label className={styles.toolLabel}>Colors:</label>
          <div className={styles.colors}>
            {colors.map(color => (
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
          <button className={styles.actionButton} onClick={handleCopyCode}>
            📋 Copy Code
          </button>
          {annotations.length > 0 && (
            <button className={`${styles.actionButton} ${styles.clearButton}`} onClick={handleClearAll}>
              🗑️ Clear All
            </button>
          )}
        </div>
      </div>
      
      {/* Main content area */}
      <div className={styles.content}>
        {/* Code or Flowchart display with annotations */}
        <div 
          className={`${styles.codeDisplay} ${viewMode === 'flowchart' ? styles.flowchartDisplay : ''}`}
          ref={codeRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={selectedTool === 'eraser' ? handleErase : undefined}
          style={{ cursor: selectedTool === 'pen' ? 'crosshair' : selectedTool === 'eraser' ? 'grab' : 'default' }}
        >
          {viewMode === 'code' ? renderCodeWithSyntaxHighlighting(getCurrentCode()) : renderFlowchart()}
          
          {/* Drawing overlay */}
          <svg className={styles.drawingOverlay} ref={overlayRef}>
            {/* Existing drawing paths */}
            {drawingPaths.map(path => (
              <polyline
                key={path.id}
                points={path.points.map(p => `${p.x},${p.y}`).join(' ')}
                stroke={path.color}
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            
            {/* Current stroke while drawing */}
            {currentStroke.length > 1 && (
              <polyline
                points={currentStroke.map(p => `${p.x},${p.y}`).join(' ')}
                stroke={selectedColor}
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.7"
              />
            )}
          </svg>
          
          {/* Note annotations overlay */}
          <div className={styles.notesOverlay}>
            {annotations
              .filter(ann => ann.type === 'note')
              .map(note => (
                <div
                  key={note.id}
                  className={styles.noteAnnotation}
                  style={{
                    left: `${note.position.x}px`,
                    top: `${note.position.y}px`,
                    borderColor: note.color
                  }}
                >
                  <div className={styles.noteContent}>
                    {note.text}
                  </div>
                  <button
                    className={styles.deleteNote}
                    onClick={() => handleDeleteAnnotation(note.id)}
                    title="Delete note"
                  >
                    ×
                  </button>
                </div>
              ))
            }
          </div>
        </div>
        
        {/* Note input dialog */}
        {showNoteInput && (
          <div 
            className={styles.noteInput}
            style={{
              left: `${notePosition.x}px`,
              top: `${notePosition.y}px`
            }}
          >
            <textarea
              className={styles.noteTextarea}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add your note..."
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleCreateNote();
                }
              }}
            />
            <div className={styles.noteActions}>
              <button className={styles.noteButton} onClick={handleCreateNote}>
                Save
              </button>
              <button 
                className={styles.noteButton} 
                onClick={() => setShowNoteInput(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Embedded Trace functionality */}
      <EmbeddedTrace 
        code={getCurrentCode()}
        fileName={resource.name}
        onTraceData={(data) => {
          console.log('Highlight lens trace data:', data);
        }}
      />
      
      {/* Instructions */}
      <div className={styles.instructions}>
        <div className={styles.instructionText}>
          <strong>How to use:</strong> Toggle between code and flowchart view using the "Code to Flowchart" button. 
          Select annotation tools to highlight code lines, draw, or add notes. 
          Use different colors to organize your thoughts! All annotations are preserved when switching views.
        </div>
      </div>
    </div>
  );
};

export default HighlightExercise;