import { useEffect, useRef } from 'preact/hooks';
import { useColorize } from '../context/ColorizeContext.jsx';

/**
 * CodeBlock component that conditionally applies Prism.js syntax highlighting
 * based on the global colorize setting
 */
const CodeBlock = ({ 
  children, 
  language = 'javascript', 
  className = '',
  style = {},
  ...props 
}) => {
  const { enableColorize } = useColorize();
  const codeRef = useRef(null);

  useEffect(() => {
    if (enableColorize && codeRef.current && window.Prism) {
      // Apply Prism highlighting if enabled and Prism is available
      window.Prism.highlightElement(codeRef.current);
    }
  }, [enableColorize, children]);

  const prismClass = enableColorize ? `language-${language}` : '';
  const combinedClassName = `${prismClass} ${className}`.trim();

  return (
    <pre className={className} style={style} {...props}>
      <code 
        ref={codeRef}
        className={combinedClassName}
      >
        {children}
      </code>
    </pre>
  );
};

/**
 * Simple code span for inline code
 */
export const InlineCode = ({ 
  children, 
  language = 'javascript', 
  className = '',
  ...props 
}) => {
  const { enableColorize } = useColorize();
  const codeRef = useRef(null);

  useEffect(() => {
    if (enableColorize && codeRef.current && window.Prism) {
      window.Prism.highlightElement(codeRef.current);
    }
  }, [enableColorize, children]);

  const prismClass = enableColorize ? `language-${language}` : '';
  const combinedClassName = `${prismClass} ${className}`.trim();

  return (
    <code 
      ref={codeRef}
      className={combinedClassName}
      {...props}
    >
      {children}
    </code>
  );
};

export default CodeBlock;