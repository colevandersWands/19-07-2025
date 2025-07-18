import { useState, useRef, useEffect, useCallback, useMemo } from 'preact/hooks';
import { memo } from 'preact/compat';
import RunCode from '../../shared/components/RunCode.jsx';
import EmbeddedTrace from '../../shared/components/EmbeddedTrace.jsx';
import StepThroughModal from '../components/StepThroughModal.jsx';
import { useApp } from '../../shared/context/AppContext.jsx';
import { setCurrentEditor } from '../utils/editorAdapter.js';
import { useFileEditor } from '../hooks/useFileEditor.js';
import styles from './StudyLens.module.css';

/**
 * StudyLens - Interactive code editor with lens selection system
 * Implements the new mental model:
 * - Default: Whole file selected, lens icon in upper-right
 * - Selection: Icon moves to selection, scope narrows
 */
const StudyLens = ({ resource }) => {
  const code = resource?.content || '';
  const fileName = resource?.name || '';
  const filePath = resource?.path || '';
  

  const { resetFileContent, currentScope, setCurrentScope } = useApp();
  const { 
    file: getFileEditor, 
    debouncedUpdateFileContent, 
    getEditorInstance, 
    getEditorContainer, 
    setEditorInstance, 
    clearEditorInstance 
  } = useFileEditor(filePath);

  // Get current editor content from virtual file system or transformed resource - memoized
  const getCurrentContent = useMemo(() => {
    // If resource has been transformed (e.g., pseudocode), use the transformed content
    if (resource?.isPseudocode || resource?.originalContent) {
      return resource.content;
    }

    const file = getFileEditor;
    return file?.editorContent || file?.content || code;
  }, [getFileEditor, code, resource]);

  // Note: Using getCurrentContent dynamically instead of static initialContent
  
  // Track current file path to detect changes
  const currentFilePathRef = useRef(filePath);
  
  const [showInstructions, setShowInstructions] = useState(false);
  const [showHtmlPreview, setShowHtmlPreview] = useState(false);
  const [showStepThroughModal, setShowStepThroughModal] = useState(false);

  // Check file types
  const isHtmlFile =
    fileName.toLowerCase().endsWith('.html') || fileName.toLowerCase().endsWith('.htm');
  const isVideoFile =
    fileName.toLowerCase().endsWith('.mp4') ||
    fileName.toLowerCase().endsWith('.webm') ||
    fileName.toLowerCase().endsWith('.mov');



  // Editor container ref - this will be the mounting point for existing or new editors
  const editorContainerRef = useRef(null);
  
  // Track editor setup state to prevent render loops
  const editorSetupRef = useRef(new Map()); // Map of filePath -> boolean
  
  // Create or reuse existing editor instance - only run once per file
  useEffect(() => {
    if (!editorContainerRef.current) return;
    
    // Skip if already set up for this file
    if (editorSetupRef.current.get(filePath)) {
      return;
    }
    
    // Check if file already has an editor instance
    const existingEditor = getEditorInstance();
    const existingContainer = getEditorContainer();
    
    if (existingEditor && existingContainer) {
      // Only append if not already in DOM to prevent flickering
      if (!existingContainer.parentNode) {
        editorContainerRef.current.appendChild(existingContainer);
      }
      
      // Update content if different (get current content dynamically)
      const currentContent = existingEditor.state.doc.toString();
      const expectedContent = getCurrentContent;
      if (currentContent !== expectedContent) {
        existingEditor.dispatch({
          changes: {
            from: 0,
            to: existingEditor.state.doc.length,
            insert: expectedContent
          }
        });
      }
    } else {
      // Create new editor instance
      createNewEditor();
    }
    
    // Mark as set up for this file
    editorSetupRef.current.set(filePath, true);
    
    // Cleanup - remove container from DOM when component unmounts
    return () => {
      const container = getEditorContainer();
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
      // Clear setup flag when component unmounts
      editorSetupRef.current.delete(filePath);
    };
  }, [filePath]); // Re-run when file changes
  
  // Function to create a new editor instance
  const createNewEditor = () => {
    // Import CodeMirror modules
    import('@codemirror/view').then(({ EditorView, keymap }) => {
      import('@codemirror/state').then(({ EditorState }) => {
        import('codemirror').then(({ basicSetup }) => {
          import('@codemirror/lang-javascript').then(({ javascript }) => {
            import('@codemirror/theme-one-dark').then(({ oneDark }) => {
              
              // Create a dedicated container for this editor
              const editorContainer = document.createElement('div');
              editorContainer.className = 'codemirror-editor-container';
              
              // Create extensions
              const extensions = [
                basicSetup,
                javascript(),
                oneDark,
                EditorView.updateListener.of((update) => {
                  if (update.docChanged) {
                    const content = update.state.doc.toString();
                    
                    // Update file content using the new hook
                    debouncedUpdateFileContent(content);
                  }
                }),
              ];
              
              // Create editor state with initial content
              const state = EditorState.create({
                doc: getCurrentContent,
                extensions
              });
              
              // Create editor view and append to dedicated container
              const view = new EditorView({
                state,
                parent: editorContainer
              });
              
              // Store editor instance and container in virtual file system
              setEditorInstance(view, editorContainer);
              
              // Append the container to the current mount point
              if (editorContainerRef.current) {
                editorContainerRef.current.appendChild(editorContainer);
              }
              
            });
          });
        });
      });
    });
  };
  
  // Helper functions for external access
  const getEditor = useCallback(() => getEditorInstance(), [getEditorInstance]);
  const getValue = useCallback(() => {
    const editor = getEditorInstance();
    return editor ? editor.state.doc.toString() : '';
  }, [getEditorInstance]);
  const getSelection = useCallback(() => {
    const editor = getEditorInstance();
    if (editor) {
      const selection = editor.state.selection.main;
      return {
        from: selection.from,
        to: selection.to,
        text: editor.state.doc.sliceString(selection.from, selection.to)
      };
    }
    return null;
  }, [getEditorInstance]);
  

  // Update the global editor adapter for SL1 ask-me component
  useEffect(() => {
    const editor = getEditorInstance();
    if (editor) {
      setCurrentEditor(editor);
    }
  }, [getEditorInstance]);

  // Component unmount cleanup
  useEffect(() => {
    return () => {
      // When StudyLens component unmounts, ensure editor container is removed from DOM
      // but don't destroy the editor instance - it's stored in virtualFS for reuse
      const container = getEditorContainer();
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    };
  }, []);



  // Initialize scope only once when component mounts
  const scopeInitializedRef = useRef(false);
  
  useEffect(() => {
    // Only initialize scope once
    if (!scopeInitializedRef.current) {
      const content = getCurrentContent;
      setCurrentScope({
        type: 'whole-file',
        code: content,
        text: content,
        lines: null,
        selection: null,
      });
      scopeInitializedRef.current = true;
    }
  }, []); // Empty dependency array - only runs once

  // Handle file changes - update CodeMirror content when switching files
  useEffect(() => {
    if (currentFilePathRef.current !== filePath) {
      currentFilePathRef.current = filePath;
      
      // Get content directly without using memoized getCurrentContent to break dependency cycle
      let newContent = code;
      if (resource?.isPseudocode || resource?.originalContent) {
        newContent = resource.content;
      } else if (getFileEditor) {
        newContent = getFileEditor.editorContent || getFileEditor.content || code;
      }
      
      // Update CodeMirror content
      const editor = getEditorInstance();
      if (editor && newContent !== editor.state.doc.toString()) {
        editor.dispatch({
          changes: {
            from: 0,
            to: editor.state.doc.length,
            insert: newContent
          }
        });
      }
      
      // Update scope for new file only when file actually changes
      if (scopeInitializedRef.current) {
        setCurrentScope({
          type: 'whole-file',
          code: newContent,
          text: newContent,
          lines: null,
          selection: null,
        });
      }
    }
  }, [filePath]); // Only depend on filePath to reduce unnecessary renders


  return (
    <div className={styles.studyLens} style={{ 
      // HACK: Force hardware acceleration to prevent flickering
      transform: 'translateZ(0)',
      backfaceVisibility: 'hidden',
      perspective: '1000px'
    }}>
      <div className={styles.header}>
        <h3>📖 Study Mode</h3>
        {fileName && <span className={styles.fileName}>{fileName}</span>}
        <div className={styles.scopeDisplay}>
          {currentScope.type === 'selection'
            ? `Lines ${currentScope.lines?.start}-${currentScope.lines?.end}`
            : 'Whole File'}
        </div>
        <div className={styles.saveStatus}>
          {(() => {
            const file = getFileEditor;
            const hasChanges = file?.hasChanges || false;
            const hasEditorContent =
              file?.editorContent && file.editorContent !== file.content;

            if (hasChanges || hasEditorContent) {
              return (
                <div className={styles.statusContainer}>
                  <span className={styles.modified}>● Modified</span>
                  <button
                    className={styles.resetButton}
                    onClick={() => {
                      // Get the file to find original content
                      const file = getFileEditor;
                      const originalContent =
                        file?.originalContent || file?.content || code;

                      // Reset in AppContext
                      resetFileContent(resource.path);

                      // Update CodeMirror content
                      const editor = getEditorInstance();
                      if (editor) {
                        editor.dispatch({
                          changes: {
                            from: 0,
                            to: editor.state.doc.length,
                            insert: originalContent
                          }
                        });
                      }

                      // Update scope if in whole-file mode
                      if (currentScope.type === 'whole-file') {
                        setCurrentScope({
                          type: 'whole-file',
                          code: originalContent,
                          text: originalContent,
                          lines: null,
                          selection: null,
                        });
                      }
                    }}
                    title="Reset to original code"
                  >
                    Reset
                  </button>
                </div>
              );
            } else {
              return <span className={styles.original}>Original</span>;
            }
          })()}
        </div>
      </div>

      <div className={styles.editorContainer}>
        {isVideoFile ? (
          /* Video Player for MP4 files - replaces the editor */
          <div className={styles.videoContainer}>
            <video
              className={styles.videoPlayer}
              controls
              preload="metadata"
              src={`data:video/mp4;base64,${btoa(code)}`}
            >
              <p>
                Your browser doesn't support HTML5 video.{' '}
                <a href={`data:video/mp4;base64,${btoa(code)}`} download={fileName}>
                  Download the video
                </a>{' '}
                instead.
              </p>
            </video>
            <div className={styles.videoInfo}>
              <h4>📹 {fileName}</h4>
              <p>Size: {(code.length / 1024 / 1024).toFixed(2)} MB</p>
              <button
                className={styles.downloadButton}
                onClick={() => {
                  const blob = new Blob([code], { type: 'video/mp4' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = fileName;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                💾 Download
              </button>
            </div>
          </div>
        ) : (
          /* CodeMirror Editor for non-video files */
          <div className={styles.editorWrapper}>
            <div ref={editorContainerRef} className={styles.codeEditor} />
          </div>
        )}
      </div>

      <div className={styles.toolsPanel}>
        {!isVideoFile && (
          <div className={styles.runSection}>
            <h4>🚀 Execute Code</h4>
            <RunCode
              code={currentScope.type === 'selection' ? currentScope.code : (currentScope.code || '')}
              scopedCode={currentScope.type === 'selection' ? currentScope.code : null}
              buttonText={currentScope.type === 'selection' ? 'Run Selection' : 'Run Code'}
              showOptions={true}
              language="javascript"
            />
          </div>
        )}

        {/* HTML Preview for HTML files - only show if no embedded trace for cleaner UI */}
        {isHtmlFile && (
          <div className={styles.htmlSection}>
            <h4>🌐 HTML Live Preview</h4>
            <div className={styles.htmlControls}>
              <button
                className={styles.previewButton}
                onClick={() => setShowHtmlPreview(!showHtmlPreview)}
              >
                {showHtmlPreview ? '📝 Code Only' : '👁️ Live Preview'}
              </button>
              <button
                className={styles.previewButton}
                onClick={() => {
                  // Create a sanitized version for new tab to avoid import errors
                  const currentContent = currentScope.code || '';
                  const sanitizedHtml = currentContent
                    .replace(
                      /import\s+.*?from\s+['"][^'"]*['"];?\s*/g,
                      '// import removed for preview',
                    )
                    .replace(/from\s+['"]\.\/[^'"]*['"]/, 'from "#"');
                  const blob = new Blob([sanitizedHtml], { type: 'text/html' });
                  const url = URL.createObjectURL(blob);
                  window.open(url, '_blank');
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                }}
              >
                🚀 Open in New Tab
              </button>
            </div>
            {showHtmlPreview && (
              <div className={styles.htmlPreview}>
                <iframe
                  srcDoc={(currentScope.code || '').replace(
                    /import\s+.*?from\s+['"][^'"]*['"];?\s*/g,
                    '<!-- import removed for preview -->',
                  )}
                  title="HTML Preview"
                  className={styles.previewFrame}
                  sandbox="allow-scripts allow-forms allow-popups allow-same-origin allow-modals"
                />
              </div>
            )}
          </div>
        )}

        {/* Embedded Trace functionality - only for JavaScript files */}
        {!isHtmlFile && !isVideoFile && (
          <EmbeddedTrace
            code={currentScope.type === 'selection' ? currentScope.code : (currentScope.code || '')}
            fileName={fileName}
            scope={currentScope}
            onTraceData={(data) => {
              console.log('Trace data:', data);
            }}
          />
        )}

        {!isVideoFile &&
          (fileName.endsWith('.js') ||
            fileName.endsWith('.jsx') ||
            fileName.endsWith('.py')) && (
            <div className={styles.stepThroughSection}>
              <h4>🔍 Step-Through Visualization</h4>
              <button
                className={styles.stepThroughButton}
                onClick={() => setShowStepThroughModal(true)}
                title="Open interactive step-through visualization"
              >
                📊 Step-Through Code
              </button>
            </div>
          )}
      </div>

      <div className={styles.instructions}>
        <h4
          className={styles.instructionsHeader}
          onClick={() => setShowInstructions(!showInstructions)}
        >
          💡 How to Use {showInstructions ? '▼' : '▶'}
        </h4>
        {showInstructions && (
          <ul className={styles.instructionsList}>
            <li>
              <strong>Whole File Study:</strong> Click the lens icon 🔍 in upper-right to
              change study mode
            </li>
            <li>
              <strong>Selection Study:</strong> Select text to narrow scope - icon moves
              to selection
            </li>
            <li>
              <strong>Run Code:</strong> Always enabled - runs whole file or selection
              based on scope
            </li>
            <li>
              <strong>Switch Lenses:</strong> Use dropdown to change between study modes
            </li>
          </ul>
        )}
      </div>

      {/* Step-Through Modal */}
      <StepThroughModal
        isOpen={showStepThroughModal}
        onClose={() => setShowStepThroughModal(false)}
        code={currentScope.code || ''}
        fileName={fileName}
        language={resource?.lang || '.js'}
      />
    </div>
  );
};

export default memo(StudyLens);
