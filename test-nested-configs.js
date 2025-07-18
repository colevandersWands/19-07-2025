/**
 * Test script for nested configuration inheritance
 * 
 * This demonstrates how the virtual filesystem config loading works
 * with hierarchical lenses.json files that inherit and override settings
 * from parent to child directories.
 */

import { readFileSync } from 'fs';
import { loadConfigFromVirtualFS } from './config/index.js';

// Load the test virtual filesystem
const testFS = JSON.parse(readFileSync('./examples-nested-configs.json', 'utf8'));

console.log('🧪 Testing nested configuration inheritance\n');

// Test cases showing different directory levels
const testPaths = [
  '/nested-config-test/frontend/components/Button.jsx',
  '/nested-config-test/frontend/utils/helpers.js', 
  '/nested-config-test/backend/api/server.js',
  '/nested-config-test/docs/README.md'
];

for (const path of testPaths) {
  console.log(`\n📍 Testing path: ${path}`);
  
  try {
    const config = await loadConfigFromVirtualFS(path, testFS);
    
    console.log('📋 Merged configuration:');
    console.log('   embed.template:', config.lenses?.embed?.template || 'not set');
    console.log('   embed.features.copy:', config.lenses?.embed?.features?.copy ?? 'not set');
    console.log('   ast.expandDepth:', config.lenses?.ast?.expandDepth || 'not set');
    console.log('   ast.highlight.style:', config.lenses?.ast?.highlight?.style || 'not set');
    console.log('   lines.numbers:', config.lenses?.lines?.numbers ?? 'not set');
    
    // Show inheritance chain
    const pathParts = path.split('/').filter(p => p);
    console.log('🔗 Config chain:', pathParts.map((_, i) => 
      '/' + pathParts.slice(0, i + 1).join('/') + '/lenses.json'
    ).join(' → '));
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

console.log('\n✅ Nested configuration test complete');
console.log('\n📝 What this demonstrates:');
console.log('   • Root config provides base educational template');
console.log('   • Frontend overrides with interactive features');
console.log('   • Components level adds React-specific settings');
console.log('   • Backend uses API-focused minimal styling');
console.log('   • Docs level optimizes for clean documentation');
console.log('   • Each level inherits from parents but can override any setting');