import { useState, useCallback } from 'react';
import { aiService } from '@/services';

interface UseAISuggestTreatmentsOptions {
  onError?: (error: Error) => void;
  onSuccess?: (treatments: string[]) => void;
}

interface UseAISuggestTreatmentsReturn {
  treatments: string[];
  isLoading: boolean;
  error: Error | null;
  suggestTreatments: (diagnosis: string, patientHistory?: string) => Promise<void>;
  clearTreatments: () => void;
}

export function useAISuggestTreatments(options: UseAISuggestTreatmentsOptions = {}): UseAISuggestTreatmentsReturn {
  const { onError, onSuccess } = options;

  const [treatments, setTreatments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const suggestTreatments = useCallback(
    async (diagnosis: string, patientHistory?: string) => {
      if (!diagnosis.trim()) {
        const error = new Error('Diagnosis cannot be empty');
        setError(error);
        if (onError) onError(error);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await aiService.suggestTreatments({
          diagnosis,
          patientHistory,
        });

        setTreatments(response.treatments || []);
        
        if (onSuccess) {
          onSuccess(response.treatments || []);
        }
      } catch (err) {
        const error = err as Error;
        setError(error);
        setTreatments([]);
        
        if (onError) {
          onError(error);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [onError, onSuccess]
  );

  const clearTreatments = useCallback(() => {
    setTreatments([]);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    treatments,
    isLoading,
    error,
    suggestTreatments,
    clearTreatments,
  };
}
