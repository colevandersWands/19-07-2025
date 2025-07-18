import { useState, useEffect, useCallback } from 'preact/hooks';
import { useApp } from '../context/AppContext.jsx';
import styles from './AssetLens.module.css';

/**
 * Asset Lens - Viewer for images, GIFs, PDFs, and other media files
 * Supports standalone diagrams and media content in directories
 */
const AssetLens = ({ resource }) => {
  const { trackStudyAction } = useApp();
  
  const fileName = resource?.name || '';
  const filePath = resource?.path || '';
  const content = resource?.content || '';
  const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
  
  // Asset viewing state
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [assetError, setAssetError] = useState(null);
  const [assetMetadata, setAssetMetadata] = useState(null);

  // Supported asset types
  const assetTypes = {
    images: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp'],
    documents: ['pdf'],
    videos: ['mp4', 'webm', 'mov', 'avi'],
    audio: ['mp3', 'wav', 'ogg', 'm4a']
  };

  // Determine asset type
  const getAssetType = () => {
    if (assetTypes.images.includes(fileExtension)) return 'image';
    if (assetTypes.documents.includes(fileExtension)) return 'document';
    if (assetTypes.videos.includes(fileExtension)) return 'video';
    if (assetTypes.audio.includes(fileExtension)) return 'audio';
    return 'unknown';
  };

  const assetType = getAssetType();

  // Create data URL from content
  const createDataUrl = useCallback(() => {
    if (!content) return null;
    
    try {
      // If content is already a data URL, return it
      if (content.startsWith('data:')) {
        return content;
      }
      
      // Create appropriate MIME type
      const mimeTypes = {
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
        svg: 'image/svg+xml',
        webp: 'image/webp',
        bmp: 'image/bmp',
        pdf: 'application/pdf',
        mp4: 'video/mp4',
        webm: 'video/webm',
        mov: 'video/quicktime',
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        ogg: 'audio/ogg'
      };
      
      const mimeType = mimeTypes[fileExtension] || 'application/octet-stream';
      
      // For base64 content, create data URL
      if (typeof content === 'string' && !content.includes('\n') && /^[A-Za-z0-9+/]*={0,2}$/.test(content)) {
        return `data:${mimeType};base64,${content}`;
      }
      
      // For binary content that's been read as UTF-8 string, convert to base64
      // Handle binary data that was read as a UTF-8 string
      let base64Content;
      if (typeof content === 'string') {
        // Convert UTF-8 string back to binary data, then to base64
        const binaryString = Array.from(content, char => 
          String.fromCharCode(char.charCodeAt(0) & 0xff)
        ).join('');
        base64Content = btoa(binaryString);
      } else {
        // Handle other content types
        base64Content = btoa(content);
      }
      
      return `data:${mimeType};base64,${base64Content}`;
      
    } catch (error) {
      console.error('Error creating data URL:', error);
      setAssetError('Failed to process asset content');
      return null;
    }
  }, [content, fileExtension]);

  // Calculate file size
  const getFileSize = () => {
    if (!content) return 'Unknown';
    
    const bytes = content.length;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Handle zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.2, 5.0));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.2, 0.1));
  };

  const handleZoomReset = () => {
    setZoomLevel(1.0);
  };

  // Handle fullscreen toggle
  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    
    trackStudyAction('asset_fullscreen', resource, {
      assetType,
      fileName,
      fullscreen: !isFullscreen
    });
  };

  // Handle download
  const handleDownload = () => {
    const dataUrl = createDataUrl();
    if (!dataUrl) return;
    
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    trackStudyAction('asset_download', resource, {
      assetType,
      fileName,
      fileSize: getFileSize()
    });
  };

  // Get metadata on load
  useEffect(() => {
    if (assetType === 'image') {
      const dataUrl = createDataUrl();
      if (dataUrl) {
        const img = new Image();
        img.onload = () => {
          setAssetMetadata({
            width: img.naturalWidth,
            height: img.naturalHeight,
            aspectRatio: (img.naturalWidth / img.naturalHeight).toFixed(2)
          });
        };
        img.onerror = () => {
          setAssetError('Failed to load image');
        };
        img.src = dataUrl;
      }
    }
  }, [assetType, createDataUrl]);

  // Track asset view
  useEffect(() => {
    trackStudyAction('asset_view', resource, {
      assetType,
      fileName,
      fileExtension,
      fileSize: getFileSize()
    });
  }, [assetType, fileName, fileExtension, resource, trackStudyAction]);

  if (assetType === 'unknown') {
    return (
      <div className={styles.assetLens}>
        <div className={styles.header}>
          <h3>📎 Asset Viewer</h3>
          <span className={styles.fileName}>{fileName}</span>
        </div>
        <div className={styles.unsupportedContent}>
          <div className={styles.unsupportedIcon}>❓</div>
          <h4>Unsupported File Type</h4>
          <p>This file type (.{fileExtension}) is not supported by the Asset Viewer.</p>
          <p>Supported formats:</p>
          <ul>
            <li><strong>Images:</strong> PNG, JPG, GIF, SVG, WebP, BMP</li>
            <li><strong>Documents:</strong> PDF</li>
            <li><strong>Videos:</strong> MP4, WebM, MOV</li>
            <li><strong>Audio:</strong> MP3, WAV, OGG</li>
          </ul>
          <button className={styles.downloadButton} onClick={handleDownload}>
            💾 Download File
          </button>
        </div>
      </div>
    );
  }

  if (assetError) {
    return (
      <div className={styles.assetLens}>
        <div className={styles.header}>
          <h3>📎 Asset Viewer</h3>
          <span className={styles.fileName}>{fileName}</span>
        </div>
        <div className={styles.errorContent}>
          <div className={styles.errorIcon}>⚠️</div>
          <h4>Asset Loading Error</h4>
          <p>{assetError}</p>
          <button className={styles.downloadButton} onClick={handleDownload}>
            💾 Try Download
          </button>
        </div>
      </div>
    );
  }

  const dataUrl = createDataUrl();

  return (
    <div className={`${styles.assetLens} ${isFullscreen ? styles.fullscreen : ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <h3>📎 Asset Viewer</h3>
        <span className={styles.fileName}>{fileName}</span>
        <div className={styles.assetInfo}>
          {assetType} • {getFileSize()}
          {assetMetadata && assetType === 'image' && (
            <span> • {assetMetadata.width}×{assetMetadata.height}</span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>
            Zoom: {Math.round(zoomLevel * 100)}%
          </label>
          <div className={styles.zoomControls}>
            <button
              className={styles.controlButton}
              onClick={handleZoomOut}
              title="Zoom out"
            >
              🔍-
            </button>
            <button
              className={styles.controlButton}
              onClick={handleZoomReset}
              title="Reset zoom"
            >
              🎯
            </button>
            <button
              className={styles.controlButton}
              onClick={handleZoomIn}
              title="Zoom in"
            >
              🔍+
            </button>
          </div>
        </div>

        <div className={styles.actionControls}>
          <button
            className={styles.controlButton}
            onClick={handleFullscreen}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? '🗗' : '🗖'}
          </button>
          <button
            className={styles.controlButton}
            onClick={handleDownload}
            title="Download file"
          >
            💾
          </button>
        </div>
      </div>

      {/* Asset Content */}
      <div className={styles.assetContainer}>
        <div className={styles.assetContent} style={{ transform: `scale(${zoomLevel})` }}>
          {assetType === 'image' && dataUrl && (
            <img
              src={dataUrl}
              alt={fileName}
              className={styles.assetImage}
              onError={() => setAssetError('Failed to display image')}
            />
          )}

          {assetType === 'video' && dataUrl && (
            <video
              src={dataUrl}
              controls
              className={styles.assetVideo}
              onError={() => setAssetError('Failed to display video')}
            >
              <p>Your browser doesn't support HTML5 video.</p>
            </video>
          )}

          {assetType === 'audio' && dataUrl && (
            <div className={styles.audioContainer}>
              <div className={styles.audioIcon}>🎵</div>
              <audio
                src={dataUrl}
                controls
                className={styles.assetAudio}
                onError={() => setAssetError('Failed to play audio')}
              >
                <p>Your browser doesn't support HTML5 audio.</p>
              </audio>
            </div>
          )}

          {assetType === 'document' && dataUrl && (
            <div className={styles.documentContainer}>
              <iframe
                src={dataUrl}
                className={styles.assetDocument}
                title={fileName}
                onError={() => setAssetError('Failed to display document')}
              />
              <div className={styles.documentFallback}>
                <p>PDF preview not supported in your browser.</p>
                <button className={styles.downloadButton} onClick={handleDownload}>
                  💾 Download PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Asset Information */}
      <div className={styles.assetMetadata}>
        <h4>📋 File Information</h4>
        <div className={styles.metadataGrid}>
          <div className={styles.metadataItem}>
            <span className={styles.metadataLabel}>File Name:</span>
            <span className={styles.metadataValue}>{fileName}</span>
          </div>
          <div className={styles.metadataItem}>
            <span className={styles.metadataLabel}>File Type:</span>
            <span className={styles.metadataValue}>{fileExtension.toUpperCase()}</span>
          </div>
          <div className={styles.metadataItem}>
            <span className={styles.metadataLabel}>File Size:</span>
            <span className={styles.metadataValue}>{getFileSize()}</span>
          </div>
          {assetMetadata && assetType === 'image' && (
            <>
              <div className={styles.metadataItem}>
                <span className={styles.metadataLabel}>Dimensions:</span>
                <span className={styles.metadataValue}>
                  {assetMetadata.width} × {assetMetadata.height}
                </span>
              </div>
              <div className={styles.metadataItem}>
                <span className={styles.metadataLabel}>Aspect Ratio:</span>
                <span className={styles.metadataValue}>{assetMetadata.aspectRatio}:1</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Usage Instructions */}
      <div className={styles.instructions}>
        <h4>💡 Asset Viewer Tips</h4>
        <ul>
          <li>Use zoom controls to inspect details in images</li>
          <li>Click fullscreen for better viewing of large assets</li>
          <li>Download files to view them in external applications</li>
          <li>Videos and audio files include standard media controls</li>
          {assetType === 'document' && (
            <li>PDF files may require download for full functionality</li>
          )}
        </ul>
      </div>

      {/* Fullscreen overlay */}
      {isFullscreen && (
        <div className={styles.fullscreenOverlay} onClick={handleFullscreen}>
          <div className={styles.fullscreenContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.fullscreenClose} onClick={handleFullscreen}>
              ✕
            </button>
            <div className={styles.fullscreenAsset} style={{ transform: `scale(${zoomLevel})` }}>
              {assetType === 'image' && dataUrl && (
                <img src={dataUrl} alt={fileName} className={styles.fullscreenImage} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetLens;