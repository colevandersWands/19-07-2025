import { Component } from 'preact';
import styles from './ErrorBoundary.module.css';

/**
 * Error Boundary Component - Catches JavaScript errors anywhere in the component tree
 * and displays a fallback UI instead of crashing the entire application
 * @param {Object} props - Component props
 * @param {JSX.Element} props.children - Child components to wrap
 * @param {function(Error, function): JSX.Element} [props.fallback] - Custom fallback UI function
 * @param {boolean} [props.showDetails=false] - Whether to show error details
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  /**
   * @param {Error} error - The error that was thrown
   * @returns {Object} New state object
   */
  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  /**
   * @param {Error} error - The error that was thrown  
   * @param {Object} errorInfo - Additional error information
   */
  componentDidCatch(error, errorInfo) {
    // Log the error to console for debugging
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Update state with error details
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // You could also log the error to an error reporting service here
    // logErrorToService(error, errorInfo);
  }

  /** Reset error state */
  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      const { fallback, showDetails = false } = this.props;
      
      // Custom fallback UI if provided
      if (fallback) {
        return fallback(this.state.error, this.handleReset);
      }
      
      // Default error UI
      return (
        <div className={styles.errorBoundary}>
          <div className={styles.errorContent}>
            <div className={styles.errorIcon}>⚠️</div>
            <h2 className={styles.errorTitle}>Something went wrong</h2>
            <p className={styles.errorMessage}>
              An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
            </p>
            
            <div className={styles.errorActions}>
              <button 
                className={styles.retryButton}
                onClick={this.handleReset}
              >
                Try Again
              </button>
              <button 
                className={styles.refreshButton}
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </button>
            </div>
            
            {showDetails && this.state.error && (
              <details className={styles.errorDetails}>
                <summary className={styles.errorSummary}>
                  Technical Details
                </summary>
                <div className={styles.errorStack}>
                  <h4>Error:</h4>
                  <pre>{this.state.error.toString()}</pre>
                  
                  {this.state.errorInfo && this.state.errorInfo.componentStack && (
                    <>
                      <h4>Component Stack:</h4>
                      <pre>{this.state.errorInfo.componentStack}</pre>
                    </>
                  )}
                  
                  {this.state.error.stack && (
                    <>
                      <h4>Stack Trace:</h4>
                      <pre>{this.state.error.stack}</pre>
                    </>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;