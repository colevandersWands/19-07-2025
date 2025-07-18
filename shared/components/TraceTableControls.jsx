import { useState } from 'preact/hooks';
import styles from './TraceTableControls.module.css';

/**
 * TraceTableControls - Reusable trace table controls
 * Extracted from EmbeddedTrace for reuse in multiple components
 */
const TraceTableControls = ({ 
  showTraceTable = false, 
  onToggleTraceTable = () => {}, 
  traceLog = [], 
  onClearTrace = () => {} 
}) => {
  return (
    <div className={styles.traceControls}>
      <button 
        className={`${styles.traceButton} ${showTraceTable ? styles.active : ''}`}
        onClick={onToggleTraceTable}
        title="Toggle trace table visibility"
      >
        📊 {showTraceTable ? 'Hide' : 'Show'} ({traceLog.length})
      </button>
      
      {traceLog.length > 0 && (
        <button 
          className={styles.clearButton} 
          onClick={onClearTrace}
          title="Clear trace log"
        >
          🗑️ Clear
        </button>
      )}
    </div>
  );
};

export default TraceTableControls;