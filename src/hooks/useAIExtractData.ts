import { useState, useCallback } from 'react';
import { aiService, ExtractClinicalDataResponse } from '@/services';

interface UseAIExtractDataOptions {
  onError?: (error: Error) => void;
  onSuccess?: (data: ExtractClinicalDataResponse) => void;
}

interface UseAIExtractDataReturn {
  extractedData: ExtractClinicalDataResponse | null;
  isExtracting: boolean;
  error: Error | null;
  extractData: (freeText: string) => Promise<void>;
  clearData: () => void;
}

export function useAIExtractData(options: UseAIExtractDataOptions = {}): UseAIExtractDataReturn {
  const { onError, onSuccess } = options;

  const [extractedData, setExtractedData] = useState<ExtractClinicalDataResponse | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const extractData = useCallback(
    async (freeText: string) => {
      if (!freeText.trim()) {
        const error = new Error('Free text cannot be empty');
        setError(error);
        if (onError) onError(error);
        return;
      }

      setIsExtracting(true);
      setError(null);

      try {
        const response = await aiService.extractClinicalData({
          freeText,
        });

        setExtractedData(response);
        
        if (onSuccess) {
          onSuccess(response);
        }
      } catch (err) {
        const error = err as Error;
        setError(error);
        setExtractedData(null);
        
        if (onError) {
          onError(error);
        }
      } finally {
        setIsExtracting(false);
      }
    },
    [onError, onSuccess]
  );

  const clearData = useCallback(() => {
    setExtractedData(null);
    setError(null);
    setIsExtracting(false);
  }, []);

  return {
    extractedData,
    isExtracting,
    error,
    extractData,
    clearData,
  };
}
