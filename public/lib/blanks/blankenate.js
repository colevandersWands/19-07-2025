// SL1 Blanks Generation Logic
// Uses Acorn parser to intelligently create blanks based on AST analysis

// JavaScript keywords that can be blanked
const jsKeywords = new Set([
  'function', 'if', 'else', 'for', 'while', 'do', 'return', 'const', 'let', 'var',
  'class', 'extends', 'import', 'export', 'from', 'as', 'default', 'try', 'catch',
  'finally', 'throw', 'new', 'this', 'super', 'switch', 'case', 'break', 'continue',
  'typeof', 'instanceof', 'in', 'of', 'async', 'await', 'yield', 'static'
]);

// Check if an identifier is a JavaScript keyword
const isKeyword = (name) => jsKeywords.has(name);

// Find the position of an operator in the source code
const findOperatorPosition = (code, node) => {
  // Simple heuristic: look for the operator between the start and end of the node
  const nodeText = code.substring(node.start, node.end);
  const operatorIndex = nodeText.indexOf(node.operator);
  if (operatorIndex !== -1) {
    return node.start + operatorIndex;
  }
  return -1;
};

const blankenate = (
  code,
  probability = 0.2,
  config = {
    keywords: true,
    identifiers: true,
    literals: false,
    operators: false,
  }
) => {
  const blank = "__";

  let tree = null;
  try {
    tree = acorn.parse(code, { ecmaVersion: 2022, sourceType: 'module' });
  } catch (err) {
    console.error('Parse error:', err);
    return null;
  }

  const blankedTokens = [];

  // Simple AST walker for blanking
  const walkNode = (node) => {
    if (!node || typeof node !== 'object') return;

    // Blank identifiers
    if (
      config.identifiers &&
      node.type === "Identifier" &&
      Math.random() < probability
    ) {
      blankedTokens.push({
        start: node.start,
        end: node.end,
        original: node.name,
        type: 'identifier'
      });
    }

    // Blank literals
    if (
      config.literals &&
      (node.type === "Literal" || node.type === "RegExpLiteral") &&
      Math.random() < probability
    ) {
      blankedTokens.push({
        start: node.start,
        end: node.end,
        original: node.value,
        type: 'literal'
      });
    }

    // Blank keywords - check various node types for keywords
    if (config.keywords && Math.random() < probability) {
      let keywordFound = false;
      let keywordName = '';
      
      // Check different node types that can contain keywords
      if (node.type === "FunctionDeclaration" || node.type === "FunctionExpression") {
        keywordFound = true;
        keywordName = 'function';
      } else if (node.type === "IfStatement") {
        keywordFound = true;
        keywordName = 'if';
      } else if (node.type === "ForStatement" || node.type === "ForInStatement" || node.type === "ForOfStatement") {
        keywordFound = true;
        keywordName = 'for';
      } else if (node.type === "WhileStatement") {
        keywordFound = true;
        keywordName = 'while';
      } else if (node.type === "ReturnStatement") {
        keywordFound = true;
        keywordName = 'return';
      } else if (node.type === "VariableDeclaration") {
        keywordFound = true;
        keywordName = node.kind; // const, let, var
      } else if (node.type === "ClassDeclaration") {
        keywordFound = true;
        keywordName = 'class';
      } else if (node.type === "TryStatement") {
        keywordFound = true;
        keywordName = 'try';
      } else if (node.type === "CatchClause") {
        keywordFound = true;
        keywordName = 'catch';
      } else if (node.type === "ThrowStatement") {
        keywordFound = true;
        keywordName = 'throw';
      } else if (node.type === "NewExpression") {
        keywordFound = true;
        keywordName = 'new';
      }
      
      if (keywordFound) {
        // Find the actual position of the keyword in the source
        const nodeText = code.substring(node.start, node.end);
        const keywordIndex = nodeText.indexOf(keywordName);
        if (keywordIndex !== -1) {
          blankedTokens.push({
            start: node.start + keywordIndex,
            end: node.start + keywordIndex + keywordName.length,
            original: keywordName,
            type: 'keyword'
          });
        }
      }
    }

    // Blank operators (binary, assignment, unary, and update operators)
    if (config.operators && node.operator && Math.random() < probability) {
      let operatorStart = -1;
      
      if (node.type === "BinaryExpression") {
        // For binary expressions, operator is between left and right
        const leftEnd = node.left.end;
        const rightStart = node.right.start;
        const betweenText = code.substring(leftEnd, rightStart);
        const operatorIndex = betweenText.indexOf(node.operator);
        if (operatorIndex !== -1) {
          operatorStart = leftEnd + operatorIndex;
        }
      } else if (node.type === "AssignmentExpression") {
        // Similar to binary expressions
        const leftEnd = node.left.end;
        const rightStart = node.right.start;
        const betweenText = code.substring(leftEnd, rightStart);
        const operatorIndex = betweenText.indexOf(node.operator);
        if (operatorIndex !== -1) {
          operatorStart = leftEnd + operatorIndex;
        }
      } else if (node.type === "UnaryExpression") {
        // For unary expressions, operator is at the beginning
        if (node.prefix) {
          const nodeText = code.substring(node.start, node.argument.start);
          const operatorIndex = nodeText.indexOf(node.operator);
          if (operatorIndex !== -1) {
            operatorStart = node.start + operatorIndex;
          }
        } else {
          // Postfix unary (like i++)
          const nodeText = code.substring(node.argument.end, node.end);
          const operatorIndex = nodeText.indexOf(node.operator);
          if (operatorIndex !== -1) {
            operatorStart = node.argument.end + operatorIndex;
          }
        }
      } else if (node.type === "UpdateExpression") {
        // Update expressions (++ and --)
        if (node.prefix) {
          const nodeText = code.substring(node.start, node.argument.start);
          const operatorIndex = nodeText.indexOf(node.operator);
          if (operatorIndex !== -1) {
            operatorStart = node.start + operatorIndex;
          }
        } else {
          // Postfix
          const nodeText = code.substring(node.argument.end, node.end);
          const operatorIndex = nodeText.indexOf(node.operator);
          if (operatorIndex !== -1) {
            operatorStart = node.argument.end + operatorIndex;
          }
        }
      }
      
      if (operatorStart !== -1) {
        blankedTokens.push({
          start: operatorStart,
          end: operatorStart + node.operator.length,
          original: node.operator,
          type: 'operator'
        });
      }
    }

    // Recursively walk child nodes
    for (const key in node) {
      if (key === 'parent' || key === 'leadingComments' || key === 'trailingComments') continue;
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(walkNode);
      } else if (child && typeof child === 'object') {
        walkNode(child);
      }
    }
  };

  walkNode(tree);

  // Sort blanks by position (reverse order for replacement)
  blankedTokens.sort((a, b) => b.start - a.start);

  // Generate blanked code
  let blankedCode = code;
  const blanks = [];

  for (let i = 0; i < blankedTokens.length; i++) {
    const token = blankedTokens[i];
    const blankId = `blank_${i}`;
    
    blanks.push({
      id: blankId,
      original: token.original,
      type: token.type,
      start: token.start,
      end: token.end
    });

    // Replace with blank placeholder
    blankedCode = blankedCode.substring(0, token.start) + 
                  blank + 
                  blankedCode.substring(token.end);
  }

  return {
    blankedCode,
    blanks: blanks.reverse(), // Return in original order
    originalCode: code
  };
};

// Make it available globally
window.blankenate = blankenate;