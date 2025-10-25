/**
 * Centralized utilities for the landmap core
 */

/**
 * Get the default worker endpoint based on environment
 * Checks multiple environment variable sources and provides sensible fallbacks
 * 
 * Priority order:
 * 1. Vite environment variables (import.meta.env.VITE_WORKER_ENDPOINT)
 * 2. Process environment variables (process.env.REACT_APP_WORKER_ENDPOINT)
 * 3. Dynamic window location (for development)
 * 4. Fallback to localhost:8787
 */
export function getDefaultWorkerEndpoint(): string {
  // Check Vite environment variables first (most common in modern builds)
  if (typeof window !== 'undefined' && (import.meta as any).env?.VITE_WORKER_ENDPOINT) {
    return (import.meta as any).env.VITE_WORKER_ENDPOINT;
  }

  // Check process environment variables (for Node.js environments)
  if (typeof process !== 'undefined' && process.env?.REACT_APP_WORKER_ENDPOINT) {
    return process.env.REACT_APP_WORKER_ENDPOINT;
  }

  // Dynamic endpoint based on current window location (for local development)
  if (typeof window !== 'undefined' && window.location) {
    return `${window.location.protocol}//${window.location.hostname}:8787`;
  }

  // Final fallback
  return 'http://localhost:8787';
}

/**
 * Default worker endpoint - computed once and cached
 */
export const DEFAULT_WORKER_ENDPOINT = getDefaultWorkerEndpoint();
