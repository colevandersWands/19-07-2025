import { useState, useEffect, useCallback } from 'preact/hooks';
import LeitnerBoxManager from '../utils/LeitnerBoxManager.js';

/**
 * Hook for managing Leitner box flashcard system
 * @param {string} directoryPath - Path to the flashcard directory
 * @param {Object} leitnerConfig - Configuration from leitner.json
 */
export const useLeitnerBox = (directoryPath, leitnerConfig = null) => {
  const [manager] = useState(() => new LeitnerBoxManager(directoryPath));
  const [currentSession, setCurrentSession] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);

  // Initialize manager with configuration
  useEffect(() => {
    if (leitnerConfig) {
      manager.loadConfiguration(leitnerConfig);
    }
  }, [manager, leitnerConfig]);

  /**
   * Start a new study session
   */
  const startSession = useCallback((options = {}) => {
    const studyCards = manager.getStudySession(options);
    
    if (studyCards.length === 0) {
      console.log('No cards available for study');
      return false;
    }
    
    setCurrentSession(studyCards);
    setCurrentCardIndex(0);
    setIsSessionActive(true);
    
    return true;
  }, [manager]);

  /**
   * End the current study session
   */
  const endSession = useCallback(() => {
    setCurrentSession(null);
    setCurrentCardIndex(0);
    setIsSessionActive(false);
  }, []);

  /**
   * Record response for current card and move to next
   */
  const recordResponse = useCallback((correct) => {
    if (!currentSession || currentCardIndex >= currentSession.length) {
      return false;
    }
    
    const currentCard = currentSession[currentCardIndex];
    manager.recordResponse(currentCard, correct);
    
    // Move to next card or end session
    if (currentCardIndex + 1 >= currentSession.length) {
      endSession();
      return true; // Session completed
    } else {
      setCurrentCardIndex(prev => prev + 1);
      return false; // More cards remaining
    }
  }, [manager, currentSession, currentCardIndex, endSession]);

  /**
   * Navigate to specific card in current session
   */
  const navigateToCard = useCallback((index) => {
    if (currentSession && index >= 0 && index < currentSession.length) {
      setCurrentCardIndex(index);
      return true;
    }
    return false;
  }, [currentSession]);

  /**
   * Get current card information
   */
  const getCurrentCard = useCallback(() => {
    if (!currentSession || currentCardIndex >= currentSession.length) {
      return null;
    }
    
    return {
      cardPath: currentSession[currentCardIndex],
      index: currentCardIndex,
      total: currentSession.length,
      isLast: currentCardIndex === currentSession.length - 1,
      isFirst: currentCardIndex === 0
    };
  }, [currentSession, currentCardIndex]);

  /**
   * Get session progress information
   */
  const getSessionProgress = useCallback(() => {
    const stats = manager.getSessionStats();
    const current = getCurrentCard();
    
    return {
      ...stats,
      currentCard: current,
      progress: current ? Math.round(((current.index + 1) / current.total) * 100) : 0
    };
  }, [manager, getCurrentCard]);

  /**
   * Get overall progress statistics
   */
  const getProgressStats = useCallback(() => {
    return manager.getProgressStats();
  }, [manager]);

  /**
   * Get cards due for review
   */
  const getCardsDue = useCallback(() => {
    return manager.getCardsDueForReview();
  }, [manager]);

  /**
   * Add a new card to the system
   */
  const addCard = useCallback((cardPath) => {
    manager.addNewCard(cardPath);
  }, [manager]);

  /**
   * Export current state for persistence
   */
  const exportState = useCallback(() => {
    return manager.exportState();
  }, [manager]);

  /**
   * Get box summary
   */
  const getBoxSummary = useCallback(() => {
    return manager.getBoxSummary();
  }, [manager]);

  return {
    // Session management
    startSession,
    endSession,
    isSessionActive,
    
    // Card navigation
    getCurrentCard,
    navigateToCard,
    recordResponse,
    
    // Progress tracking
    getSessionProgress,
    getProgressStats,
    getCardsDue,
    getBoxSummary,
    
    // Card management
    addCard,
    
    // State management
    exportState,
    
    // Direct access to manager for advanced use
    manager
  };
};