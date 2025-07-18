import { createContext } from 'preact';
import { useContext, useState, useCallback, useEffect } from 'preact/hooks';
import URLManager from '../utils/urlManager.js';
import { setVirtualFS as setGlobalVirtualFS } from '../../fs.js';

// Create the context
const AppContext = createContext(null);

// Context provider component
export const AppProvider = ({ children }) => {
  // File system state
  const [virtualFS, setVirtualFSState] = useState(null);
  const [currentFile, setCurrentFile] = useState(null);
  const [fileHistory, setFileHistory] = useState([]);
  
  // Wrapped setVirtualFS that also updates global virtualFS
  const setVirtualFS = useCallback((fs) => {
    setVirtualFSState(fs);
    setGlobalVirtualFS(fs);
  }, []);
  
  // Exercise system state
  const [currentExercise, setCurrentExercise] = useState('edit');
  const [activeTransforms, setActiveTransforms] = useState([]);
  const [exerciseConfig, setExerciseConfig] = useState({});
  
  // Learning tracking state
  const [studySessions, setStudySessions] = useState([]);
  
  // Selection scope state
  const [currentScope, setCurrentScope] = useState({
    type: 'whole-file',
    code: '',
    text: '',
    lines: null,
    selection: null
  });
  
  // Helper functions for file navigation
  const addToHistory = useCallback((file) => {
    setFileHistory(prev => {
      const filtered = prev.filter(f => f.path !== file.path);
      return [file, ...filtered].slice(0, 50); // Keep last 50 files
    });
  }, []);
  
  const setCurrentFileWithHistory = useCallback((file) => {
    if (file && file !== currentFile) {
      setCurrentFile(file);
      addToHistory(file);
      
      // Update URL when file changes
      if (file?.path) {
        URLManager.switchFile(file.path);
      }
    }
  }, [currentFile, addToHistory]);
  
  // Study tracking function
  const trackStudyAction = useCallback((action, resource, details = {}) => {
    if (!resource) return;
    
    const entry = {
      timestamp: Date.now(),
      action, // 'file_open', 'exercise_change', 'code_run', 'transform_apply', etc.
      resourcePath: resource.path,
      exerciseType: currentExercise,
      ...details,
    };
    
    setStudySessions(prev => [...prev, entry]);
  }, [currentExercise]);

  // Helper functions for exercise management
  const switchExercise = useCallback((exerciseType) => {
    if (exerciseType !== currentExercise) {
      const previousExercise = currentExercise;
      setCurrentExercise(exerciseType);
      
      // Clear the previous lens from URL and add the new one
      if (previousExercise && previousExercise !== exerciseType) {
        URLManager.updateLensConfig(previousExercise, null); // Remove old lens
      }
      URLManager.updateLensConfig(exerciseType, 'active'); // Add new lens
      
      // Track the exercise change
      trackStudyAction('exercise_change', currentFile, { 
        from: currentExercise, 
        to: exerciseType 
      });
    }
  }, [currentExercise, currentFile, trackStudyAction]);
  
  const applyTransforms = useCallback((transforms) => {
    setActiveTransforms(transforms);
    trackStudyAction('transforms_applied', currentFile, { transforms });
  }, [currentFile, trackStudyAction]);
  
  // Editor preservation helpers
  const saveEditorInstance = useCallback((resourcePath, editorElement) => {
    if (!virtualFS || !editorElement) return;
    
    const updateFS = (fs) => {
      if (fs.path === resourcePath) {
        return {
          ...fs,
          editor: {
            element: editorElement,
            savedAt: Date.now()
          }
        };
      }
      
      if (fs.children) {
        return {
          ...fs,
          children: fs.children.map(updateFS)
        };
      }
      
      return fs;
    };
    
    setVirtualFS(updateFS(virtualFS));
  }, [virtualFS]);
  
  const getEditorInstance = useCallback((resourcePath) => {
    if (!virtualFS) return null;
    
    const findFile = (fs, path) => {
      if (fs.path === path) return fs;
      if (fs.children) {
        for (const child of fs.children) {
          const found = findFile(child, path);
          if (found) return found;
        }
      }
      return null;
    };
    
    const file = findFile(virtualFS, resourcePath);
    return file?.editor?.element || null;
  }, [virtualFS]);
  
  const clearEditorInstance = useCallback((resourcePath) => {
    if (!virtualFS) return;
    
    const updateFS = (fs) => {
      if (fs.path === resourcePath) {
        const { editor, ...rest } = fs;
        return rest;
      }
      
      if (fs.children) {
        return {
          ...fs,
          children: fs.children.map(updateFS)
        };
      }
      
      return fs;
    };
    
    setVirtualFS(updateFS(virtualFS));
  }, [virtualFS]);

  // File modification helpers
  const updateFileContent = useCallback((resourcePath, newContent, options = {}) => {
    if (!virtualFS) return;
    
    // Update the file in the virtual filesystem
    const updateFS = (fs) => {
      if (fs.path === resourcePath) {
        // Ensure originalContent is preserved - set it once on first modification
        const originalContent = fs.originalContent || fs.content;
        
        const baseUpdate = {
          ...fs,
          originalContent: originalContent, // Preserve original content
          editorContent: newContent, // Store current edited content
          modifications: {
            content: newContent,
            timestamp: Date.now(),
            hasChanges: originalContent !== newContent,
          }
        };
        
        // Handle pseudocode special case - preserve original content
        if (options.isPseudocode) {
          return {
            ...baseUpdate,
            content: fs.content, // Keep original content unchanged
            isPseudocode: true,
            originalLang: options.originalLang || fs.originalLang,
            originalContent: originalContent,
            modifications: {
              ...baseUpdate.modifications,
              pseudocodeContent: newContent, // Store pseudocode separately
            }
          };
        }
        
        // Normal case - update content but preserve original
        return {
          ...baseUpdate,
          content: newContent, // Current content for lenses to use
        };
      }
      
      if (fs.children) {
        return {
          ...fs,
          children: fs.children.map(updateFS)
        };
      }
      
      return fs;
    };
    
    setVirtualFS(updateFS(virtualFS));
    
    // Update current file if it's the one being modified
    if (currentFile && currentFile.path === resourcePath) {
      const originalContent = currentFile.originalContent || currentFile.content;
      setCurrentFile(prev => ({
        ...prev,
        content: newContent,
        originalContent: originalContent,
        editorContent: newContent,
        modifications: {
          content: newContent,
          timestamp: Date.now(),
          hasChanges: originalContent !== newContent,
        }
      }));
    }
  }, [virtualFS, currentFile]);
  
  // Reset file content to original
  const resetFileContent = useCallback((resourcePath) => {
    if (!virtualFS) return;
    
    // Reset the file in the virtual filesystem
    const resetFS = (fs) => {
      if (fs.path === resourcePath) {
        const originalContent = fs.originalContent || fs.content;
        return {
          ...fs,
          content: originalContent,
          editorContent: originalContent,
          modifications: {
            content: originalContent,
            timestamp: Date.now(),
            hasChanges: false,
          }
        };
      }
      
      if (fs.children) {
        return {
          ...fs,
          children: fs.children.map(resetFS)
        };
      }
      
      return fs;
    };
    
    setVirtualFS(resetFS(virtualFS));
    
    // Reset current file if it's the one being reset
    if (currentFile && currentFile.path === resourcePath) {
      const originalContent = currentFile.originalContent || currentFile.content;
      setCurrentFile(prev => ({
        ...prev,
        content: originalContent,
        editorContent: originalContent,
        modifications: {
          content: originalContent,
          timestamp: Date.now(),
          hasChanges: false,
        }
      }));
    }
    
    trackStudyAction('file_reset', { path: resourcePath }, { action: 'reset_to_original' });
  }, [virtualFS, currentFile, trackStudyAction]);
  
  // Context value object
  const value = {
    // File system state
    virtualFS,
    setVirtualFS,
    currentFile,
    setCurrentFile: setCurrentFileWithHistory,
    fileHistory,
    
    // Exercise system state
    currentExercise,
    setCurrentExercise: switchExercise,
    activeTransforms,
    setActiveTransforms: applyTransforms,
    exerciseConfig,
    setExerciseConfig,
    
    // Learning tracking
    studySessions,
    trackStudyAction,
    
    // Selection scope
    currentScope,
    setCurrentScope,
    
    // File modification
    updateFileContent,
    resetFileContent,
    
    // Editor preservation
    saveEditorInstance,
    getEditorInstance,
    clearEditorInstance,
  };
  
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// Export context for advanced usage
export { AppContext };