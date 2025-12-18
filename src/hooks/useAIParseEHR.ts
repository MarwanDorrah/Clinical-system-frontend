import { useState, useCallback } from 'react';
import { aiService, ParseEHRResponse } from '@/services';

interface UseAIParseEHROptions {
  onError?: (error: Error) => void;
  onSuccess?: (data: ParseEHRResponse) => void;
}

interface UseAIParseEHRReturn {
  parsedData: ParseEHRResponse | null;
  isParsing: boolean;
  error: Error | null;
  parseEHR: (largeText: string, patientContext?: string) => Promise<void>;
  clearData: () => void;
}

export function useAIParseEHR(options: UseAIParseEHROptions = {}): UseAIParseEHRReturn {
  const { onError, onSuccess } = options;

  const [parsedData, setParsedData] = useState<ParseEHRResponse | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const parseEHR = useCallback(
    async (largeText: string, patientContext?: string) => {
      if (!largeText.trim()) {
        const error = new Error('Large text cannot be empty');
        setError(error);
        if (onError) onError(error);
        return;
      }

      setIsParsing(true);
      setError(null);

      try {
        const response = await aiService.parseEHR({
          largeText,
          patientContext,
        });

        setParsedData(response);
        
        if (onSuccess) {
          onSuccess(response);
        }
      } catch (err) {
        const error = err as Error;
        setError(error);
        setParsedData(null);
        
        if (onError) {
          onError(error);
        }
      } finally {
        setIsParsing(false);
      }
    },
    [onError, onSuccess]
  );

  const clearData = useCallback(() => {
    setParsedData(null);
    setError(null);
    setIsParsing(false);
  }, []);

  return {
    parsedData,
    isParsing,
    error,
    parseEHR,
    clearData,
  };
}
