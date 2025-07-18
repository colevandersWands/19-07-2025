/**
 * Leitner Box Manager - Handles spaced repetition learning system
 * Based on the Leitner box methodology for efficient memorization
 */

class LeitnerBoxManager {
  constructor(baseDirectory = '') {
    this.baseDirectory = baseDirectory;
    this.boxes = {
      1: [], // New cards and incorrectly answered cards
      2: [], // Cards answered correctly once
      3: [], // Cards answered correctly twice
      4: [], // Cards answered correctly 3 times
      5: [], // Cards answered correctly 4 times
      6: [], // Cards answered correctly 5 times
      7: []  // Cards answered correctly 6+ times (mastered)
    };
    this.studyHistory = [];
    this.currentSession = {
      studiedCards: [],
      correct: 0,
      incorrect: 0,
      startTime: null
    };
  }

  /**
   * Load Leitner box configuration from leitner.json
   * @param {Object} leitnerConfig - Configuration object from leitner.json
   */
  loadConfiguration(leitnerConfig) {
    if (leitnerConfig && leitnerConfig.boxes) {
      this.boxes = { ...this.boxes, ...leitnerConfig.boxes };
    }
    
    if (leitnerConfig && leitnerConfig.studyHistory) {
      this.studyHistory = leitnerConfig.studyHistory || [];
    }
    
  }

  /**
   * Get summary of current box state
   */
  getBoxSummary() {
    const summary = {};
    Object.keys(this.boxes).forEach(boxNumber => {
      summary[`box${boxNumber}`] = this.boxes[boxNumber].length;
    });
    summary.total = this.getTotalCards();
    return summary;
  }

  /**
   * Get total number of cards across all boxes
   */
  getTotalCards() {
    return Object.values(this.boxes).reduce((total, box) => total + box.length, 0);
  }

  /**
   * Get cards for study session based on spaced repetition algorithm
   * @param {Object} options - Study session options
   * @param {number} options.maxCards - Maximum cards per session (default: 20)
   * @param {Array<number>} options.priorityBoxes - Which boxes to study (default: [1,2,3])
   * @param {boolean} options.includeReview - Include higher-level boxes for review
   */
  getStudySession(options = {}) {
    const {
      maxCards = 20,
      priorityBoxes = [1, 2, 3],
      includeReview = false
    } = options;

    let studyCards = [];
    
    // Add cards from priority boxes first (boxes with newer/harder cards)
    for (const boxNumber of priorityBoxes) {
      const boxCards = this.boxes[boxNumber] || [];
      const remainingSlots = maxCards - studyCards.length;
      
      if (remainingSlots <= 0) break;
      
      // Shuffle cards and take up to remaining slots
      const shuffledCards = this.shuffleArray([...boxCards]);
      studyCards = studyCards.concat(shuffledCards.slice(0, remainingSlots));
    }
    
    // If including review and we still have slots, add from higher boxes
    if (includeReview && studyCards.length < maxCards) {
      const reviewBoxes = [4, 5, 6, 7];
      for (const boxNumber of reviewBoxes) {
        const boxCards = this.boxes[boxNumber] || [];
        const remainingSlots = maxCards - studyCards.length;
        
        if (remainingSlots <= 0) break;
        
        // Take fewer cards from review boxes (they're already well-known)
        const reviewCount = Math.min(Math.ceil(remainingSlots / 4), boxCards.length);
        const shuffledCards = this.shuffleArray([...boxCards]);
        studyCards = studyCards.concat(shuffledCards.slice(0, reviewCount));
      }
    }
    
    // Start new session
    this.currentSession = {
      studiedCards: [],
      correct: 0,
      incorrect: 0,
      startTime: Date.now(),
      sessionCards: studyCards
    };
    
    return studyCards;
  }

