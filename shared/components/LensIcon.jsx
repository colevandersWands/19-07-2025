import { useState, useEffect, useRef } from 'preact/hooks';
import { useApp } from '../context/AppContext.jsx';
import { getExercisesForLang } from '../context/ExerciseRegistry.js';
import styles from './LensIcon.module.css';

/**
 * LensIcon - Floating lens selection icon that follows text selection
 * - Default: Upper-right corner of editor (whole file selected)
 * - With selection: Upper-right corner of selection (narrow scope)
 */
const LensIcon = ({ 
  editorRef, 
  currentCode = '', 
  onScopeChange = null,
  currentScope = null
}) => {
  const { currentFile, currentExercise, setCurrentExercise } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 10, right: 10 });
  const [selectedText, setSelectedText] = useState('');
  const [selectedLines, setSelectedLines] = useState(null);
  const iconRef = useRef(null);

  // Get available exercises for current file
  const availableExercises = currentFile ? getExercisesForLang(currentFile.lang) : [];

  // Track text selection and update position
  useEffect(() => {
    const updateIconPosition = () => {
      const selection = window.getSelection();
      
      if (selection.rangeCount > 0 && !selection.isCollapsed) {
        // Text is selected - position icon at upper-right of selection
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const editorRect = editorRef.current?.getBoundingClientRect();
        
        if (editorRect && rect.width > 0 && rect.height > 0) {
          const relativeTop = rect.top - editorRect.top;
          const relativeRight = editorRect.right - rect.right;
          
          setPosition({
            top: Math.max(5, relativeTop),
            right: Math.max(5, relativeRight + 10)
          });

          // Extract selected text (line numbers will be provided by parent)
          const selectedText = selection.toString();
          setSelectedText(selectedText);
          
          return;
        }
      }
      
      // No selection - position icon at upper-right of editor (default)
      setPosition({ top: 10, right: 10 });
      setSelectedText('');
      setSelectedLines(null);
    };

    // Listen for selection changes
    document.addEventListener('selectionchange', updateIconPosition);
    
    // Also update on editor scroll/resize
    const editorElement = editorRef.current;
    if (editorElement) {
      editorElement.addEventListener('scroll', updateIconPosition);
      window.addEventListener('resize', updateIconPosition);
    }

    // Initial position
    updateIconPosition();

    return () => {
      document.removeEventListener('selectionchange', updateIconPosition);
      if (editorElement) {
        editorElement.removeEventListener('scroll', updateIconPosition);
      }
      window.removeEventListener('resize', updateIconPosition);
    };
  }, [editorRef, currentCode, onScopeChange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (iconRef.current && !iconRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleExerciseSelect = (exerciseKey) => {
    setCurrentExercise(exerciseKey);
    setIsOpen(false);
  };


  const getScopeDisplayText = () => {
    if (currentScope && currentScope.type === 'selection' && currentScope.lines) {
      const { start, end } = currentScope.lines;
      const lineText = start === end 
        ? `Line ${start}`
        : `Lines ${start}-${end}`;
      return lineText;
    }
    return 'Whole File';
  };

  if (!currentFile || availableExercises.length === 0) {
    return null;
  }

  return (
    <div 
      ref={iconRef}
      className={styles.lensIcon}
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        right: `${position.right}px`,
        zIndex: 1000
      }}
    >
      <button
        className={`${styles.iconButton} ${isOpen ? styles.active : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title={`Study tools for ${getScopeDisplayText()}`}
      >
        🔍
        <span className={styles.scopeIndicator}>
          {getScopeDisplayText()}
        </span>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <span className={styles.scopeDisplay}>
              📖 {getScopeDisplayText()}
            </span>
          </div>
          
          <div className={styles.exerciseList}>
            {availableExercises.map(exercise => (
              <button
                key={exercise.key}
                className={`${styles.exerciseButton} ${
                  currentExercise === exercise.key ? styles.activeExercise : ''
                }`}
                onClick={() => handleExerciseSelect(exercise.key)}
                title={exercise.description}
              >
                <span className={styles.exerciseName}>{exercise.name}</span>
                <span className={styles.exerciseDesc}>{exercise.description}</span>
              </button>
            ))}
            
            {/* SL1 Ask-Me Component */}
            <div className={styles.askSection}>
              <ask-me className={styles.askComponent} />
            </div>
          </div>
          
          {currentScope && currentScope.type === 'selection' && currentScope.text && (
            <div className={styles.selectionInfo}>
              <div className={styles.selectionPreview}>
                <strong>Selected:</strong>
                <code className={styles.codePreview}>
                  {currentScope.text.length > 50 
                    ? currentScope.text.substring(0, 50) + '...' 
                    : currentScope.text
                  }
                </code>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LensIcon;