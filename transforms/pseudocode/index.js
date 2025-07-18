/**
 * Pseudocode Transform - Convert code to readable pseudocode
 */

/**
 * Convert JavaScript/TypeScript to pseudocode
 */
const convertToPseudocode = (content, lang) => {
  const lines = content.split('\n');
  
  const pseudocodeLines = lines.map(line => {
    const trimmed = line.trim();
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
      return line;
    }
    
    // Get indentation
    const indent = line.match(/^(\s*)/)[1];
    
    // Convert common patterns to pseudocode
    let pseudocode = trimmed;
    
    // Function declarations
    pseudocode = pseudocode.replace(/^(export\s+)?function\s+(\w+)\s*\([^)]*\)\s*\{?/, 
      (match, exp, name) => `FUNCTION ${name}:`);
    
    // Arrow functions
    pseudocode = pseudocode.replace(/^const\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*\{?/, 
      (match, name) => `FUNCTION ${name}:`);
    
    // Variable declarations
    pseudocode = pseudocode.replace(/^(const|let|var)\s+(\w+)\s*=\s*(.+);?$/, 
      (match, type, name, value) => `SET ${name} TO ${value}`);
    
    // If statements
    pseudocode = pseudocode.replace(/^if\s*\(([^)]+)\)\s*\{?/, 
      (match, condition) => `IF ${condition} THEN`);
    
    // Else statements
    pseudocode = pseudocode.replace(/^else\s+if\s*\(([^)]+)\)\s*\{?/, 
      (match, condition) => `ELSE IF ${condition} THEN`);
    pseudocode = pseudocode.replace(/^else\s*\{?/, 'ELSE');
    
    // For loops
    pseudocode = pseudocode.replace(/^for\s*\(([^)]+)\)\s*\{?/, 
      (match, condition) => `FOR ${condition} DO`);
    
    // While loops
    pseudocode = pseudocode.replace(/^while\s*\(([^)]+)\)\s*\{?/, 
      (match, condition) => `WHILE ${condition} DO`);
    
    // Return statements
    pseudocode = pseudocode.replace(/^return\s+(.+);?$/, 
      (match, value) => `RETURN ${value}`);
    
    // Console.log and similar
    pseudocode = pseudocode.replace(/console\.log\(([^)]+)\);?/, 
      (match, args) => `PRINT ${args}`);
    
    // Remove semicolons and curly braces
    pseudocode = pseudocode.replace(/;$/, '');
    pseudocode = pseudocode.replace(/^\{$/, 'BEGIN');
    pseudocode = pseudocode.replace(/^\}$/, 'END');
    
    // Clean up operators
    pseudocode = pseudocode.replace(/===|==/g, 'EQUALS');
    pseudocode = pseudocode.replace(/!==/g, 'NOT EQUALS');
    pseudocode = pseudocode.replace(/&&/g, 'AND');
    pseudocode = pseudocode.replace(/\|\|/g, 'OR');
    pseudocode = pseudocode.replace(/!/g, 'NOT ');
    
    return indent + pseudocode;
  });
  
  return pseudocodeLines.join('\n');
};

/**
 * Convert Python to pseudocode
 */
const convertPythonToPseudocode = (content) => {
  const lines = content.split('\n');
  
  const pseudocodeLines = lines.map(line => {
    const trimmed = line.trim();
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      return line;
    }
    
    // Get indentation
    const indent = line.match(/^(\s*)/)[1];
    
    let pseudocode = trimmed;
    
    // Function definitions
    pseudocode = pseudocode.replace(/^def\s+(\w+)\([^)]*\):\s*$/, 
      (match, name) => `FUNCTION ${name}:`);
    
    // Variable assignments
    pseudocode = pseudocode.replace(/^(\w+)\s*=\s*(.+)$/, 
      (match, name, value) => `SET ${name} TO ${value}`);
    
    // If statements
    pseudocode = pseudocode.replace(/^if\s+(.+):\s*$/, 
      (match, condition) => `IF ${condition} THEN`);
    
    // Elif statements
    pseudocode = pseudocode.replace(/^elif\s+(.+):\s*$/, 
      (match, condition) => `ELSE IF ${condition} THEN`);
    
    // Else statements
    pseudocode = pseudocode.replace(/^else:\s*$/, 'ELSE');
    
    // For loops
    pseudocode = pseudocode.replace(/^for\s+(.+):\s*$/, 
      (match, condition) => `FOR ${condition} DO`);
    
    // While loops
    pseudocode = pseudocode.replace(/^while\s+(.+):\s*$/, 
      (match, condition) => `WHILE ${condition} DO`);
    
    // Return statements
    pseudocode = pseudocode.replace(/^return\s+(.+)$/, 
      (match, value) => `RETURN ${value}`);
    
    // Print statements
    pseudocode = pseudocode.replace(/print\(([^)]+)\)/, 
      (match, args) => `PRINT ${args}`);
    
    // Clean up operators
    pseudocode = pseudocode.replace(/\band\b/g, 'AND');
    pseudocode = pseudocode.replace(/\bor\b/g, 'OR');
    pseudocode = pseudocode.replace(/\bnot\b/g, 'NOT');
    pseudocode = pseudocode.replace(/==/g, 'EQUALS');
    pseudocode = pseudocode.replace(/!=/g, 'NOT EQUALS');
    
    return indent + pseudocode;
  });
  
  return pseudocodeLines.join('\n');
};

/**
 * Main transform function
 */
const pseudocodeTransform = ({ resource, config, query }) => {
  const { content, lang } = resource;
  
  // If this resource is already pseudocode and has been modified, preserve the modifications
  if (resource.isPseudocode && resource.modifications && resource.modifications.pseudocodeContent) {
    return {
      ...resource,
      content: resource.modifications.pseudocodeContent, // Use the modified pseudocode content
      lang: '.txt',
      originalLang: resource.originalLang,
      originalContent: resource.originalContent, // Keep original source
      isPseudocode: true
    };
  }
  
  let pseudocode;
  
  if (['.js', '.jsx', '.ts', '.tsx'].includes(lang)) {
    pseudocode = convertToPseudocode(content, lang);
  } else if (lang === '.py') {
    pseudocode = convertPythonToPseudocode(content);
  } else {
    // For unsupported languages, just return original content
    pseudocode = content;
  }
  
  return {
    ...resource,
    content: pseudocode,
    lang: '.txt', // Change to text format for pseudocode
    originalLang: lang, // Keep track of original language
    originalContent: content, // Preserve original source code
    isPseudocode: true
  };
};

export default pseudocodeTransform;