import { useState, useEffect } from 'preact/hooks';
import styles from './FlowchartLens.module.css';

/**
 * Flowchart Lens - Displays code as a visual flowchart
 */
const FlowchartLens = ({ resource }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(false);
  }, [resource]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}>🔄</div>
          <p>Generating flowchart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <div className={styles.errorIcon}>❌</div>
          <h3>Flowchart Generation Failed</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>📊 Flowchart View</h2>
        <p>Visual representation of {resource?.name || 'code'}</p>
      </div>
      
      <div className={styles.flowchartArea}>
        <div className={styles.placeholder}>
          <div className={styles.placeholderIcon}>🔧</div>
          <h3>Flowchart Coming Soon</h3>
          <p>This feature is currently under development.</p>
          <p>File: {resource?.name}</p>
          <p>Language: {resource?.lang}</p>
        </div>
      </div>
    </div>
  );
};

export default FlowchartLens;