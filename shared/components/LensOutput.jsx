import { useState } from 'preact/hooks';
import VariablesLens from '../../src/lenses/VariablesLens.jsx';
import styles from './LensOutput.module.css';

/**
 * Component to render lens analysis results
 * Shows the output of applying a lens to selected code
 */
const LensOutput = ({ lensId, lensName, selectedCode, onClose }) => {
  const [isMinimized, setIsMinimized] = useState(false);

  // Render the appropriate lens component
  const renderLens = (lensId, selectedCode) => {
    switch (lensId) {
      case 'variables':
        return <VariablesLens selectedCode={selectedCode} />;
      case 'flowchart':
        return <div className={styles.mockLens}>Flowchart lens coming soon...</div>;
      case 'parsons':
        return <div className={styles.mockLens}>Parsons lens coming soon...</div>;
      case 'pseudo':
        return <div className={styles.mockLens}>Pseudocode lens coming soon...</div>;
      case 'blanks':
        return <div className={styles.mockLens}>Fill-blanks lens coming soon...</div>;
      case 'ask':
        return <div className={styles.mockLens}>Ask component coming soon...</div>;
      case 'run':
        return <div className={styles.mockLens}>Run-it component coming soon...</div>;
      case 'trace':
        return <div className={styles.mockLens}>Trace component coming soon...</div>;
      case 'debug':
        return <div className={styles.mockLens}>Debug component coming soon...</div>;
      default:
        return <div className={styles.mockLens}>Unknown lens type</div>;
    }
  };

  return (
    <div className={styles.lensOutput}>
      <div className={styles.outputHeader}>
        <div className={styles.headerLeft}>
          <span className={styles.lensIcon}>🔍</span>
          <span className={styles.lensTitle}>{lensName}</span>
          <span className={styles.selectionInfo}>
            ({selectedCode.text.split('\n').length} lines)
          </span>
        </div>
        <div className={styles.headerRight}>
          <button 
            className={styles.minimizeButton}
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? '⬆️' : '⬇️'}
          </button>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>
      
      {!isMinimized && (
        <div className={styles.outputContent}>
          {renderLens(lensId, selectedCode)}
        </div>
      )}
    </div>
  );
};

export default LensOutput;