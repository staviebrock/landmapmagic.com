import { useState, useEffect, useCallback, useRef } from 'react';
import type { AoiPolygon, AoiQueryOptions, UseAoiQueryReturn } from '../core/types.js';

/**
 * Hook for querying backend APIs with AOI data
 * Supports debouncing, cancellation, and Server-Sent Events for progress
 */
export function useAoiQuery(
  polygon: AoiPolygon | null,
  options: AoiQueryOptions,
  debounceMs: number = 500
): UseAoiQueryReturn {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<number | undefined>(undefined);

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const {
    endpoint,
    method = 'POST',
    headers = {},
    timeout = 30000,
    enableSSE = false,
    onProgress,
  } = options;

  // Cancel any ongoing request
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    setLoading(false);
    setProgress(undefined);
  }, []);

  // Execute the query
  const executeQuery = useCallback(async (aoiPolygon: AoiPolygon) => {
    cancel(); // Cancel any existing request

    setLoading(true);
    setError(undefined);
    setProgress(undefined);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const requestBody = {
        aoi: aoiPolygon,
        timestamp: new Date().toISOString(),
      };

      const requestOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: method === 'POST' ? JSON.stringify(requestBody) : undefined,
        signal: abortController.signal,
      };

      // Handle timeout
      const timeoutId = setTimeout(() => {
        abortController.abort();
      }, timeout);

      let url = endpoint;
      if (method === 'GET') {
        const params = new URLSearchParams({
          aoi: JSON.stringify(aoiPolygon),
        });
        url += `?${params.toString()}`;
      }

      // Handle Server-Sent Events for progress
      if (enableSSE && method === 'POST') {
        const sseUrl = `${endpoint}/stream`;
        const eventSource = new EventSource(sseUrl);
        eventSourceRef.current = eventSource;

        eventSource.onmessage = (event) => {
          try {
            const progressData = JSON.parse(event.data);
            if (progressData.progress !== undefined) {
              setProgress(progressData.progress);
              onProgress?.(progressData.progress, progressData.message);
            }
            if (progressData.complete && progressData.data) {
              setData(progressData.data);
              setLoading(false);
              eventSource.close();
              eventSourceRef.current = null;
            }
          } catch (err) {
            console.warn('Failed to parse SSE data:', err);
          }
        };

        eventSource.onerror = () => {
          eventSource.close();
          eventSourceRef.current = null;
          // Fall back to regular fetch if SSE fails
          executeRegularFetch();
        };

        // Send the initial request to start the SSE stream
        await fetch(url, {
          ...requestOptions,
          headers: {
            ...requestOptions.headers,
            'Accept': 'text/event-stream',
          },
        });

        return;
      }

      // Regular fetch request
      async function executeRegularFetch() {
        const response = await fetch(url, requestOptions);
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        setData(result);
        setLoading(false);
      }

      await executeRegularFetch();

    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          // Request was cancelled, don't set error
          return;
        }
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
      setLoading(false);
    } finally {
      abortControllerRef.current = null;
      setProgress(undefined);
    }
  }, [endpoint, method, headers, timeout, enableSSE, onProgress, cancel]);

  // Debounced query execution
  const debouncedQuery = useCallback((aoiPolygon: AoiPolygon) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      executeQuery(aoiPolygon);
    }, debounceMs);
  }, [executeQuery, debounceMs]);

  // Refetch function
  const refetch = useCallback(() => {
    if (polygon) {
      executeQuery(polygon);
    }
  }, [polygon, executeQuery]);

  // Effect to trigger query when polygon changes
  useEffect(() => {
    if (polygon) {
      debouncedQuery(polygon);
    } else {
      cancel();
      setData(null);
      setError(undefined);
    }

    return () => {
      cancel();
    };
  }, [polygon, debouncedQuery, cancel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    data,
    error,
    loading,
    progress,
    refetch,
    cancel,
  };
}
