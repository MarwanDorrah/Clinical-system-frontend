import { useState, useCallback } from 'react';
import { aiService } from '@/services';

interface UseAIGenerateNotesOptions {
  onError?: (error: Error) => void;
  onSuccess?: (notes: string) => void;
}

interface UseAIGenerateNotesReturn {
  generatedNotes: string | null;
  isGenerating: boolean;
  error: Error | null;
  generateNotes: (bulletPoints: string, patientContext?: string) => Promise<void>;
  clearNotes: () => void;
}

export function useAIGenerateNotes(options: UseAIGenerateNotesOptions = {}): UseAIGenerateNotesReturn {
  const { onError, onSuccess } = options;

  const [generatedNotes, setGeneratedNotes] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generateNotes = useCallback(
    async (bulletPoints: string, patientContext?: string) => {
      if (!bulletPoints.trim()) {
        const error = new Error('Bullet points cannot be empty');
        setError(error);
        if (onError) onError(error);
        return;
      }

      setIsGenerating(true);
      setError(null);

      try {
        const response = await aiService.generateNotes({
          bulletPoints,
          patientContext,
        });

        setGeneratedNotes(response.generatedNotes);
        
        if (onSuccess) {
          onSuccess(response.generatedNotes);
        }
      } catch (err) {
        const error = err as Error;
        setError(error);
        setGeneratedNotes(null);
        
        if (onError) {
          onError(error);
        }
      } finally {
        setIsGenerating(false);
      }
    },
    [onError, onSuccess]
  );

  const clearNotes = useCallback(() => {
    setGeneratedNotes(null);
    setError(null);
    setIsGenerating(false);
  }, []);

  return {
    generatedNotes,
    isGenerating,
    error,
    generateNotes,
    clearNotes,
  };
}
