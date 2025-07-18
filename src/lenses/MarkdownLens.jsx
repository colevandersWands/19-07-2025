import { useState, useEffect, useRef } from 'preact/hooks';
import { useApp } from '../../shared/context/AppContext.jsx';
import styles from './MarkdownLens.module.css';

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
  const { updateFileContent, trackStudyAction } = useApp();
  
  const [html, setHtml] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Annotation state
  const [selectedTool, setSelectedTool] = useState('pen');
  const [selectedColor, setSelectedColor] = useState('#ffeb3b');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState([]);
  const [drawingPaths, setDrawingPaths] = useState(resource.drawingPaths || []);
  
  const contentRef = useRef(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!resource || !resource.content) {
      setHtml('');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Enhanced markdown to HTML converter with Prism.js syntax highlighting
      const markdownToHtml = (markdown) => {
        return markdown
          // Headers
          .replace(/^### (.*$)/gim, '<h3>$1</h3>')
          .replace(/^## (.*$)/gim, '<h2>$1</h2>')
          .replace(/^# (.*$)/gim, '<h1>$1</h1>')
          
          // Bold and italic
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          
          // Code blocks with syntax highlighting
          .replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
            const language = lang ? lang.toLowerCase() : 'javascript';
            const trimmedCode = code.trim();
            
            try {
              // Map common language aliases
              const languageMap = {
                'js': 'javascript',
                'jsx': 'javascript',
                'py': 'python',
                'html': 'markup',
                'xml': 'markup'
              };
              
              const prismLang = languageMap[language] || language;
              
              // Check if language is supported by Prism
              if (Prism.languages[prismLang]) {
                const highlighted = Prism.highlight(trimmedCode, Prism.languages[prismLang], prismLang);
                return `<pre class="language-${prismLang}"><code class="language-${prismLang}">${highlighted}</code></pre>`;
              } else {
                // Fallback for unsupported languages
                return `<pre><code class="language-${language}">${trimmedCode}</code></pre>`;
              }
            } catch (error) {
              console.warn('Prism highlighting failed for language:', language, error);
              return `<pre><code class="language-${language}">${trimmedCode}</code></pre>`;
            }
          })
          
          // Inline code (no highlighting needed)
          .replace(/`(.*?)`/g, '<code class="inline-code">$1</code>')
          
          // Images (process before links to avoid conflicts)
          .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;" />')
          
          // Links
          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
          
          // Lists
          .replace(/^\- (.*$)/gim, '<li>$1</li>')
          .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
          
          // Line breaks
          .replace(/\n\n/g, '</p><p>')
          .replace(/^(?!<[h|u|p])/gm, '<p>')
          .replace(/(?<!>)$/gm, '</p>')
          
          // Clean up extra paragraph tags
          .replace(/<p><\/p>/g, '')
          .replace(/<p>(<[h|u])/g, '$1')
          .replace(/(<\/[h|u]>)<\/p>/g, '$1');
      };

      const htmlContent = markdownToHtml(resource.content);
      setHtml(htmlContent);
      setIsLoading(false);
      
    } catch (err) {
      console.error('Failed to render markdown:', err);
      setError('Failed to render markdown: ' + err.message);
      setIsLoading(false);
    }
  }, [resource]);

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
      drawingPathsCount: newPaths.length
    });
  };

  // Handle mouse events for drawing
  const handleMouseDown = (event) => {
    if (selectedTool === 'pen') {
      setIsDrawing(true);
      const rect = contentRef.current.getBoundingClientRect();
      const point = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
      setCurrentStroke([point]);
    }
  };

  const handleMouseMove = (event) => {
    if (isDrawing && selectedTool === 'pen') {
      const rect = contentRef.current.getBoundingClientRect();
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
      const rect = contentRef.current.getBoundingClientRect();
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

  // Clear all drawings
  const handleClearAll = () => {
    if (confirm('Clear all drawings? This cannot be undone.')) {
      saveDrawingPaths([]);
      trackStudyAction('markdown_drawings_cleared', resource);
    }
  };

  // Tool and color configurations
  const tools = [
    { id: 'pen', name: 'Pen', icon: '✏️', description: 'Draw freehand' },
    { id: 'eraser', name: 'Eraser', icon: '🧽', description: 'Erase drawings' }
  ];

  const colors = [
    { name: 'Yellow', value: '#ffeb3b' },
    { name: 'Green', value: '#4caf50' },
    { name: 'Blue', value: '#2196f3' },
    { name: 'Orange', value: '#ff9800' },
    { name: 'Pink', value: '#e91e63' },
    { name: 'Purple', value: '#9c27b0' }
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
            {tools.map(tool => (
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
          {drawingPaths.length > 0 && (
            <button className={`${styles.actionButton} ${styles.clearButton}`} onClick={handleClearAll}>
              🗑️ Clear All
            </button>
          )}
        </div>
      </div>
      
      <div className={styles.content}>
        <div 
          className={styles.markdownContainer}
          ref={contentRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={selectedTool === 'eraser' ? handleErase : undefined}
          style={{ cursor: selectedTool === 'pen' ? 'crosshair' : selectedTool === 'eraser' ? 'grab' : 'default' }}
        >
          <div 
            className={styles.markdown}
            dangerouslySetInnerHTML={{ __html: html }}
          />
          
          {/* Drawing overlay */}
          <svg className={styles.drawingOverlay} ref={overlayRef}>
            {/* Existing drawing paths */}
            {drawingPaths.map(path => (
              <polyline
                key={path.id}
                points={path.points.map(p => `${p.x},${p.y}`).join(' ')}
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
                points={currentStroke.map(p => `${p.x},${p.y}`).join(' ')}
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
    </div>
  );
};

export default MarkdownExercise;