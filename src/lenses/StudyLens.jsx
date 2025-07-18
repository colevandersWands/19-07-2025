import { useState, useRef, useEffect, useCallback, useMemo } from 'preact/hooks';
import { memo } from 'preact/compat';
import RunCode from '../../shared/components/RunCode.jsx';
import EmbeddedTrace from '../../shared/components/EmbeddedTrace.jsx';
import StepThroughModal from '../components/StepThroughModal.jsx';
import { getCurrentContent as getCurrentContentForAsking } from '../../shared/utils/getCurrentContent.js';
import { useApp } from '../../shared/context/AppContext.jsx';
import { useColorize } from '../../shared/context/ColorizeContext.jsx';
import { setCurrentEditor } from '../utils/editorAdapter.js';
import { useFileEditor } from '../hooks/useFileEditor.js';
import { useCodeMirror } from '../../shared/hooks/useCodeMirror.js';
import styles from './StudyLens.module.css';
import { askOpenEnded } from '../../public/static/ask/component/ask-questions.js';

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

  const { resetFileContent, currentScope, setCurrentScope, virtualFS } = useApp();
  const { enableColorize } = useColorize();
  const {
    file: getFileEditor,
    debouncedUpdateFileContent,
    getEditorInstance,
    getEditorContainer,
    setEditorInstance,
    clearEditorInstance,
    saveEditorState,
  } = useFileEditor(filePath);

  // Get file editor to access latest content
  const getFileEditorForAsking = useCallback(() => {
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
    return getCurrentContentForAsking(resource, getFileEditorForAsking, '');
  }, [resource, getFileEditorForAsking]);

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

  // CodeMirror hook - minimal version without expensive operations
  const { editorRef, getEditor, updateSyntaxHighlighting, getValue, setValue } =
    useCodeMirror({
      initialValue: getCurrentContentForAsking(resource, getFileEditorForAsking, code), // Use current content like other lenses
      onChange: undefined, // Remove onChange to stop virtual FS updates
      enableSyntaxHighlighting: enableColorize, // Enable reactive colorization
      language: 'javascript',
      theme: 'dark',
      readonly: false,
    });

  // Listen for colorize state changes and update editor
  useEffect(() => {
    updateSyntaxHighlighting(enableColorize);
  }, [enableColorize, updateSyntaxHighlighting]);

  // Track file path changes to update content when switching files only
  const previousFilePathRef = useRef(filePath);
  useEffect(() => {
    if (previousFilePathRef.current !== filePath) {
      // File changed - update editor content
      setValue(getCurrentContentForAsking(resource, getFileEditorForAsking, code)); // Use current content like other lenses
      previousFilePathRef.current = filePath;
    }
  }, [filePath, setValue, resource, getFileEditorForAsking, code]);

  // Store editor instance in virtual file system when ready
  useEffect(() => {
    const editor = getEditor();
    if (editor && editorRef.current) {
      setEditorInstance(editor, editorRef.current);
    }
  }, [getEditor, setEditorInstance]);

  // Helper functions for external access (legacy support)
  const getEditorLegacy = useCallback(() => getEditorInstance(), [getEditorInstance]);
  const getValueLegacy = useCallback(() => {
    // Try to get value from useCodeMirror hook first
    const hookValue = getValue();
    if (hookValue) return hookValue;

    // Fallback to legacy editor instance
    const editor = getEditorInstance();
    return editor ? editor.state.doc.toString() : '';
  }, [getEditorInstance, getValue]);
  const getSelection = useCallback(() => {
    // Try to get selection from useCodeMirror hook first
    const editor = getEditor();
    if (editor) {
      const selection = editor.state.selection.main;
      return {
        from: selection.from,
        to: selection.to,
        text: editor.state.doc.sliceString(selection.from, selection.to),
      };
    }

    // Fallback to legacy editor instance
    const legacyEditor = getEditorInstance();
    if (legacyEditor) {
      const selection = legacyEditor.state.selection.main;
      return {
        from: selection.from,
        to: selection.to,
        text: legacyEditor.state.doc.sliceString(selection.from, selection.to),
      };
    }
    return null;
  }, [getEditorInstance, getEditor]);

  // Update the global editor adapter for SL1 ask-me component
  useEffect(() => {
    const editor = getEditor();
    if (editor) {
      setCurrentEditor(editor);
    }
  }, [getEditor]);

  // Component unmount cleanup
  useEffect(() => {
    return () => {
      // Save current editor content to virtual FS before unmounting
      saveEditorState();
      // useCodeMirror hook handles its own cleanup automatically
      // Virtual file system editor instance is preserved for reuse
    };
  }, [saveEditorState]);

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

      // Update CodeMirror content using hook
      const currentValue = getValue();
      if (newContent !== currentValue) {
        setValue(newContent);
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
    <div
      className={styles.studyLens}
      style={{
        // HACK: Force hardware acceleration to prevent flickering
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        perspective: '1000px',
      }}
    >
      <div className={styles.header}>
        <h3>📖 Study Mode</h3>
        {fileName && <span className={styles.fileName}>{fileName}</span>}
        {/* <div className={styles.scopeDisplay}>
          {currentScope.type === 'selection'
            ? `Lines ${currentScope.lines?.start}-${currentScope.lines?.end}`
            : 'Whole File'}
        </div> */}
        <div className={styles.saveStatus}>
          {(() => {
            const file = getFileEditor;
            const hasChanges = file?.hasChanges || false;
            const hasEditorContent =
              file?.editorContent && file.editorContent !== file.content;

            return (
              <div className={styles.statusContainer}>
                <button
                  className={styles.resetButton}
                  onClick={() => {
                    // Get the file to find original content
                    const file = getFileEditor;
                    const originalContent =
                      file?.originalContent || file?.content || code;

                    // Reset in AppContext
                    resetFileContent(resource.path);

                    // Update CodeMirror content using hook
                    setValue(originalContent);

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
          })()}
        </div>
        <button
          className={styles.askMeButton}
          onClick={async () => {
            try {
              // Use current code
              const codeToAnalyze = getCurrentCode();

              // Generate and log questions using SL1 library
              askOpenEnded(codeToAnalyze);
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

      {/* Compact Dynamic Study Options - moved above editor */}
      <div className={styles.compactToolsPanel}>
        {!isVideoFile && (
          <>
            {/* Execute Code */}
            <div className={styles.compactTool}>
              <RunCode
                code={getCurrentCode()}
                scopedCode={getCurrentCode()}
                buttonText={
                  currentScope.type === 'selection' ? 'Run Selection' : 'Run Code'
                }
                showOptions={false}
                language="javascript"
              />
            </div>

            {/* Code Tracing */}
            <div className={styles.compactTool}>
              <EmbeddedTrace
                code={getCurrentCode()}
                fileName={fileName}
                scope={currentScope}
                onTraceData={(data) => undefined}
              />
            </div>

            {/* Step-Through Visualization */}
            {(fileName.endsWith('.js') ||
              fileName.endsWith('.jsx') ||
              fileName.endsWith('.py')) && (
              <div className={styles.compactTool}>
                <button
                  className={styles.compactButton}
                  onClick={() => setShowStepThroughModal(true)}
                  title="Open interactive step-through visualization"
                >
                  🔍 Step-Through
                </button>
              </div>
            )}
          </>
        )}
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
            <div ref={editorRef} className={styles.codeEditor} />
          </div>
        )}
      </div>

      {/* Additional Tools Panel for HTML Preview (kept below editor) */}
      {isHtmlFile && (
        <div className={styles.additionalToolsPanel}>
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
        </div>
      )}

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
        code={
          getCurrentCode()
          // currentScope.code || ''
        }
        fileName={fileName}
        language={resource?.lang || '.js'}
      />
    </div>
  );
};

export default memo(StudyLens);
