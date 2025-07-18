import { useState, useEffect } from 'preact/hooks';
import { useApp } from '../../shared/context/AppContext.jsx';
import { useColorize } from '../../shared/context/ColorizeContext.jsx';
import { useExerciseManager } from '../../shared/context/ExerciseManager.jsx';
import styles from './ExerciseRenderer.module.css';

/**
 * Exercise Renderer Component - Renders the current exercise
 */
const ExerciseRenderer = () => {
  const [exerciseComponent, setExerciseComponent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { 
    currentFile, 
    currentExercise, 
    activeTransforms, 
    trackStudyAction,
    currentScope
  } = useApp();
  
  const { enableColorize } = useColorize();
  const { getOrCreateExercise, applyTransforms } = useExerciseManager();
  
  // Load exercise when file or exercise type changes
  useEffect(() => {
    const loadExercise = async () => {
      if (!currentFile || !currentExercise) {
        setExerciseComponent(null);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Apply transforms if any are active
        let resourceToRender = currentFile;
        if (activeTransforms && activeTransforms.length > 0) {
          // Apply pseudocode transform if active
          if (activeTransforms.includes('pseudocode')) {
            const pseudocodeModule = await import('../../transforms/pseudocode/index.js');
            const pseudocodeTransform = pseudocodeModule.default;
            resourceToRender = pseudocodeTransform({ 
              resource: currentFile, 
              config: {}, 
              query: {} 
            });
          }
        }
        
        // Note: Scope handling is done internally by StudyLens to prevent re-render loops
        // Removed scope application here to prevent resourceToRender object recreation
        
        // Dynamically load the appropriate exercise component
        let ComponentModule;
        
        // For image files, always use asset viewer (regardless of exercise type)
        const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp'];
        if (imageExtensions.includes(currentFile.lang)) {
          ComponentModule = await import('../lenses/AssetLens.jsx');
        }
        // For markdown files, always use markdown renderer
        else if (currentFile.lang === '.md') {
          ComponentModule = await import('../lenses/MarkdownLens.jsx');
        } else if (currentExercise === 'edit' || currentExercise === 'study') {
          ComponentModule = await import('../lenses/StudyLens.jsx');
        } else if (currentExercise === 'highlight') {
          ComponentModule = await import('../lenses/HighlightLens.jsx');
        } else if (currentExercise === 'flowchart') {
          ComponentModule = await import('../lenses/FlowchartLens.jsx');
        } else if (currentExercise === 'parsons') {
          ComponentModule = await import('../lenses/ParsonsLens.jsx');
        } else if (currentExercise === 'blanks') {
          ComponentModule = await import('../lenses/BlanksLens.jsx');
        } else if (currentExercise === 'variables') {
          ComponentModule = await import('../lenses/VariablesLens.jsx');
        } else if (currentExercise === 'flashcards') {
          ComponentModule = await import('../lenses/FlashcardLens.jsx');
        } else if (currentExercise === 'print') {
          ComponentModule = await import('../lenses/PrintLens.jsx');
        } else if (currentExercise === 'assets') {
          ComponentModule = await import('../lenses/AssetLens.jsx');
        } else if (currentExercise === 'writeme') {
          ComponentModule = await import('../lenses/WritemeLens.jsx');
        } else if (currentExercise === 'pythontutor' || currentExercise === 'notional') {
          ComponentModule = await import('../lenses/StepThroughsLens.jsx');
        } else {
          // For other exercises, show placeholder
          const componentKey = `${currentFile.path}-${currentExercise}-placeholder`;
          setExerciseComponent(() => (
            <div key={componentKey} style={{ padding: '40px', textAlign: 'center', color: '#d4d4d4' }}>
              <h3>Exercise "{currentExercise}" coming soon!</h3>
              <p>This exercise is not implemented yet.</p>
            </div>
          ));
          setIsLoading(false);
          return;
        }
        
        const Component = ComponentModule.default;
        // Stable key that only changes when file or exercise changes (not on scope changes)
        const componentKey = `${currentFile.path}-${currentExercise}`;
        setExerciseComponent(() => (
          <Component key={componentKey} resource={resourceToRender} />
        ));
        
        // Track that user opened this file with this exercise
        trackStudyAction('file_open', currentFile, {
          exercise: currentExercise,
          transforms: activeTransforms,
        });
        
        setIsLoading(false);
        
      } catch (err) {
        console.error('Failed to apply transforms:', err);
        setError('Failed to apply transforms: ' + err.message);
        setIsLoading(false);
      }
    };

    loadExercise();
  }, [currentFile, currentExercise, activeTransforms, enableColorize, trackStudyAction]);
  
  if (!currentFile) {
    return (
      <div className={styles.rendererContainer}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📚</div>
          <h2>Welcome to Spiral Lens</h2>
          <p>Select a file from the sidebar to start studying code</p>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className={styles.rendererContainer}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}>🔄</div>
          <p>Loading {currentExercise} exercise...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={styles.rendererContainer}>
        <div className={styles.errorState}>
          <div className={styles.errorIcon}>❌</div>
          <h3>Exercise Failed to Load</h3>
          <p>{error}</p>
          <button 
            className={styles.retryButton}
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  if (!exerciseComponent) {
    return (
      <div className={styles.rendererContainer}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🎯</div>
          <h3>No Exercise Available</h3>
          <p>No exercise found for {currentFile.name}</p>
        </div>
      </div>
    );
  }
  
  // Render the exercise component
  return (
    <div className={styles.rendererContainer}>
      <div className={styles.exerciseContent}>
        {exerciseComponent}
      </div>
    </div>
  );
};

export default ExerciseRenderer;