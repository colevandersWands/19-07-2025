import { useState, useEffect } from 'preact/hooks';
import { useApp } from '../../shared/context/AppContext.jsx';
import { useColorize } from '../../shared/context/ColorizeContext.jsx';
import { getExercisesForLang, supportsPseudocode } from '../../shared/context/ExerciseRegistry.js';
import { getFlashcardDirectoryForFile } from '../../shared/utils/FlashcardDetector.js';
import URLManager from '../../shared/utils/urlManager.js';
import styles from './ExercisePicker.module.css';

/**
 * Exercise Picker Component - Shows available exercises and transforms
 */
const ExercisePicker = () => {
  const { 
    currentFile, 
    currentExercise, 
    setCurrentExercise,
    activeTransforms,
    setActiveTransforms,
    virtualFS
  } = useApp();
  
  const [showPseudocode, setShowPseudocode] = useState(false);
  const { enableColorize, toggleColorize } = useColorize();
  
  // Synchronize local pseudocode state with global activeTransforms
  useEffect(() => {
    setShowPseudocode(activeTransforms && activeTransforms.includes('pseudocode'));
  }, [activeTransforms]);
  
  if (!currentFile) {
    return (
      <div className={styles.pickerContainer}>
        <div className={styles.emptyMessage}>
          Select a file to see study options
        </div>
      </div>
    );
  }

  // Check if this markdown file is part of a flashcard directory
  const flashcardInfo = currentFile.lang === '.md' ? getFlashcardDirectoryForFile(currentFile.path, virtualFS) : null;
  
  // Handle markdown files specially
  if (currentFile.lang === '.md') {
    if (flashcardInfo) {
      // This is a flashcard file - show flashcard-specific options
      return (
        <div className={styles.pickerContainer}>
          <div className={styles.pickerHeader}>
            <h3>📚 Flashcard</h3>
            <div className={styles.fileType}>{currentFile.name}</div>
          </div>
          
          <div className={styles.flashcardInfo}>
            <div className={styles.flashcardStats}>
              <span>📂 {flashcardInfo.files.length} cards in collection</span>
            </div>
            
            <div className={styles.exerciseGrid}>
              <button
                className={`${styles.exerciseButton} ${
                  currentExercise === 'flashcards' ? styles.active : ''
                }`}
                onClick={() => setCurrentExercise('flashcards')}
                title="Study this card using spaced repetition"
              >
                Flashcards
              </button>
              <button
                className={`${styles.exerciseButton} ${
                  currentExercise === 'highlight' ? styles.active : ''
                }`}
                onClick={() => setCurrentExercise('highlight')}
                title="View as regular markdown with annotations"
              >
                Highlight
              </button>
            </div>
            
            <div className={styles.infoSection}>
              <div className={styles.infoContent}>
                {currentExercise === 'flashcards' 
                  ? 'Interactive flashcard with spaced repetition tracking'
                  : 'Read-only markdown with annotation tools'
                }
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      // Regular markdown file - auto-render only
      return (
        <div className={styles.pickerContainer}>
          <div className={styles.pickerHeader}>
            <h3>📄 Markdown File</h3>
          </div>
          <div className={styles.markdownMessage}>
            <p>This markdown file is automatically rendered as HTML.</p>
            <p>You can add annotations and drawings on top of the rendered content using the annotation tools in the rendered view.</p>
          </div>
        </div>
      );
    }
  }
  
  const availableExercises = getExercisesForLang(currentFile.lang);
  const canUsePseudocode = supportsPseudocode(currentFile.lang);
  
  const handleExerciseChange = (exerciseKey) => {
    setCurrentExercise(exerciseKey);
  };

  const handlePseudocodeToggle = (checked) => {
    setShowPseudocode(checked);
    if (checked) {
      setActiveTransforms(['pseudocode']);
    } else {
      setActiveTransforms([]);
    }
  };

  const handleColorizeToggle = (checked) => {
    toggleColorize();
  };
  
  return (
    <div className={styles.pickerContainer}>
      <div className={styles.pickerHeader}>
        <div className={styles.fileType}>{currentFile.lang}</div>
      </div>
      
      {/* Global Colorize Code Option */}
      <div className={styles.section}>
        <label className={styles.colorizeOption} title="Toggle syntax highlighting throughout the app">
          <input
            type="checkbox"
            checked={enableColorize}
            onChange={(e) => handleColorizeToggle(e.target.checked)}
          />
          <span className={styles.colorizeLabel}>
            🎨 Colorize Code
          </span>
        </label>
      </div>

      {/* Pseudocode Option - Commented out as requested */}
      {/* {canUsePseudocode && (
        <div className={styles.section}>
          <label className={styles.pseudocodeOption}>
            <input
              type="checkbox"
              checked={showPseudocode}
              onChange={(e) => handlePseudocodeToggle(e.target.checked)}
            />
            <span className={styles.pseudocodeLabel}>
              📝 Show as Pseudocode
            </span>
          </label>
          <div className={styles.pseudocodeDesc}>
            Convert to plain English first
          </div>
        </div>
      )} */}
      
      {/* Exercise Selection - Compact */}
      <div className={styles.section}>
        {/* Edit button - full width at top */}
        {availableExercises.filter(exercise => exercise.key === 'edit').map(exercise => (
          <button
            key={exercise.key}
            className={`${styles.editButton} ${
              currentExercise === exercise.key ? styles.active : ''
            }`}
            onClick={() => handleExerciseChange(exercise.key)}
            title={exercise.description}
          >
            {exercise.name}
          </button>
        ))}
        
        {/* Other exercises in grid */}
        <div className={styles.exerciseGrid}>
          {availableExercises.filter(exercise => exercise.key !== 'edit').map(exercise => (
            <button
              key={exercise.key}
              className={`${styles.exerciseButton} ${
                currentExercise === exercise.key ? styles.active : ''
              }`}
              onClick={() => handleExerciseChange(exercise.key)}
              title={exercise.description}
            >
              {exercise.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* Current Exercise Info */}
      <div className={styles.infoSection}>
        <div className={styles.infoContent}>
          {availableExercises.find(e => e.key === currentExercise)?.description}
        </div>
      </div>
    </div>
  );
};

export default ExercisePicker;