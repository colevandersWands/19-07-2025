/**
 * Spiral Lens Global Utility Registry
 * Simple function registry for lens utilities - KISS approach
 */

// Mock utilities for development and testing
const mockUtilities = {
  /**
   * Run code in a safe sandbox environment
   * @param {Object} resource - The file resource object
   */
  runCode(resource) {
    const langName = getLangName(resource.lang);
    alert(`🚀 Running ${langName} code: ${resource.name}`);
    // console.log('📋 Code to run:', resource);
    // console.log('💻 Code content:', resource.content);
    
    // In future: actual code execution
    setTimeout(() => {
      // console.log('✅ Code execution completed (mocked)');
    }, 1000);
  },

  /**
   * Generate execution trace for code using SL1 trace system
   * @param {Object} resource - The file resource object
   */
  trace(resource) {
    const langName = getLangName(resource.lang);
    // console.log(`🔍 Tracing ${langName} execution: ${resource.name}`);
    
    // Load SL1 trace system if not already loaded
    if (!window.trace) {
      console.error('SL1 trace system not loaded. Make sure trace dependencies are available.');
      return null;
    }
    
    try {
      // Use actual SL1 trace function
      window.trace(resource.content);
      
      // The trace output goes to console - SL1 doesn't return data directly
      // but logs trace steps to console which can be captured by trace listeners
      // console.log('🔍 Trace execution completed for:', resource.name);
      
      return {
        success: true,
        method: 'SL1_trace_system',
        language: resource.lang,
        fileName: resource.name
      };
    } catch (error) {
      console.error('🚨 Trace execution error:', error);
      return {
        success: false,
        error: error.message,
        language: resource.lang,
        fileName: resource.name
      };
    }
  },

  /**
   * Open code in external JS Tutor for visualization
   * @param {Object} resource - The file resource object
   */
  openInJSTutor(resource) {
    alert(`📖 Opening in JS Tutor: ${resource.name}`);
    console.log('🌐 Opening external tool for:', resource);
    
    if (resource.lang === '.js' || resource.lang === '.py') {
      // Construct JS Tutor URL
      const code = encodeURIComponent(resource.content);
      const lang = resource.lang === '.py' ? 'python' : 'javascript';
      const url = `http://pythontutor.com/iframe-embed.html#code=${code}&origin=opt_frontend.js&cumulative=false&heapPrimitives=nevernest&textReferences=false&py=${lang === 'python' ? '3' : 'js'}&rawInputLstJSON=%5B%5D&curInstr=0`;
      
      console.log('🔗 JS Tutor URL:', url);
      window.open(url, '_blank', 'width=1000,height=700');
    } else {
      alert(`JS Tutor not available for ${resource.lang} files`);
    }
  },

  /**
   * Create interactive trace table UI
   * @param {Object} data - Trace data to display
   */
  createTraceTable(data) {
    alert(`📊 Creating trace table with ${data?.steps?.length || 0} steps`);
    console.log('📋 Trace table data:', data);
    
    // In future: create actual draggable trace table component
    // For now, just log the data structure
    if (data?.steps) {
      console.table(data.steps);
    }
  },

  /**
   * Format code using appropriate formatter
   * @param {Object} resource - The file resource object
   */
  formatCode(resource) {
    const langName = getLangName(resource.lang);
    alert(`✨ Formatting ${langName} code: ${resource.name}`);
    console.log('🎨 Formatting code for:', resource);
    
    // In future: integrate Prettier, Black, etc.
    console.log('✅ Code formatted (mocked)');
  },

  /**
   * Analyze code structure and generate AST
   * @param {Object} resource - The file resource object
   */
  analyzeAST(resource) {
    const langName = getLangName(resource.lang);
    alert(`🌳 Analyzing AST for ${langName}: ${resource.name}`);
    console.log('🔬 AST analysis for:', resource);
    
    // Mock AST data
    const mockAST = {
      type: 'Program',
      body: [
        { type: 'VariableDeclaration', line: 1 },
        { type: 'FunctionDeclaration', line: 3 },
        { type: 'ExpressionStatement', line: 8 }
      ],
      language: resource.lang,
      nodeCount: 15
    };
    
    console.log('🌳 Generated AST:', mockAST);
    return mockAST;
  }
};

/**
 * Get human-readable language name
 * @param {string} lang - Language extension (.js, .py, etc.)
 * @returns {string} Human-readable name
 */
function getLangName(lang) {
  const langMap = {
    '.js': 'JavaScript',
    '.jsx': 'React JSX', 
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript JSX',
    '.py': 'Python',
    '.html': 'HTML',
    '.css': 'CSS',
    '.md': 'Markdown',
    '.json': 'JSON'
  };
  return langMap[lang] || 'Unknown';
}

/**
 * Initialize the global utility registry
 * Call this when the main app loads
 */
export function initializeSpiralLens() {
  // Make utilities globally available
  window.spiralLens = mockUtilities;
  
  console.log('🎯 Spiral Lens utilities initialized');
  console.log('📚 Available utilities:', Object.keys(mockUtilities));
  
  // Add debugging helper
  window.spiralLens.debug = () => {
    console.log('🔧 Spiral Lens Debug Info:');
    console.log('Available utilities:', Object.keys(mockUtilities));
    console.log('Registry object:', window.spiralLens);
  };
}

// Auto-initialize if this script is loaded directly
if (typeof window !== 'undefined') {
  initializeSpiralLens();
}