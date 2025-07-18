import { useState, useEffect, useRef } from 'preact/hooks';
import styles from './LensMenu.module.css';

/**
 * Contextual lens menu that appears when code is selected
 * Provides options to apply different lenses to the selected code
 * @param {Object} props - Component props
 * @param {Object|null} props.selectedCode - Currently selected code with text and position
 * @param {Object} props.position - Menu position {x, y}
 * @param {function(string, Object): void} props.onLensSelect - Callback when lens is selected
 * @param {function(): void} props.onClose - Callback to close the menu
 * @param {boolean} props.isVisible - Whether menu is visible
 * @returns {JSX.Element|null} Lens menu component
 */
const LensMenu = ({ 
  selectedCode, 
  position, 
  onLensSelect, 
  onClose,
  isVisible 
}) => {
  const menuRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Available lenses categorized by type
  // Static Study -> where you interact with, study and are given feedback on the program's text or conceptual organization
  // Dynamic Study -> where you interact with and study the program's dynamic runtime behavior
  const lenses = {
    static: [
      { id: 'variables', name: 'Variables', icon: '🔍', description: 'Analyze variable scope and lifecycle' },
      { id: 'flowchart', name: 'Flowchart', icon: '📊', description: 'Generate visual program flow' },
      { id: 'print', name: 'Print', icon: '🖨️', description: 'Print-optimized view of code' },
      { id: 'parsons', name: 'Parsons', icon: '🧩', description: 'Create drag-and-drop exercise' },
      { id: 'highlight', name: 'Highlight', icon: '✨', description: 'Syntax highlighting and analysis' },
      { id: 'blanks', name: 'Blanks', icon: '📋', description: 'Create fill-in-the-blank exercise' },
      { id: 'writeme', name: 'Writeme', icon: '✍️', description: 'Guided code writing exercise' },
      { id: 'ask', name: 'Ask', icon: '❓', description: 'Generate study questions' }
    ],
    dynamic: [
      { id: 'run', name: 'Run/Debug', icon: '▶️', description: 'Execute and debug code' },
      { id: 'trace', name: 'Trace', icon: '🔍', description: 'Track variable changes during execution' },
      { id: 'external', name: 'External Tools', icon: '🔗', description: 'Open in external debugging tools' }
    ]
  };

  // Get all lens options in order
  const allLenses = [...lenses.static, ...lenses.dynamic];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isVisible, onClose]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isVisible) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => (prev + 1) % allLenses.length);
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => (prev - 1 + allLenses.length) % allLenses.length);
          break;
        case 'Enter':
          event.preventDefault();
          if (allLenses[selectedIndex]) {
            handleLensClick(allLenses[selectedIndex].id);
          }
          break;
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
        case 'Tab':
          event.preventDefault();
          setSelectedIndex(prev => (prev + 1) % allLenses.length);
          break;
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isVisible, selectedIndex, allLenses, onClose]);

  // Reset selection when menu becomes visible
  useEffect(() => {
    if (isVisible) {
      setSelectedIndex(0);
      // Focus the menu for keyboard navigation
      if (menuRef.current) {
        menuRef.current.focus();
      }
    }
  }, [isVisible]);

  // Handle lens selection
  /** @param {string} lensId - ID of the selected lens */
  const handleLensClick = (lensId) => {
    onLensSelect(lensId, selectedCode);
    onClose();
  };

  if (!isVisible || !selectedCode || !selectedCode.text) {
    return null;
  }

  return (
    <div 
      ref={menuRef}
      className={styles.lensMenu}
      style={{
        top: position.y,
        left: position.x
      }}
      tabIndex={0}
      role="menu"
      aria-label="Lens selection menu"
    >
      <div className={styles.menuHeader}>
        <span className={styles.menuTitle}>Apply Lens</span>
        <span className={styles.selectionInfo}>
          {selectedCode.text.split('\n').length} lines, {selectedCode.text.length} chars
        </span>
      </div>
      
      <div className={styles.lensSection}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>📚</span>
          Static Study
        </div>
        <div className={styles.lensGrid}>
          {lenses.static.map((lens, index) => (
            <button
              key={lens.id}
              className={`${styles.lensButton} ${selectedIndex === index ? styles.selected : ''}`}
              onClick={() => handleLensClick(lens.id)}
              title={lens.description}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className={styles.lensIcon}>{lens.icon}</span>
              <span className={styles.lensName}>{lens.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.lensSection}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>⚡</span>
          Dynamic Study
        </div>
        <div className={styles.lensGrid}>
          {lenses.dynamic.map((lens, index) => {
            const globalIndex = lenses.static.length + index;
            return (
              <button
                key={lens.id}
                className={`${styles.lensButton} ${selectedIndex === globalIndex ? styles.selected : ''}`}
                onClick={() => handleLensClick(lens.id)}
                title={lens.description}
                onMouseEnter={() => setSelectedIndex(globalIndex)}
              >
                <span className={styles.lensIcon}>{lens.icon}</span>
                <span className={styles.lensName}>{lens.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.menuFooter}>
        <button className={styles.closeButton} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default LensMenu;