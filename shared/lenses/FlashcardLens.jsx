import { useState, useEffect, useCallback } from 'preact/hooks';
import { useApp } from '../context/AppContext.jsx';
import { getCurrentContent } from '../utils/getCurrentContent.js';
import { getFlashcardDirectoryForFile } from '../utils/FlashcardDetector.js';
import { useLeitnerBox } from '../hooks/useLeitnerBox.js';
import styles from './FlashcardLens.module.css';

const FlashcardLens = ({ resource }) => {
  const fileName = resource?.name || '';
  const filePath = resource?.path || '';
  
  // App context
  const { virtualFS, setCurrentFile } = useApp();
  
  // Get file editor to access latest content
  const getFileEditor = useCallback(() => {
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
  const code = getCurrentContent(resource, getFileEditor, '');
  
  // Flashcard state
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [flashcardData, setFlashcardData] = useState(null);
  const [userResponse, setUserResponse] = useState(null);
  
  // Get flashcard directory info
  const flashcardInfo = getFlashcardDirectoryForFile(filePath, virtualFS);
  
  // Initialize Leitner box system
  const leitnerBox = useLeitnerBox(
    flashcardInfo?.path || '', 
    flashcardInfo?.config || null
  );

  // Parse flashcard structure from markdown
  useEffect(() => {
    try {
      const parsed = parseFlashcard(code);
      setFlashcardData(parsed);
      setIsFlipped(false);
      setShowAnswer(false);
      setUserResponse(null);
    } catch (error) {
      console.error('Error parsing flashcard:', error);
      setFlashcardData(null);
    }
  }, [code]);

  const parseFlashcard = useCallback((markdown) => {
    // Simple markdown to HTML converter (same as markdown lens)
    const markdownToHtml = (md) => {
      return md
        // Headers
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        
        // Bold and italic
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        
        // Code blocks
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
        
        // Lists
        .replace(/^\- (.*$)/gim, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
        
        // Line breaks
        .replace(/\n\n/g, '</p><p>')
        .replace(/^(?!<[h|u|p|d])/gm, '<p>')
        .replace(/(?<!>)$/gm, '</p>')
        
        // Clean up extra paragraph tags
        .replace(/<p><\/p>/g, '')
        .replace(/<p>(<[h|u|d])/g, '$1')
        .replace(/(<\/[h|u]>)<\/p>/g, '$1');
    };

    const html = markdownToHtml(markdown);
    
    // Extract the question (everything before <details>)
    const detailsMatch = html.match(/<details[^>]*>(.*?)<\/details>/s);
    if (!detailsMatch) {
      throw new Error('No flashcard structure found - missing <details> element');
    }
    
    const questionHtml = html.substring(0, html.indexOf('<details'));
    const detailsContent = detailsMatch[1];
    
    // Extract summary (flip trigger text)
    const summaryMatch = detailsContent.match(/<summary[^>]*>(.*?)<\/summary>/s);
    const summaryText = summaryMatch ? summaryMatch[1].trim() : 'Show Answer';
    
    // Extract answer content (everything after summary)
    const answerHtml = detailsContent.replace(/<summary[^>]*>.*?<\/summary>/s, '').trim();
    
    return {
      question: questionHtml.trim(),
      answer: answerHtml,
      summaryText: summaryText
    };
  }, []);

  const handleFlip = useCallback(() => {
    setIsFlipped(true);
    setShowAnswer(true);
  }, []);

  const handleResponse = useCallback((correct) => {
    setUserResponse(correct);
    
    // Record response in Leitner box system
    leitnerBox.recordResponse(filePath, correct);
    
    console.log('Flashcard response recorded:', { fileName, correct, timestamp: Date.now() });
  }, [fileName, filePath, leitnerBox]);

  const handleNext = useCallback(() => {
    // Reset state for next card
    setIsFlipped(false);
    setShowAnswer(false);
    setUserResponse(null);
    
    // Navigate to next card in session or start new session
    if (leitnerBox.isSessionActive) {
      const currentCard = leitnerBox.getCurrentCard();
      if (currentCard && !currentCard.isLast) {
        // Move to next card in current session
        leitnerBox.navigateToCard(currentCard.index + 1);
        const nextCard = leitnerBox.getCurrentCard();
        if (nextCard && flashcardInfo?.files) {
          const nextFile = flashcardInfo.files.find(f => f.path === nextCard.cardPath);
          if (nextFile) {
            setCurrentFile(nextFile);
          }
        }
      } else {
        // End current session
        leitnerBox.endSession();
      }
    } else {
      // Start new session with current card's directory
      if (flashcardInfo?.files.length > 1) {
        leitnerBox.startSession({ maxCards: 10 });
        const currentCard = leitnerBox.getCurrentCard();
        if (currentCard && flashcardInfo?.files) {
          const nextFile = flashcardInfo.files.find(f => f.path === currentCard.cardPath);
          if (nextFile) {
            setCurrentFile(nextFile);
          }
        }
      }
    }
  }, [leitnerBox, flashcardInfo, setCurrentFile]);

  const handlePrevious = useCallback(() => {
    // Reset state for previous card
    setIsFlipped(false);
    setShowAnswer(false);
    setUserResponse(null);
    
    // Navigate to previous card in session
    if (leitnerBox.isSessionActive) {
      const currentCard = leitnerBox.getCurrentCard();
      if (currentCard && !currentCard.isFirst) {
        leitnerBox.navigateToCard(currentCard.index - 1);
        const prevCard = leitnerBox.getCurrentCard();
        if (prevCard && flashcardInfo?.files) {
          const prevFile = flashcardInfo.files.find(f => f.path === prevCard.cardPath);
          if (prevFile) {
            setCurrentFile(prevFile);
          }
        }
      }
    }
  }, [leitnerBox, flashcardInfo, setCurrentFile]);

  if (!flashcardData) {
    return (
      <div className={styles.flashcardLens}>
        <div className={styles.header}>
          <h3>📚 Flashcard</h3>
          <span className={styles.fileName}>{fileName}</span>
        </div>
        <div className={styles.error}>
          <h4>⚠️ Invalid Flashcard Format</h4>
          <p>This file doesn't contain a valid flashcard structure.</p>
          <details className={styles.helpDetails}>
            <summary>Expected Format</summary>
            <pre>{`# Question Title

Question content goes here...

<details>
<summary>flip the card</summary>

## Answer

Answer content goes here...

</details>`}</pre>
          </details>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.flashcardLens}>
      <div className={styles.header}>
        <h3>📚 Flashcard</h3>
        <span className={styles.fileName}>{fileName}</span>
        <div className={styles.cardCounter}>
          {leitnerBox.isSessionActive ? (
            (() => {
              const progress = leitnerBox.getSessionProgress();
              const current = progress.currentCard;
              return current ? `${current.index + 1} of ${current.total}` : 'Card 1 of 1';
            })()
          ) : (
            `${flashcardInfo?.files.length || 1} cards available`
          )}
        </div>
      </div>

      <div className={styles.flashcardContainer}>
        <div className={`${styles.flashcard} ${isFlipped ? styles.flipped : ''}`}>
          <div className={styles.cardFace}>
            <div className={styles.cardContent}>
              <div 
                className={styles.question}
                dangerouslySetInnerHTML={{ __html: flashcardData.question }}
              />
              
              {!showAnswer && (
                <button 
                  className={styles.flipButton}
                  onClick={handleFlip}
                >
                  {flashcardData.summaryText}
                </button>
              )}
              
              {showAnswer && (
                <div className={styles.answerSection}>
                  <div 
                    className={styles.answer}
                    dangerouslySetInnerHTML={{ __html: flashcardData.answer }}
                  />
                  
                  {userResponse === null && (
                    <div className={styles.responseButtons}>
                      <p className={styles.responsePrompt}>How well did you know this?</p>
                      <button 
                        className={`${styles.responseButton} ${styles.incorrect}`}
                        onClick={() => handleResponse(false)}
                      >
                        ❌ Need to review
                      </button>
                      <button 
                        className={`${styles.responseButton} ${styles.correct}`}
                        onClick={() => handleResponse(true)}
                      >
                        ✅ Got it right
                      </button>
                    </div>
                  )}
                  
                  {userResponse !== null && (
                    <div className={styles.responseConfirmation}>
                      <p className={styles.responseResult}>
                        {userResponse ? '✅ Marked as correct!' : '❌ Marked for review'}
                      </p>
                      <div className={styles.navigationButtons}>
                        <button 
                          className={styles.navButton}
                          onClick={handlePrevious}
                        >
                          ← Previous
                        </button>
                        <button 
                          className={`${styles.navButton} ${styles.primary}`}
                          onClick={handleNext}
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Session Progress Bar */}
      {leitnerBox.isSessionActive && (
        <div className={styles.progressSection}>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${leitnerBox.getSessionProgress().progress}%` }}
            />
          </div>
          <div className={styles.progressStats}>
            <span>✅ {leitnerBox.getSessionProgress().correct}</span>
            <span>❌ {leitnerBox.getSessionProgress().incorrect}</span>
            <span>Accuracy: {Math.round(leitnerBox.getSessionProgress().accuracy)}%</span>
          </div>
        </div>
      )}

      {/* Session Management */}
      {!leitnerBox.isSessionActive && flashcardInfo?.files.length > 1 && (
        <div className={styles.sessionControls}>
          <button 
            className={styles.startSessionButton}
            onClick={() => leitnerBox.startSession({ maxCards: 10 })}
          >
            🎯 Start Study Session (10 cards)
          </button>
          <button 
            className={styles.startSessionButton}
            onClick={() => leitnerBox.startSession({ maxCards: 20 })}
          >
            📚 Extended Session (20 cards)
          </button>
        </div>
      )}

      <div className={styles.instructions}>
        <h4>💡 How to Use Flashcards</h4>
        <ul>
          <li>Read the question carefully</li>
          <li>Think of your answer before flipping</li>
          <li>Click <strong>"{flashcardData.summaryText}"</strong> to reveal the answer</li>
          <li>Mark whether you got it right to track your progress</li>
          {!leitnerBox.isSessionActive && flashcardInfo?.files.length > 1 && (
            <li>Start a study session to review multiple cards with spaced repetition</li>
          )}
          <li>Use keyboard shortcuts: <code>Space</code> to flip, <code>←/→</code> to navigate</li>
        </ul>
      </div>
    </div>
  );
};

export default FlashcardLens;