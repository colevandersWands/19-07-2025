import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { useApp } from '../../shared/context/AppContext.jsx';
import { useColorize } from '../../shared/context/ColorizeContext.jsx';
import { getCurrentContent } from '../../shared/utils/getCurrentContent.js';
import CodeBlock from '../../shared/components/CodeBlock.jsx';
import styles from './PrintLens.module.css';

/**
 * Print Lens - Optimized code viewing and printing
 * Based on SL1's print lens with modern enhancements
 */
const PrintLens = ({ resource }) => {
  const { trackStudyAction, virtualFS } = useApp();
  const { enableColorize } = useColorize();
  
  const fileName = resource?.name || '';
  const language = resource?.lang || '.txt';
  
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
  
  // Print settings state
  const [fontSize, setFontSize] = useState(1.0);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [isPrintPreview, setIsPrintPreview] = useState(false);
  
  const contentRef = useRef(null);
  const printWindowRef = useRef(null);

  // Detect language for syntax highlighting
  const getLanguageClass = () => {
    const langMap = {
      '.js': 'javascript',
      '.jsx': 'jsx',
      '.ts': 'typescript',
      '.tsx': 'tsx',
      '.py': 'python',
      '.html': 'html',
      '.css': 'css',
      '.json': 'json',
      '.md': 'markdown',
      '.txt': 'text'
    };
    return langMap[language] || 'text';
  };

  // Simple syntax highlighting for code
  const highlightCode = (code, lang) => {
    if (!enableColorize || lang === 'text') {
      return code;
    }
    
    // Basic highlighting patterns
    let highlighted = code;
    
    if (lang === 'javascript' || lang === 'jsx' || lang === 'typescript') {
      // Keywords
      highlighted = highlighted.replace(
        /\b(const|let|var|function|class|if|else|for|while|return|import|export|from|default)\b/g,
        '<span class="keyword">$1</span>'
      );
      
      // Strings
      highlighted = highlighted.replace(
        /(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g,
        '<span class="string">$1$2$1</span>'
      );
      
      // Comments
      highlighted = highlighted.replace(
        /\/\/.*$/gm,
        '<span class="comment">$&</span>'
      );
      highlighted = highlighted.replace(
        /\/\*[\s\S]*?\*\//g,
        '<span class="comment">$&</span>'
      );
    }
    
    return highlighted;
  };

  // Format code with print-optimized syntax highlighting using SL1 approach
  const formatCodeWithSyntaxHighlighting = () => {
    const langClass = getLanguageClass();
    
    if (enableColorize) {
      // Use SL1-style approach: let Prism handle the highlighting
      return (
        <div className={styles.printCodeContainer}>
          <pre className={showLineNumbers ? 'line-numbers' : ''}>
            <code 
              key={`${showLineNumbers}-${langClass}-${code.length}`}
              ref={(el) => {
                if (el && window.Prism) {
                  // SL1 approach: escape HTML, set innerHTML, then let Prism highlight
                  el.textContent = code; // This automatically escapes HTML
                  el.className = `language-${langClass}`;
                  // Use Prism.highlightAllUnder on the parent <pre> element
                  window.Prism.highlightAllUnder(el.parentElement);
                }
              }}
              className={styles.printCode}
            />
          </pre>
        </div>
      );
    } else {
      // Plain text version with optional line numbers
      const formattedCode = showLineNumbers ? addLineNumbersToPlainText(code) : code;
      
      return (
        <div className={styles.printCodeContainer}>
          <pre className={styles.printCodePlain}>
            {formattedCode}
          </pre>
        </div>
      );
    }
  };

  // Add line numbers to plain text
  const addLineNumbersToPlainText = (plainCode) => {
    const lines = plainCode.split('\n');
    return lines.map((line, index) => {
      const lineNumber = (index + 1).toString().padStart(3, ' ');
      return `${lineNumber}: ${line}`;
    }).join('\n');
  };

  // Handle print functionality
  const handlePrint = () => {
    if (window.print) {
      // Track print action
      trackStudyAction('print_code', resource, {
        fontSize,
        showLineNumbers,
        colorized: enableColorize,
        lineCount: code.split('\n').length
      });
      
      setIsPrintPreview(true);
      setTimeout(() => {
        window.print();
        setIsPrintPreview(false);
      }, 100);
    }
  };

  // Open print in new window
  const handlePrintNewWindow = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindowRef.current = printWindow;
    
    const printContent = generatePrintHTML();
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
    
    trackStudyAction('print_new_window', resource, {
      fontSize,
      showLineNumbers,
      colorized: enableColorize
    });
  };

  // Generate standalone HTML for printing using SL1 approach
  const generatePrintHTML = () => {
    const langClass = getLanguageClass();
    
    // SL1 approach: escape HTML and let Prism handle highlighting
    const escapeHTML = (str) => {
      const pre = document.createElement('pre');
      const text = document.createTextNode(str);
      pre.appendChild(text);
      return pre.innerHTML;
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print: ${fileName}</title>
        ${enableColorize ? '<script src="/static/prism/script.js"></script>' : ''}
        <style>
          ${getPrintCSS()}
        </style>
      </head>
      <body>
        <div class="print-container" style="font-size: ${fontSize}rem">
          <div class="print-header">
            <h1>${fileName}</h1>
            <div class="print-meta">
              Language: ${getLanguageClass()} | Lines: ${code.split('\n').length} | 
              Printed: ${new Date().toLocaleString()}
            </div>
          </div>
          <div class="code-container">
            <pre><code id="code-goes-here" class="${showLineNumbers ? 'line-numbers ' : ''}language-${langClass}"></code></pre>
          </div>
        </div>
        ${enableColorize ? `
        <script>
          document.addEventListener('DOMContentLoaded', function() {
            const codeElement = document.getElementById('code-goes-here');
            codeElement.textContent = ${JSON.stringify(code)};
            if (window.Prism) {
              window.Prism.highlightAllUnder(codeElement.parentElement);
            }
          });
        </script>
        ` : `
        <script>
          document.addEventListener('DOMContentLoaded', function() {
            const codeElement = document.getElementById('code-goes-here');
            codeElement.textContent = ${JSON.stringify(code)};
          });
        </script>
        `}
      </body>
      </html>
    `;
  };

  // CSS for print styling with complete SL1 Prism styles
  const getPrintCSS = () => {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace;
        line-height: 1.4;
        color: black;
        background: white;
      }
      
      .print-container {
        max-width: 100%;
        margin: 0;
        padding: 20px;
        background: white;
      }
      
      .print-header {
        margin-bottom: 20px;
        border-bottom: 2px solid #333;
        padding-bottom: 10px;
      }
      
      .print-header h1 {
        font-size: 1.5rem;
        font-weight: bold;
        color: black;
      }
      
      .print-meta {
        font-size: 0.9rem;
        color: #666;
        margin-top: 5px;
      }
      
      .code-container {
        background: white;
        border: 1px solid #ddd;
        padding: 15px;
        border-radius: 4px;
      }

      /* SL1 Prism Styles */
      code[class*="language-"],
      pre[class*="language-"] {
        color: black;
        background: none;
        text-shadow: 0 1px white;
        font-family: Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace;
        font-size: 1em;
        text-align: left;
        white-space: pre;
        word-spacing: normal;
        word-break: normal;
        word-wrap: normal;
        line-height: 1.5;
        -moz-tab-size: 4;
        -o-tab-size: 4;
        tab-size: 4;
        -webkit-hyphens: none;
        -moz-hyphens: none;
        -ms-hyphens: none;
        hyphens: none;
      }

      pre[class*="language-"] {
        padding: 1em;
        margin: 0.5em 0;
        overflow: auto;
        background: white;
      }

      :not(pre) > code[class*="language-"] {
        padding: 0.1em;
        border-radius: 0.3em;
        white-space: normal;
        background: white;
      }

      .token.comment,
      .token.prolog,
      .token.doctype,
      .token.cdata {
        color: slategray;
      }

      .token.punctuation {
        color: #999;
      }

      .token.namespace {
        opacity: 0.7;
      }

      .token.property,
      .token.tag,
      .token.boolean,
      .token.number,
      .token.constant,
      .token.symbol,
      .token.deleted {
        color: #905;
      }

      .token.selector,
      .token.attr-name,
      .token.string,
      .token.char,
      .token.builtin,
      .token.inserted {
        color: #690;
      }

      .token.operator,
      .token.entity,
      .token.url,
      .language-css .token.string,
      .style .token.string {
        color: #9a6e3a;
        background: hsla(0, 0%, 100%, 0.5);
      }

      .token.atrule,
      .token.attr-value,
      .token.keyword {
        color: #07a;
      }

      .token.function,
      .token.class-name {
        color: #dd4a68;
      }

      .token.regex,
      .token.important,
      .token.variable {
        color: #e90;
      }

      .token.important,
      .token.bold {
        font-weight: bold;
      }

      .token.italic {
        font-style: italic;
      }

      .token.entity {
        cursor: help;
      }

      pre[class*="language-"].line-numbers {
        position: relative;
        padding-left: 3.8em;
        counter-reset: linenumber;
        line-height: 100%;
      }

      pre[class*="language-"].line-numbers > code {
        position: relative;
        white-space: inherit;
      }

      .line-numbers .line-numbers-rows {
        position: absolute;
        pointer-events: none;
        top: 0;
        font-size: 100%;
        left: -3.8em;
        width: 3em;
        letter-spacing: -1px;
        border-right: 1px solid #999;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }

      .line-numbers-rows > span {
        display: block;
        counter-increment: linenumber;
      }

      .line-numbers-rows > span:before {
        content: counter(linenumber);
        color: #999;
        display: block;
        padding-right: 0.8em;
        text-align: right;
      }
      
      @media print {
        body { margin: 0; background: white; }
        .print-container { padding: 0; margin: 0; }
        .print-header { page-break-after: avoid; }
        code[class*="language-"], pre[class*="language-"] { text-shadow: none; }
      }
    `;
  };

  return (
    <div className={`${styles.printLens} ${isPrintPreview ? styles.printPreview : ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <h3>=¨ Print View</h3>
        <span className={styles.fileName}>{fileName}</span>
        <div className={styles.fileInfo}>
          {getLanguageClass()} " {code.split('\n').length} lines
        </div>
      </div>

      {/* Print Controls */}
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>
            Font Size: {fontSize.toFixed(1)}x
          </label>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.1"
            value={fontSize}
            onChange={(e) => setFontSize(parseFloat(e.target.value))}
            className={styles.rangeSlider}
          />
        </div>

        <div className={styles.controlGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={showLineNumbers}
              onChange={(e) => setShowLineNumbers(e.target.checked)}
            />
            Show line numbers
          </label>
        </div>

      </div>

      {/* Print Actions */}
      <div className={styles.actions}>
        <button
          className={styles.printButton}
          onClick={handlePrintNewWindow}
          title="Open in new window and print"
        >
          =Ä Print in New Window
        </button>
      </div>

      {/* Code Preview */}
      <div 
        ref={contentRef}
        className={`${styles.codeContainer} ${!showLineNumbers ? styles.noLineNumbers : ''}`}
        style={{ fontSize: `${fontSize}rem` }}
      >
        <div className={styles.codeContent}>
          {formatCodeWithSyntaxHighlighting()}
        </div>
      </div>

      {/* Print Instructions */}
      <div className={styles.instructions}>
        <h4>=¡ Print Tips</h4>
        <ul>
          <li>Adjust font size for optimal readability</li>
          <li>Toggle colorization globally to save ink when printing</li>
          <li>Turn off line numbers for cleaner output</li>
          <li>Use "Print in New Window" for better print control</li>
          <li>Consider landscape orientation for wide code</li>
        </ul>
      </div>
    </div>
  );
};

export default PrintLens;