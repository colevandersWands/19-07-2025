import { useEffect, useRef } from 'preact/hooks';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { supportsTouchEvents } from '../utils/featureDetection.js';

/**
 * CodeMirror 6 hook for Preact
 * Provides modern code editing with syntax highlighting, autocomplete, and linting
 */
export function useCodeMirror({
  initialValue = '',
  onChange,
  onSelectionChange,
  onRunCode,
  onFormatCode,
  language = 'javascript',
  theme = 'dark',
  readonly = false,
  disableCopyPaste = false,
  enableSyntaxHighlighting = true,
}) {
  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const languageCompartment = useRef(new Compartment());
  const themeCompartment = useRef(new Compartment());
  const onChangeRef = useRef(onChange);
  const onSelectionChangeRef = useRef(onSelectionChange);
  const onRunCodeRef = useRef(onRunCode);
  const onFormatCodeRef = useRef(onFormatCode);

  // Keep refs current
  onChangeRef.current = onChange;
  onSelectionChangeRef.current = onSelectionChange;
  onRunCodeRef.current = onRunCode;
  onFormatCodeRef.current = onFormatCode;

  useEffect(() => {
    if (!editorRef.current) return;

    try {
      // Create extensions array
      const extensions = [
        basicSetup,
        EditorView.updateListener.of((update) => {
          if (update.docChanged && onChangeRef.current) {
            onChangeRef.current(update.state.doc.toString());
          }
          if (update.selectionSet && onSelectionChangeRef.current) {
            const selection = update.state.selection.main;
            onSelectionChangeRef.current({
              from: selection.from,
              to: selection.to,
              text: update.state.doc.sliceString(selection.from, selection.to),
            });
          }
        }),
        keymap.of([
          {
            key: 'Tab',
            run: (view) => {
              // Indent selected lines or current line
              const { state } = view;
              const selection = state.selection.main;

              if (selection.empty) {
                // No selection - insert tab at cursor
                view.dispatch({
                  changes: {
                    from: selection.from,
                    to: selection.to,
                    insert: '  ', // 2 spaces
                  },
                  selection: { anchor: selection.from + 2 },
                });
              } else {
                // Selection exists - indent all selected lines
                const doc = state.doc;
                const startLine = doc.lineAt(selection.from);
                const endLine = doc.lineAt(selection.to);

                let changes = [];
                for (let i = startLine.number; i <= endLine.number; i++) {
                  const line = doc.line(i);
                  changes.push({
                    from: line.from,
                    to: line.from,
                    insert: '  ',
                  });
                }

                view.dispatch({
                  changes,
                  selection: {
                    anchor: selection.from + 2,
                    head: selection.to + changes.length * 2,
                  },
                });
              }
              return true;
            },
          },
          {
            key: 'Shift-Tab',
            run: (view) => {
              // Dedent selected lines or current line
              const { state } = view;
              const selection = state.selection.main;
              const doc = state.doc;

              const startLine = doc.lineAt(selection.from);
              const endLine = doc.lineAt(selection.to);

              let changes = [];
              let totalRemoved = 0;

              for (let i = startLine.number; i <= endLine.number; i++) {
                const line = doc.line(i);
                const lineText = line.text;

                // Remove up to 2 spaces or 1 tab from start of line
                let toRemove = 0;
                if (lineText.startsWith('  ')) {
                  toRemove = 2;
                } else if (lineText.startsWith(' ')) {
                  toRemove = 1;
                } else if (lineText.startsWith('\t')) {
                  toRemove = 1;
                }

                if (toRemove > 0) {
                  changes.push({
                    from: line.from,
                    to: line.from + toRemove,
                    insert: '',
                  });
                  totalRemoved += toRemove;
                }
              }

              if (changes.length > 0) {
                view.dispatch({
                  changes,
                  selection: {
                    anchor: Math.max(
                      selection.from -
                        (selection.from > startLine.from ? Math.min(2, totalRemoved) : 0),
                      startLine.from,
                    ),
                    head: Math.max(selection.to - totalRemoved, startLine.from),
                  },
                });
              }
              return true;
            },
          },
          {
            key: 'Ctrl-Enter',
            run: () => {
              if (onRunCodeRef.current) {
                onRunCodeRef.current();
                return true;
              }
              return false;
            },
          },
          {
            key: 'Ctrl-Shift-f',
            run: () => {
              if (onFormatCodeRef.current) {
                onFormatCodeRef.current();
                return true;
              }
              return false;
            },
          },
        ]),
      ];

      // Add touch-friendly interactions for mobile devices
      if (supportsTouchEvents()) {
        extensions.push(
          EditorView.domEventHandlers({
            touchstart: (event, view) => {
              // Improve touch selection on mobile
              const touch = event.touches[0];
              const pos = view.posAtCoords({ x: touch.clientX, y: touch.clientY });
              if (pos !== null) {
                // Slightly expand touch target area
                const range = Math.min(10, view.state.doc.length - pos);
                view.dispatch({
                  selection: { anchor: pos, head: pos + range },
                });
              }
              return false;
            },
            touchmove: (event, view) => {
              // Prevent default scrolling behavior during text selection
              if (event.touches.length === 1) {
                event.preventDefault();
              }
              return false;
            },
          }),
        );
      }

      // Add language and theme extensions using compartments for dynamic reconfiguration
      const getLanguageExtension = (enabled) => {
        return enabled ? javascript() : [];
      };

      const getThemeExtension = (enabled) => {
        return enabled ? oneDark : EditorView.theme({
          '&': {
            color: '#d4d4d4',
            backgroundColor: '#1e1e1e',
          },
          '.cm-content': {
            color: '#d4d4d4',
          },
          '.cm-cursor': {
            borderLeftColor: '#d4d4d4',
          },
          '.cm-selectionBackground': {
            backgroundColor: '#264f78',
          },
          '.cm-focused .cm-selectionBackground': {
            backgroundColor: '#264f78',
          },
        });
      };

      // Add compartmentalized extensions
      extensions.push(languageCompartment.current.of(getLanguageExtension(enableSyntaxHighlighting)));
      extensions.push(themeCompartment.current.of(getThemeExtension(enableSyntaxHighlighting)));

      // Add readonly extension if needed
      if (readonly) {
        extensions.push(EditorState.readOnly.of(true));
      }

      // Add copy-paste blocking extension if needed
      if (disableCopyPaste) {
        extensions.push(
          keymap.of([
            {
              key: 'Ctrl-c',
              run: () => true, // Block copy
            },
            {
              key: 'Cmd-c', // Mac
              run: () => true, // Block copy
            },
            {
              key: 'Ctrl-v',
              run: () => true, // Block paste
            },
            {
              key: 'Cmd-v', // Mac
              run: () => true, // Block paste
            },
            {
              key: 'Ctrl-x',
              run: () => true, // Block cut
            },
            {
              key: 'Cmd-x', // Mac
              run: () => true, // Block cut
            },
            {
              key: 'Ctrl-a',
              run: () => true, // Block select all
            },
            {
              key: 'Cmd-a', // Mac
              run: () => true, // Block select all
            },
          ]),
        );

        // Also add DOM event handlers to block context menu and drag
        extensions.push(
          EditorView.domEventHandlers({
            contextmenu: () => true, // Block right-click context menu
            dragstart: () => true, // Block drag-and-drop
            drop: () => true, // Block drop
            paste: () => true, // Block paste events
          }),
        );
      }

      // Create editor state
      const state = EditorState.create({
        doc: initialValue,
        extensions,
      });

      // Create editor view
      const view = new EditorView({
        state,
        parent: editorRef.current,
      });

      viewRef.current = view;

      return () => {
        view.destroy();
        viewRef.current = null;
      };
    } catch (error) {
      console.error('CodeMirror initialization error:', error);
    }
  }, [language, theme, readonly, enableSyntaxHighlighting, disableCopyPaste]);

  // Update content when initialValue changes
  // Removed problematic useEffect that was causing flickering
  // initialValue should only be used for initial render, not for updates
  // The editor instance is now the single source of truth for content

  // Function to update syntax highlighting dynamically
  const updateSyntaxHighlighting = (enabled) => {
    if (viewRef.current) {
      try {
        const getLanguageExtension = (enabled) => {
          return enabled ? javascript() : [];
        };

        const getThemeExtension = (enabled) => {
          return enabled ? oneDark : EditorView.theme({
            '&': {
              color: '#d4d4d4',
              backgroundColor: '#1e1e1e',
            },
            '.cm-content': {
              color: '#d4d4d4',
            },
            '.cm-cursor': {
              borderLeftColor: '#d4d4d4',
            },
            '.cm-selectionBackground': {
              backgroundColor: '#264f78',
            },
            '.cm-focused .cm-selectionBackground': {
              backgroundColor: '#264f78',
            },
          });
        };

        viewRef.current.dispatch({
          effects: [
            languageCompartment.current.reconfigure(getLanguageExtension(enabled)),
            themeCompartment.current.reconfigure(getThemeExtension(enabled))
          ]
        });
      } catch (error) {
        console.error('❌ updateSyntaxHighlighting error:', error);
      }
    }
  };

  return {
    editorRef,
    getEditor: () => viewRef.current,
    getEditorElement: () => editorRef.current,
    updateSyntaxHighlighting,
    getValue: () => {
      const content = viewRef.current?.state.doc.toString() || '';

      return content;
    },
    setValue: (value) => {
      if (viewRef.current) {
        try {
          viewRef.current.dispatch({
            changes: {
              from: 0,
              to: viewRef.current.state.doc.length,
              insert: value,
            },
          });
        } catch (error) {
          console.error('❌ useCodeMirror.setValue error:', error);
        }
      } else {
        console.warn('⚠️ useCodeMirror.setValue failed: CodeMirror view not ready');
      }
    },
    getSelection: () => {
      if (viewRef.current) {
        const selection = viewRef.current.state.selection.main;
        return {
          from: selection.from,
          to: selection.to,
          text: viewRef.current.state.doc.sliceString(selection.from, selection.to),
        };
      }
      return null;
    },
    restoreFromElement: (savedElement) => {
      if (savedElement && editorRef.current) {
        // Remove current editor content
        while (editorRef.current.firstChild) {
          editorRef.current.removeChild(editorRef.current.firstChild);
        }

        // Append the saved editor element
        editorRef.current.appendChild(savedElement);

        // Find the CodeMirror view in the restored element
        const restoredView = savedElement.querySelector('.cm-editor')?.cmView;
        if (restoredView) {
          viewRef.current = restoredView;
        }
      }
    },
  };
}