  /**
   * Record response to a flashcard
   * @param {string} cardPath - Path to the flashcard file
   * @param {boolean} correct - Whether the answer was correct
   */
  recordResponse(cardPath, correct) {
    const currentBox = this.findCardBox(cardPath);
    
    if (currentBox === null) {
      console.warn('Card not found in any box:', cardPath);
      return;
    }
    
    // Remove card from current box
    this.boxes[currentBox] = this.boxes[currentBox].filter(card => card !== cardPath);
    
    // Move card based on response
    if (correct) {
      // Move to next box (up to box 7)
      const nextBox = Math.min(currentBox + 1, 7);
      this.boxes[nextBox].push(cardPath);
      this.currentSession.correct++;
    } else {
      // Move back to box 1 (needs more practice)
      this.boxes[1].push(cardPath);
      this.currentSession.incorrect++;
    }
    
    // Record in session
    this.currentSession.studiedCards.push({
      cardPath,
      correct,
      timestamp: Date.now()
    });
    
    // Add to study history
    this.studyHistory.push({
      cardPath,
      correct,
      fromBox: currentBox,
      toBox: correct ? Math.min(currentBox + 1, 7) : 1,
      timestamp: Date.now()
    });
  }

  /**
   * Find which box a card is currently in
   * @param {string} cardPath - Path to the flashcard file
   * @returns {number|null} - Box number or null if not found
   */
  findCardBox(cardPath) {
    for (const [boxNumber, cards] of Object.entries(this.boxes)) {
      if (cards.includes(cardPath)) {
        return parseInt(boxNumber);
      }
    }
    return null;
  }

  /**
   * Add new card to the system (starts in box 1)
   * @param {string} cardPath - Path to the flashcard file
   */
  addNewCard(cardPath) {
    // Check if card already exists
    if (this.findCardBox(cardPath) !== null) {
      return;
    }
    
    this.boxes[1].push(cardPath);
  }

  /**
   * Get current session statistics
   */
  getSessionStats() {
    return {
      ...this.currentSession,
      duration: this.currentSession.startTime ? Date.now() - this.currentSession.startTime : 0,
      accuracy: this.currentSession.studiedCards.length > 0 
        ? (this.currentSession.correct / this.currentSession.studiedCards.length) * 100 
        : 0
    };
  }

  /**
   * Get cards due for review based on spaced repetition intervals
   * @returns {Array<string>} - Array of card paths due for review
   */
  getCardsDueForReview() {
    const now = Date.now();
    const durations = {
      1: 0,           // Always available for study
      2: 1 * 24 * 60 * 60 * 1000,      // 1 day
      3: 3 * 24 * 60 * 60 * 1000,      // 3 days  
      4: 7 * 24 * 60 * 60 * 1000,      // 1 week
      5: 14 * 24 * 60 * 60 * 1000,     // 2 weeks
      6: 30 * 24 * 60 * 60 * 1000,     // 1 month
      7: 90 * 24 * 60 * 60 * 1000      // 3 months
    };
    
    const dueCards = [];
    
    Object.entries(this.boxes).forEach(([boxNumber, cards]) => {
      const reviewInterval = durations[parseInt(boxNumber)];
      
      cards.forEach(cardPath => {
        // Find last study time for this card
        const lastStudy = this.studyHistory
          .filter(entry => entry.cardPath === cardPath)
          .sort((a, b) => b.timestamp - a.timestamp)[0];
        
        if (!lastStudy || (now - lastStudy.timestamp) >= reviewInterval) {
          dueCards.push(cardPath);
        }
      });
    });
    
    return dueCards;
  }

  /**
   * Export current state to save to leitner.json
   */
  exportState() {
    return {
      boxes: this.boxes,
      studyHistory: this.studyHistory,
      lastUpdated: Date.now(),
      version: '1.0.0'
    };
  }

  /**
   * Utility function to shuffle an array
   * @param {Array} array - Array to shuffle
   * @returns {Array} - Shuffled array
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get progress statistics for all cards
   */
  getProgressStats() {
    const stats = {
      totalCards: this.getTotalCards(),
      mastery: {
        learning: this.boxes[1].length + this.boxes[2].length, // Boxes 1-2
        practiced: this.boxes[3].length + this.boxes[4].length, // Boxes 3-4  
        mastered: this.boxes[5].length + this.boxes[6].length + this.boxes[7].length // Boxes 5-7
      },
      boxDistribution: {}
    };
    
    Object.entries(this.boxes).forEach(([boxNumber, cards]) => {
      stats.boxDistribution[`box${boxNumber}`] = {
        count: cards.length,
        percentage: stats.totalCards > 0 ? Math.round((cards.length / stats.totalCards) * 100) : 0
      };
    });
    
    return stats;
  }
}

export default LeitnerBoxManager;