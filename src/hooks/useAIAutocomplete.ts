import { useState, useCallback, useRef, useEffect } from 'react';
import { aiService } from '@/services';

interface UseAIAutocompleteOptions {
  debounceMs?: number;
  minChars?: number;
  context?: string;
  completionType?: 'word' | 'sentence';
  onError?: (error: Error) => void;
}

interface UseAIAutocompleteReturn {
  suggestions: string[];
  isLoading: boolean;
  error: Error | null;
  getSuggestions: (text: string) => Promise<void>;
  clearSuggestions: () => void;
}

export function useAIAutocomplete(options: UseAIAutocompleteOptions = {}): UseAIAutocompleteReturn {
  const {
    debounceMs = 500,
    minChars = 3,
    context = '',
    completionType = 'word',
    onError,
  } = options;

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const getSuggestions = useCallback(
    async (text: string) => {
      
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      if (text.length < minChars) {
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

          const response = await aiService.autocomplete({
            partialText: text,
            context,
            completionType,
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
    [context, debounceMs, minChars, onError]
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
