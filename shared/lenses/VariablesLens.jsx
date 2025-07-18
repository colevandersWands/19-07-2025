import { useState, useEffect, useCallback } from 'preact/hooks';
import { parseScriptWithLocation } from 'shift-parser';
import { analyze, ScopeLookup } from 'shift-scope';
import { useApp } from '../context/AppContext.jsx';
import { getCurrentContent } from '../utils/getCurrentContent.js';
import URLManager from '../utils/urlManager.js';
import styles from './VariablesLens.module.css';

/**
 * Variables Lens - Analyzes variable scope and lifecycle
 * Port of SL1 variables lens using Shift parser and scope analyzer
 */
const VariablesLens = ({ resource, selectedCode, onHighlight }) => {
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
  const currentContent = getCurrentContent(resource, getFileEditor, '');
  const code = selectedCode || currentContent;
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [hoveredVariable, setHoveredVariable] = useState(null);
  
  // URL-based configuration
  useEffect(() => {
    const variablesConfig = URLManager.getLensConfig('variables');
    
    // Apply lens configuration if present
    if (variablesConfig) {
      try {
        // Variables lens might have highlighting options in the future
        console.log('Applied variables configuration from URL:', variablesConfig);
      } catch (error) {
        console.warn('Failed to parse variables parameters:', error);
      }
    }
  }, []);
  
  // Update URL when lens becomes active (register that variables lens is being used)
  useEffect(() => {
    // Register that variables lens is active with minimal config
    URLManager.updateLensConfig('variables', 'active');
    
    return () => {
      // Clean up when component unmounts
      // Note: Don't remove from URL on unmount as user might navigate back
    };
  }, []);
  

  // Collect all identifiers from the scope tree
  const collectIdentifiers = (globalScope, locations) => {
    const collect = (scope) => {
      const newIdentifiers = scope.variableList.reduce((acc, v) => {
        return acc.concat(
          v.references.map(r => r.node),
          v.declarations.map(r => r.node)
        );
      }, []);
      return [].concat.apply(newIdentifiers, scope.children.map(collect));
    };

    const identifiers = collect(globalScope);
    
    // Remove duplicates and sort by position
    return identifiers.filter((v, i) => i === identifiers.indexOf(v))
      .sort((a, b) => {
        const locA = locations.get(a);
        const locB = locations.get(b);
        if (locA && locB) {
          return locA.start.offset - locB.start.offset;
        }
        return 0;
      });
  };

  // Wrap identifiers in spans for variable highlighting (SL1-style implementation)
  const wrapIdentifiersInSpans = (program, identifiers, locations) => {
    const escapeHTML = (str) => 
      str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    
    // Add line numbers and convert to interactive HTML
    const lines = program.split('\n');
    let lineNumber = 1;
    let globalOffset = 0;
    let result = '';
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const lineStart = globalOffset;
      const lineEnd = globalOffset + line.length;
      
      // Add line number
      result += `<span class="line-number">${String(lineNumber).padStart(3, ' ')}:</span> `;
      
      // Process identifiers within this line
      let lineOutput = '';
      let lastPos = 0;
      
      // Find identifiers that fall within this line
      const lineIdentifiers = [];
      for (let i = 0; i < identifiers.length; i++) {
        const identifier = identifiers[i];
        const location = locations.get(identifier);
        if (location && location.start.offset >= lineStart && location.start.offset < lineEnd) {
          lineIdentifiers.push({
            index: i,
            identifier,
            location,
            relativeStart: location.start.offset - lineStart,
            relativeEnd: location.end.offset - lineStart
          });
        }
      }
      
      // Sort by position within line
      lineIdentifiers.sort((a, b) => a.relativeStart - b.relativeStart);
      
      // Build line with highlighted identifiers
      for (const item of lineIdentifiers) {
        const { index, relativeStart, relativeEnd } = item;
        
        // Add text before identifier
        lineOutput += escapeHTML(line.substring(lastPos, relativeStart));
        
        // Add highlighted identifier
        const identifierText = line.substring(relativeStart, relativeEnd);
        const trailingWhitespaceMatch = identifierText.match(/\s*$/);
        const trailingWhitespaceIndex = trailingWhitespaceMatch ? trailingWhitespaceMatch.index : identifierText.length;
        
        lineOutput += `<span class="code-binding" data-identifier="${index}">${escapeHTML(identifierText.substring(0, trailingWhitespaceIndex))}</span>`;
        lineOutput += identifierText.substring(trailingWhitespaceIndex);
        
        lastPos = relativeEnd;
      }
      
      // Add remaining text in line
      lineOutput += escapeHTML(line.substring(lastPos));
      
      result += lineOutput;
      
      // Add newline (except for last line)
      if (lineIndex < lines.length - 1) {
        result += '\n';
      }
      
      globalOffset += line.length + 1; // +1 for newline character
      lineNumber++;
    }
    
    return result;
  };

  // Analyze the selected code
  useEffect(() => {
    if (!code || !code.trim()) {
      setAnalysis(null);
      return;
    }

    try {
      // Parse the code and generate scope analysis
      const treeAndLocations = parseScriptWithLocation(code);
      const tree = treeAndLocations.tree;
      const locations = treeAndLocations.locations;
      const globalScope = analyze(tree);
      const lookup = new ScopeLookup(globalScope);
      
      // Collect identifiers in source order
      const identifiers = collectIdentifiers(globalScope, locations);
      
      // Create annotated code with variable information
      const annotatedCode = wrapIdentifiersInSpans(code, identifiers, locations);
      
      setAnalysis({
        tree,
        locations,
        globalScope,
        lookup,
        identifiers,
        annotatedCode
      });
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to analyze code');
      setAnalysis(null);
    }
  }, [code]);

  // Handle variable hover (SL1-style)
  const handleVariableHover = (identifier) => {
    if (!analysis || !analysis.lookup) return;
    
    try {
      const variable = analysis.lookup.lookup(identifier);
      if (variable && variable.length === 1) {
        setHoveredVariable(variable[0]);
        highlightVariable(variable[0]);
        if (onHighlight) {
          onHighlight(variable[0]);
        }
      } else if (variable && variable.length > 1) {
        // Handle ambiguous variables
        setError(`Ambiguous variable: "${identifier.name}" could refer to ${variable.length} different variables`);
        setHoveredVariable(null);
      } else {
        // No variable found
        setError(`Variable "${identifier.name}" not found in scope analysis`);
        setHoveredVariable(null);
      }
    } catch (err) {
      console.warn('Could not look up variable:', err);
      setError(`Variable lookup failed: ${err.message}`);
      setHoveredVariable(null);
    }
  };

  // Highlight all instances of a variable
  const highlightVariable = (variable) => {
    if (!variable || !analysis) return;
    
    try {
      // Clear previous highlights
      clearHighlights();
      
      // Highlight declarations
      if (variable.declarations) {
        variable.declarations.forEach(decl => {
          if (decl && decl.node) {
            const id = analysis.identifiers.indexOf(decl.node);
            const element = document.querySelector(`span[data-identifier="${id}"]`);
            if (element) {
              element.classList.add('var-decl');
            }
          }
        });
      }
    } catch (err) {
      console.warn('Error highlighting variable declarations:', err);
    }
    
    try {
      // Highlight references
      if (variable.references) {
        variable.references.forEach(ref => {
          if (ref && ref.node) {
            const id = analysis.identifiers.indexOf(ref.node);
            const element = document.querySelector(`span[data-identifier="${id}"]`);
            if (element) {
              // Check if accessibility exists and has the expected properties
              if (ref.accessibility && ref.accessibility.isRead) {
                element.classList.add('var-read');
              }
              if (ref.accessibility && ref.accessibility.isWrite) {
                element.classList.add('var-write');
              }
              if (ref.accessibility && ref.accessibility.isDelete) {
                element.classList.add('var-delete');
              }
              
              // Fallback: if no accessibility info, just mark as reference
              if (!ref.accessibility) {
                element.classList.add('var-ref');
              }
            }
          }
        });
      }
    } catch (err) {
      console.warn('Error highlighting variable references:', err);
    }
  };

  // Clear all variable highlights
  const clearHighlights = () => {
    const selectors = ['.var-decl', '.var-read', '.var-write', '.var-delete', '.var-ref'];
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        element.classList.remove('var-decl', 'var-read', 'var-write', 'var-delete', 'var-ref');
      });
    });
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    setHoveredVariable(null);
    clearHighlights();
    if (onHighlight) {
      onHighlight(null);
    }
  };

  // Get variable information for display
  const getVariableInfo = (variable) => {
    if (!variable) return null;
    
    return {
      name: variable.name,
      declarations: variable.declarations.length,
      references: variable.references.length,
      reads: variable.references.filter(r => r.accessibility.isRead).length,
      writes: variable.references.filter(r => r.accessibility.isWrite).length,
      scope: variable.scope ? variable.scope.type : 'unknown'
    };
  };

  if (error) {
    return (
      <div className={styles.variablesLens}>
        <div className={styles.error}>
          <h4>Analysis Error</h4>
          <p>{error}</p>
          <div className={styles.errorHelp}>
            <p>Common issues:</p>
            <ul>
              <li>Incomplete code (missing brackets, semicolons)</li>
              <li>Syntax errors</li>
              <li>Unsupported JavaScript features</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className={styles.variablesLens}>
        <div className={styles.loading}>
          <p>Analyzing variables...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.variablesLens}>
      <div className={styles.header}>
        <h4>Variable Analysis</h4>
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={styles.varDecl}>declarations</span>
          </span>
          <span className={styles.legendItem}>
            <span className={styles.varRead}>reads</span>
          </span>
          <span className={styles.legendItem}>
            <span className={styles.varWrite}>writes</span>
          </span>
          <span className={styles.legendItem}>
            <span className={styles.varReadWrite}>read-writes</span>
          </span>
        </div>
      </div>
      
      <div className={styles.content}>
        <div className={styles.codePanel}>
          <div className={styles.codeLabel}>
            Interactive Variable Analysis:
          </div>
          <div className={styles.codeContainer}>
            <div 
              className={styles.variableCode}
              dangerouslySetInnerHTML={{ __html: analysis.annotatedCode }}
              onMouseOver={(e) => {
                if (e.target.dataset && e.target.dataset.identifier) {
                  const identifier = analysis.identifiers[e.target.dataset.identifier];
                  handleVariableHover(identifier);
                }
              }}
              onMouseLeave={handleMouseLeave}
            />
          </div>
        </div>
        
        {hoveredVariable && (
          <div className={styles.variableInfo}>
            <div className={styles.infoLabel}>Variable Information:</div>
            <div className={styles.infoContent}>
              {(() => {
                const info = getVariableInfo(hoveredVariable);
                return (
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoKey}>Name:</span>
                      <span className={styles.infoValue}>{info.name}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoKey}>Scope:</span>
                      <span className={styles.infoValue}>{info.scope}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoKey}>Declarations:</span>
                      <span className={styles.infoValue}>{info.declarations}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoKey}>References:</span>
                      <span className={styles.infoValue}>{info.references}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoKey}>Reads:</span>
                      <span className={styles.infoValue}>{info.reads}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoKey}>Writes:</span>
                      <span className={styles.infoValue}>{info.writes}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VariablesLens;