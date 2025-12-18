import { useState, useCallback, useRef, useEffect } from 'react';
import { aiService } from '@/services';

interface UseAITerminologyOptions {
  debounceMs?: number;
  minChars?: number;
  onError?: (error: Error) => void;
}

interface UseAITerminologyReturn {
  suggestions: string[];
  isLoading: boolean;
  error: Error | null;
  getSuggestions: (term: string) => Promise<void>;
  clearSuggestions: () => void;
}

export function useAITerminology(options: UseAITerminologyOptions = {}): UseAITerminologyReturn {
  const {
    debounceMs = 300,
    minChars = 3,
    onError,
  } = options;

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const getSuggestions = useCallback(
    async (term: string) => {
      
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      if (term.length < minChars) {
        setSuggestions([]);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      debounceTimerRef.current = setTimeout(async () => {
        try {
          abortControllerRef.current = new AbortController();

          const response = await aiService.terminology({
            partialTerm: term,
          });

          setSuggestions(response.suggestions || []);
        } catch (err) {
          const error = err as Error;

          if (error.name === 'AbortError' || error.message.includes('abort')) {
            return;
          }

          setError(error);
          setSuggestions([]);
          
          if (onError) {
            onError(error);
          }
        } finally {
          setIsLoading(false);
        }
      }, debounceMs);
    },
    [debounceMs, minChars, onError]
  );

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
    setIsLoading(false);
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    getSuggestions,
    clearSuggestions,
  };
}
