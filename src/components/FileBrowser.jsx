import { useState } from 'preact/hooks';
import { useApp } from '../../shared/context/AppContext.jsx';
import { loadFileContent } from '../../fs.js';
import styles from './FileBrowser.module.css';

/**
 * File Browser Component - Shows the virtual filesystem
 */
const FileBrowser = () => {
  const { virtualFS, currentFile, setCurrentFile } = useApp();
  const [expandedDirs, setExpandedDirs] = useState(new Set(['/'])); // Root is expanded by default
  
  if (!virtualFS) {
    return (
      <div className={styles.browserContainer}>
        <div className={styles.browserHeader}>
          <h3>📁 Files</h3>
        </div>
        <div className={styles.loadingMessage}>
          Loading files...
        </div>
      </div>
    );
  }
  
  const handleFileSelect = async (file) => {
    if (file.type === 'file') {
      // Load content for GitHub files if needed
      if (file.githubRepo && !file.content) {
        console.log('🔄 Loading GitHub file content...');
        try {
          await loadFileContent(file);
        } catch (error) {
          console.error('Failed to load file content:', error);
        }
      }
      setCurrentFile(file);
    }
  };
  
  const toggleDirectory = (dirPath) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(dirPath)) {
      newExpanded.delete(dirPath);
    } else {
      newExpanded.add(dirPath);
    }
    setExpandedDirs(newExpanded);
  };
  
  const handleItemClick = (node) => {
    if (node.type === 'directory') {
      toggleDirectory(node.path);
    } else {
      handleFileSelect(node);
    }
  };
  
  const renderFileTree = (node, depth = 0) => {
    // Hide lenses.json files and dot files from learners
    if (node.name === 'lenses.json' || node.name.startsWith('.')) {
      return null;
    }
    
    const isSelected = currentFile && currentFile.path === node.path;
    const hasModifications = node.modifications && node.modifications.hasChanges;
    const isExpanded = expandedDirs.has(node.path);
    const hasChildren = node.children && node.children.length > 0;
    
    return (
      <div key={node.path} className={styles.treeNode}>
        <div 
          className={`${styles.treeItem} ${isSelected ? styles.selected : ''}`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => handleItemClick(node)}
        >
          {node.type === 'directory' && hasChildren && (
            <span className={styles.expandIcon}>
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          {node.type === 'directory' && !hasChildren && (
            <span className={styles.expandIcon}> </span>
          )}
          <span className={styles.icon}>
            {node.type === 'directory' ? (isExpanded ? '📂' : '📁') : '📄'}
          </span>
          <span className={styles.name}>{node.name}</span>
          {hasModifications && (
            <span className={styles.modifiedIndicator}>●</span>
          )}
        </div>
        
        {node.children && isExpanded && node.children
          .filter(child => child.name !== 'lenses.json' && !child.name.startsWith('.')) // Also filter children
          .map(child => renderFileTree(child, depth + 1))
        }
      </div>
    );
  };
  
  return (
    <div className={styles.browserContainer}>
      <div className={styles.browserHeader}>
        <h3>📁 Files</h3>
        {currentFile && (
          <div className={styles.currentFile}>
            {currentFile.name}
          </div>
        )}
      </div>
      
      <div className={styles.fileTree}>
        {virtualFS.children ? 
          virtualFS.children.map(child => renderFileTree(child)) :
          renderFileTree(virtualFS)
        }
      </div>
    </div>
  );
};

export default FileBrowser;