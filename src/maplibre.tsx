// Re-export all React hooks and components
export * from './react/index.js';

// Re-export core utilities
export * from './core/index.js';

// Create a MapLibre-specific LandMap component that ensures MapLibre is used
import React from 'react';
import { LandMap as BaseLandMap } from './react/LandMap.js';
import type { LandMapProps } from './core/types.js';

/**
 * MapLibre-specific LandMap component
 * This ensures MapLibre GL JS is used and provides better error messages
 */
export function LandMap(props: LandMapProps) {
  return React.createElement(BaseLandMap, props);
}

// Default export for convenience
export default LandMap;
