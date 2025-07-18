import { useState, useEffect } from 'preact/hooks';
import { AppProvider, useApp } from '../shared/context/AppContext.jsx';
import { ToastProvider } from '../shared/context/ToastContext.jsx';
import { ColorizeProvider } from '../shared/context/ColorizeContext.jsx';
import ErrorBoundary from '../shared/components/ErrorBoundary.jsx';
import FileBrowser from './components/FileBrowser.jsx';
import RepoLoader from './components/RepoLoader.jsx';
import ExercisePicker from './components/ExercisePicker.jsx';
import ExerciseRenderer from './components/ExerciseRenderer.jsx';
import { loadFS, getRandomFile, getFile } from '../fs.js';
import URLManager from '../shared/utils/urlManager.js';
import styles from './App.module.css';

import defaultLesson from '../public/variablesing.json' with { type: 'json' };

/**
 * Main Application Component
 */
export const App = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ColorizeProvider>
          <AppProvider>
            <AppContent />
          </AppProvider>
        </ColorizeProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
};

const AppContent = () => {
  const { setVirtualFS, setCurrentFile, setCurrentExercise: switchExercise } = useApp();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get exercise type from URL lens parameters
  const getExerciseFromURL = (lensParams) => {
    if (lensParams.blanks) return 'blanks';
    if (lensParams.parsons) return 'parsons';
    if (lensParams.flowchart) return 'flowchart';
    if (lensParams.variables) return 'variables';
    if (lensParams.pythontutor) return 'pythontutor';
    if (lensParams.notional) return 'notional';
    if (lensParams.writeme) return 'writeme';
    if (lensParams.highlight) return 'highlight';
    if (lensParams.edit) return 'edit';
    if (lensParams.print) return 'print';
    if (lensParams.assets) return 'assets';
    if (lensParams.flashcards) return 'flashcards';
    return null;
  };

  // Initialize the app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true);

        // Load initial filesystem (examples or from URL)
        // const virtualFS = await loadFS('/variablesing.json');
        const virtualFS = defaultLesson;
        setVirtualFS(virtualFS);

        // Check if URL specifies a file to load or has compressed code
        const { filePath, lensParams, compressedCode, pseudocode } =
          URLManager.parseURL();
        const exerciseType = getExerciseFromURL(lensParams);
        let fileToLoad = null;

        if (compressedCode) {
          // Handle code sharing - create a virtual file from compressed code
          console.log('🔗 Loading shared code from URL');
          const decompressedCode = URLManager.decompressCode(compressedCode);

          if (decompressedCode) {
            const sharedFile = {
              name: 'Shared Code',
              path: '/shared/code.js',
              content: decompressedCode,
              lang: '.js', // Default to JS, could be enhanced to detect language
              type: 'file',
            };

            console.log('✅ Created virtual file from shared code');
            setCurrentFile(sharedFile);
            fileToLoad = sharedFile;

            // Switch to the specified exercise type
            if (exerciseType) {
              console.log('🎮 Switching to exercise:', exerciseType);
              switchExercise(exerciseType);
            }
          } else {
            console.warn('❌ Failed to decompress shared code');
          }
        } else if (filePath) {
          console.log('🎯 Loading file from URL:', filePath);
          fileToLoad = getFile(filePath);

          if (fileToLoad) {
            console.log('✅ Found file:', fileToLoad.name);
            setCurrentFile(fileToLoad);

            // Switch to the specified exercise type
            if (exerciseType) {
              console.log('🎮 Switching to exercise:', exerciseType);
              switchExercise(exerciseType);
            }
          } else {
            console.warn('❌ File not found:', filePath, '- loading random file instead');
          }
        }

        // Log pseudocode setting for debugging
        if (pseudocode) {
          console.log('🧠 Pseudocode mode enabled from URL');
        }

        // Fallback: Load README or index if no URL file or file not found
        if (!fileToLoad) {
          // Try to find README or index files in order of preference
          const fallbackFiles = [
            '/README.md',
            '/readme.md',
            '/index.js',
            '/index.html',
            '/index.md',
            '/main.js',
            '/app.js',
          ];

          let fallbackFile = null;
          for (const path of fallbackFiles) {
            fallbackFile = getFile(path);
            if (fallbackFile) break;
          }

          if (fallbackFile) {
            console.log('📋 Loading fallback file:', fallbackFile.name);
            setCurrentFile(fallbackFile);

            // Show notification if we were looking for a specific file
            if (filePath || compressedCode) {
              const notFoundItem = filePath || 'shared code';
              console.warn(
                `📢 "${notFoundItem}" was not found, showing ${fallbackFile.name} instead`,
              );
              // TODO: Add toast notification here
            }
          } else {
            // Last resort - get any file from the filesystem
            const anyFile = getRandomFile(virtualFS);
            if (anyFile) {
              console.log('🎲 No standard files found, loading:', anyFile.name);
              setCurrentFile(anyFile);
            }
          }
        }

        setIsLoading(false);
      } catch (err) {
        console.error('❌ Failed to initialize app:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []); // Run only once on mount

  // Listen for hash changes and load new files
  useEffect(() => {
    const handleHashChange = () => {
      const { filePath, lensParams, compressedCode } = URLManager.parseURL();
      const exerciseType = getExerciseFromURL(lensParams);

      if (compressedCode) {
        // Handle shared code
        console.log('🔄 Hash changed - loading shared code');
        const decompressedCode = URLManager.decompressCode(compressedCode);

        if (decompressedCode) {
          const sharedFile = {
            name: 'Shared Code',
            path: '/shared/code.js',
            content: decompressedCode,
            lang: '.js',
            type: 'file',
          };

          setCurrentFile(sharedFile);

          if (exerciseType) {
            switchExercise(exerciseType);
          }
        } else {
          console.warn('❌ Failed to decompress shared code after hash change');
        }
      } else if (filePath) {
        console.log('🔄 Hash changed - loading file:', filePath);
        const fileToLoad = getFile(filePath);

        if (fileToLoad) {
          setCurrentFile(fileToLoad);

          if (exerciseType) {
            switchExercise(exerciseType);
          }
        } else {
          console.warn('❌ File not found after hash change:', filePath);

          // Fallback to README/index
          const fallbackFiles = [
            '/README.md',
            '/readme.md',
            '/index.js',
            '/index.html',
            '/index.md',
          ];
          let fallbackFile = null;
          for (const path of fallbackFiles) {
            fallbackFile = getFile(path);
            if (fallbackFile) break;
          }

          if (fallbackFile) {
            console.log('📋 Loading fallback after hash change:', fallbackFile.name);
            setCurrentFile(fallbackFile);
            // TODO: Show toast notification
          }
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [setCurrentFile, switchExercise]);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}>🔄</div>
        <div>Loading Study Lenses...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>❌</div>
        <div className={styles.errorMessage}>
          <h2>Failed to Load</h2>
          <p>{error}</p>
          <button className={styles.retryButton} onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.appContainer}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h1 className={styles.appTitle}>📚 Study Lenses</h1>
          <p className={styles.appSubtitle}>Learn code through interactive lenses</p>
        </div>

        <FileBrowser />

        {/* <RepoLoader /> */}

        <ExercisePicker />
      </div>

      <div className={styles.mainContent}>
        <ErrorBoundary
          fallback={(error, reset) => (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <h3>Exercise Error</h3>
              <p>There was an error loading this exercise.</p>
              <button onClick={reset}>Try Again</button>
            </div>
          )}
        >
          <ExerciseRenderer />
        </ErrorBoundary>
      </div>
    </div>
  );
};
