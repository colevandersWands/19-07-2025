/**
 * Editor Adapter for SL1 ask-me component
 * Provides Monaco Editor-like API for CodeMirror integration
 */

let currentCodeMirrorEditor = null;

export const setCurrentEditor = (cmEditor) => {
  currentCodeMirrorEditor = cmEditor;
};

// Create Monaco Editor-like API wrapper for CodeMirror
window.editor = {
  getValue: () => {
    if (currentCodeMirrorEditor && currentCodeMirrorEditor.state) {
      return currentCodeMirrorEditor.state.doc.toString();
    }
    return '';
  },
  
  getSelection: () => {
    if (currentCodeMirrorEditor && currentCodeMirrorEditor.state) {
      const selection = currentCodeMirrorEditor.state.selection.main;
      const doc = currentCodeMirrorEditor.state.doc;
      
      // Convert CodeMirror positions to Monaco-like line/column format
      const startPos = doc.lineAt(selection.from);
      const endPos = doc.lineAt(selection.to);
      
      return {
        startLineNumber: startPos.number,
        endLineNumber: endPos.number,
        startColumn: selection.from - startPos.from + 1,
        endColumn: selection.to - endPos.from + 1
      };
    }
    
    // Default when no selection
    return {
      startLineNumber: 1,
      endLineNumber: 1,
      startColumn: 1,
      endColumn: 1
    };
  }
};
