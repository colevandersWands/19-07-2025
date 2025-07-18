import { useState, useCallback } from 'preact/hooks';

/**
 * Exercise Manager - handles exercise component lifecycle and storage
 * Components are stored directly on resource objects for simplicity
 */

// Language-based exercise defaults
const getDefaultExercise = (lang) => {
  const exerciseMap = {
    '.js': 'edit',
    '.jsx': 'edit', 
    '.ts': 'edit',
    '.tsx': 'edit',
    '.py': 'edit',
    '.css': 'highlight',
    '.scss': 'highlight',
    '.html': 'highlight',
    '.md': 'render',
    '.json': 'highlight',
  };
  
  return exerciseMap[lang] || 'edit';
};

// Transform defaults based on exercise type
const getDefaultTransforms = (exerciseType, lang) => {
  // For now, no default transforms - students can add pseudocode manually
  return [];
};

/**
 * Hook for managing exercise components on resources
 */
export const useExerciseManager = () => {
  const [exerciseCache, setExerciseCache] = useState(new Map());
  
  /**
   * Get or create an exercise component for a resource
   */
  const getOrCreateExercise = useCallback(async (resource, exerciseType) => {
    if (!resource) return null;
    
    // Initialize exerciseComponents if it doesn't exist
    if (!resource.exerciseComponents) {
      resource.exerciseComponents = {};
    }
    
    // Return existing component if available
    if (resource.exerciseComponents[exerciseType]) {
      return resource.exerciseComponents[exerciseType];
    }
    
    // Create new exercise component
    try {
      console.log(`🏗️ Attempting to load exercise: ${exerciseType} for resource:`, resource);
      
      // For now, let's import the study exercise directly to avoid dynamic import issues
      if (exerciseType === 'edit' || exerciseType === 'study') {
        console.log('📦 Importing study exercise...');
        const studyModule = await import('../../src/lenses/StudyLens.jsx');
        console.log('📦 Study module imported:', studyModule);
        const StudyExercise = studyModule.default;
        console.log('📦 Study exercise component:', StudyExercise);
        
        // Create component instance and store it on the resource
        const componentInstance = () => (
          <StudyExercise 
            resource={resource}
            key={`${resource.path}-${exerciseType}`}
          />
        );
        
        resource.exerciseComponents[exerciseType] = componentInstance;
        console.log(`✅ Study exercise loaded for ${resource.name}`);
        return componentInstance;
      }
      
      // For other exercise types, fall back to edit for now
      console.log(`⚠️ Exercise type ${exerciseType} not implemented yet, falling back to edit`);
      return getOrCreateExercise(resource, 'edit');
      
    } catch (error) {
      console.error(`❌ Failed to load exercise: ${exerciseType}`, error);
      
      // Ultimate fallback - simple text display
      const fallbackComponent = () => (
        <div style={{ padding: '20px', fontFamily: 'monospace' }}>
          <h3>Exercise not available: {exerciseType}</h3>
          <pre>{resource.content}</pre>
        </div>
      );
      
      resource.exerciseComponents[exerciseType] = fallbackComponent;
      return fallbackComponent;
    }
  }, []);
  
  /**
   * Apply transforms to a resource before exercise rendering
   */
  const applyTransforms = useCallback(async (resource, transforms) => {
    if (!transforms || transforms.length === 0) {
      return resource;
    }
    
    let transformedResource = { ...resource };
    
    // Apply transforms sequentially
    for (const transformName of transforms) {
      try {
        const transformModule = await import(`../../transforms/${transformName}/index.js`);
        const transformFn = transformModule.default;
        
        transformedResource = await transformFn({
          resource: transformedResource,
          config: {}, // TODO: Add transform-specific config
          query: {}   // TODO: Add query parameters
        });
      } catch (error) {
        console.error(`Failed to apply transform: ${transformName}`, error);
        // Continue with other transforms
      }
    }
    
    return transformedResource;
  }, []);
  
  /**
   * Get the appropriate exercise type for a resource
   */
  const getExerciseForResource = useCallback((resource, preferredExercise) => {
    if (preferredExercise) {
      return preferredExercise;
    }
    
    return getDefaultExercise(resource.lang);
  }, []);
  
  /**
   * Clean up cached components (call when needed for memory management)
   */
  const cleanupComponents = useCallback((resource) => {
    if (resource && resource.exerciseComponents) {
      // Remove all cached components for this resource
      resource.exerciseComponents = {};
    }
  }, []);
  
  /**
   * Check if a resource has cached components
   */
  const hasComponents = useCallback((resource) => {
    return resource && 
           resource.exerciseComponents && 
           Object.keys(resource.exerciseComponents).length > 0;
  }, []);
  
  return {
    getOrCreateExercise,
    applyTransforms,
    getExerciseForResource,
    cleanupComponents,
    hasComponents,
    getDefaultExercise,
    getDefaultTransforms,
  };
};

/**
 * Utility function to enhance a resource with exercise capabilities
 */
export const enhanceResourceForExercises = (resource) => {
  if (!resource.exerciseComponents) {
    resource.exerciseComponents = {};
  }
  
  if (!resource.modifications) {
    resource.modifications = {
      content: resource.content,
      timestamp: Date.now(),
      hasChanges: false,
    };
  }
  
  return resource;
};