import { useState } from 'preact/hooks';
import { useApp } from '../../shared/context/AppContext.jsx';
import { useToastContext } from '../../shared/context/ToastContext.jsx';
import { loadFS } from '../../fs.js';
import { readFileAsText, getFileExtension, getFileBaseName } from '../../shared/utils/fileUtils.js';
import styles from './RepoLoader.module.css';

// Helper function to find README file in virtual filesystem
const findReadmeFile = (node) => {
  if (node.type === 'file') {
    const lowerName = node.name.toLowerCase();
    if (lowerName.startsWith('readme') || lowerName === 'index.md' || lowerName === 'index.html') {
      return node;
    }
  }
  if (node.children) {
    for (const child of node.children) {
      const found = findReadmeFile(child);
      if (found) return found;
    }
  }
  return null;
};

// Helper function to find and auto-select README file
const findAndSelectReadme = (virtualFS, setCurrentFile) => {
  const readmeFile = findReadmeFile(virtualFS);
  if (readmeFile) {
    setCurrentFile(readmeFile);
    return readmeFile;
  }
  return null;
};

/**
 * Repository Loader Component - Allows loading code from GitHub URLs and local files
 */
const RepoLoader = () => {
  const { setVirtualFS, setCurrentFile } = useApp();
  const { showSuccess, showError } = useToastContext();
  const [repoUrl, setRepoUrl] = useState('');
  const [gistUrl, setGistUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleLoadRepo = async () => {
    if (!repoUrl.trim()) {
      setError('Please enter a GitHub URL');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      
      // Load the repository using the existing fs.js loadFS function
      const newVirtualFS = await loadFS(repoUrl.trim());
      
      // Update the app state
      setVirtualFS(newVirtualFS);
      
      // Auto-select README file if available
      const selectedFile = findAndSelectReadme(newVirtualFS, setCurrentFile);
      if (!selectedFile) {
        setCurrentFile(null);
      }
      
      
      // Clear the input after successful load
      setRepoUrl('');
      
    } catch (err) {
      console.error('❌ Failed to load repository:', err);
      setError(err.message || 'Failed to load repository');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setRepoUrl(e.target.value);
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleLoadRepo();
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      
      // Create virtual filesystem from uploaded files
      const virtualFS = {
        type: 'directory',
        name: 'uploaded-files',
        path: '/',
        children: []
      };

      for (const file of files) {
        const content = await readFileAsText(file);
        const path = `/${file.name}`;
        const ext = getFileExtension(file.name);
        const base = getFileBaseName(file.name);
        
        virtualFS.children.push({
          type: 'file',
          name: file.name,
          ext,
          base,
          path,
          lang: ext,
          content,
          size: file.size,
          lastModified: file.lastModified
        });
      }

      // Sort files alphabetically
      virtualFS.children.sort((a, b) => a.name.localeCompare(b.name));

      setVirtualFS(virtualFS);
      
      // Auto-select README file if available
      const selectedFile = findAndSelectReadme(virtualFS, setCurrentFile);
      if (!selectedFile) {
        setCurrentFile(null);
      }
      
      
    } catch (err) {
      console.error('❌ Failed to upload files:', err);
      setError('Failed to upload files: ' + err.message);
    } finally {
      setIsLoading(false);
      // Clear the input
      event.target.value = '';
    }
  };


  // Handle GitHub Gist loading
  const handleLoadGist = async () => {
    if (!gistUrl.trim()) {
      setError('Please enter a GitHub Gist URL or ID');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Extract gist ID from URL
      const gistId = gistUrl.includes('gist.github.com') 
        ? gistUrl.split('/').pop()
        : gistUrl.trim();
      
      const response = await fetch(`https://api.github.com/gists/${gistId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch gist');
      }
      
      const gistData = await response.json();
      
      // Create virtual filesystem from gist files
      const virtualFS = {
        type: 'directory',
        name: `gist-${gistId}`,
        path: '/',
        children: []
      };

      Object.entries(gistData.files).forEach(([filename, fileData]) => {
        const path = `/${filename}`;
        const ext = getFileExtension(filename);
        const base = getFileBaseName(filename);
        
        virtualFS.children.push({
          type: 'file',
          name: filename,
          ext,
          base,
          path,
          lang: ext,
          content: fileData.content,
          size: fileData.size,
          lastModified: Date.now()
        });
      });

      // Sort files alphabetically
      virtualFS.children.sort((a, b) => a.name.localeCompare(b.name));

      setVirtualFS(virtualFS);
      
      // Auto-select README file if available
      const selectedFile = findAndSelectReadme(virtualFS, setCurrentFile);
      if (!selectedFile) {
        setCurrentFile(null);
      }
      
      setGistUrl('');
      
      showSuccess(`Loaded ${virtualFS.children.length} files from GitHub Gist`);
      
    } catch (err) {
      console.error('Failed to load gist:', err);
      setError('Failed to load gist. Please check the URL and try again.');
      showError('Failed to load gist. Please check the URL and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGistInputChange = (e) => {
    setGistUrl(e.target.value);
    if (error) setError(null);
  };

  const handleGistKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleLoadGist();
    }
  };

  return (
    <div className={styles.repoLoader}>
      {/* Hamburger Header */}
      <div className={styles.header} onClick={() => setIsExpanded(!isExpanded)}>
        <h4 className={styles.title}>
          <span className={styles.hamburger}>
            {isExpanded ? '▼' : '☰'}
          </span>
          📁 Load Content
        </h4>
      </div>
      
      {/* Collapsible Content */}
      {isExpanded && (
        <div className={styles.expandedContent}>
          {/* GitHub URL Input */}
          <div className={styles.inputSection}>
            <div className={styles.sectionLabel}>From GitHub:</div>
            <input
              type="text"
              className={styles.urlInput}
              placeholder="https://github.com/user/repo"
              value={repoUrl}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            
            <button
              className={styles.loadButton}
              onClick={handleLoadRepo}
              disabled={isLoading || !repoUrl.trim()}
            >
              {isLoading ? '⏳' : '🌐'} GitHub
            </button>
          </div>
          
          {/* GitHub Gist Input */}
          <div className={styles.inputSection}>
            <div className={styles.sectionLabel}>From GitHub Gist:</div>
            <input
              type="text"
              className={styles.urlInput}
              placeholder="https://gist.github.com/user/gist-id or gist-id"
              value={gistUrl}
              onChange={handleGistInputChange}
              onKeyPress={handleGistKeyPress}
              disabled={isLoading}
            />
            
            <button
              className={styles.loadButton}
              onClick={handleLoadGist}
              disabled={isLoading || !gistUrl.trim()}
            >
              {isLoading ? '⏳' : '📥'} Gist
            </button>
          </div>

          {/* File Upload */}
          <div className={styles.uploadSection}>
            <div className={styles.sectionLabel}>From Computer:</div>
            <label className={styles.uploadLabel}>
              <input
                type="file"
                multiple
                accept=".js,.jsx,.ts,.tsx,.py,.html,.css,.md,.json,.txt"
                onChange={handleFileUpload}
                disabled={isLoading}
                className={styles.uploadInput}
              />
              <span className={styles.uploadButton}>
                {isLoading ? '⏳' : '📤'} Upload Files
              </span>
            </label>
          </div>
          
          {error && (
            <div className={styles.error}>
              ⚠️ {error}
            </div>
          )}
          
          <div className={styles.examples}>
            <div className={styles.sectionLabel}>Examples:</div>
            <button
              className={styles.exampleButton}
              onClick={() => setRepoUrl('/predictive-stepping-example.json')}
              disabled={isLoading}
            >
              🎯 Predictive Stepping
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepoLoader;