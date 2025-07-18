import { useState, useCallback } from 'preact/hooks';

/**
 * useStudyScope - Hook for managing study scope (whole file vs selection)
 * Handles the mental model: default = whole file, selection = narrow scope
 */
export const useStudyScope = (initialCode = '') => {
  const [scope, setScope] = useState({
    type: 'whole-file',
    code: initialCode,
    text: initialCode,
    lines: null,
    selection: null
  });

  const updateScope = useCallback((newScope) => {
    setScope(prevScope => ({
      ...prevScope,
      ...newScope
    }));
  }, []);

  const resetToWholeFile = useCallback((code) => {
    setScope({
      type: 'whole-file',
      code: code,
      text: code,
      lines: null,
      selection: null
    });
  }, []);

  const setSelection = useCallback((selectionData) => {
    setScope({
      type: 'selection',
      code: selectionData.code,
      text: selectionData.text,
      lines: selectionData.lines,
      selection: selectionData
    });
  }, []);

  const isWholeFile = scope.type === 'whole-file';
  const isSelection = scope.type === 'selection';
  const currentCode = scope.code || '';
  const displayText = scope.type === 'selection' 
    ? `Lines ${scope.lines?.start}-${scope.lines?.end}` 
    : 'Whole File';

  return {
    scope,
    updateScope,
    resetToWholeFile,
    setSelection,
    isWholeFile,
    isSelection,
    currentCode,
    displayText
  };
};