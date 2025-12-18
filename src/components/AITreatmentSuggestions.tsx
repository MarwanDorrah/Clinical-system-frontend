import React, { useState } from 'react';
import { useAISuggestTreatments } from '@/hooks/useAISuggestTreatments';
import Button from './Button';

interface AITreatmentSuggestionsProps {
  diagnosis: string;
  patientHistory?: string;
  onSelectTreatments: (treatments: string[]) => void;
  className?: string;
}

export const AITreatmentSuggestions: React.FC<AITreatmentSuggestionsProps> = ({
  diagnosis,
  patientHistory,
  onSelectTreatments,
  className = '',
}) => {
  const [selectedTreatments, setSelectedTreatments] = useState<Set<number>>(new Set());
  const { treatments, isLoading, error, suggestTreatments } = useAISuggestTreatments();

  const handleGetSuggestions = async () => {
    setSelectedTreatments(new Set());
    await suggestTreatments(diagnosis, patientHistory);
  };

  const toggleTreatment = (index: number) => {
    const newSelected = new Set(selectedTreatments);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTreatments(newSelected);
  };

  const handleApply = () => {
    const selected = treatments.filter((_, index) => selectedTreatments.has(index));
    onSelectTreatments(selected);
    setSelectedTreatments(new Set());
  };

  if (!diagnosis.trim()) {
    return null;
  }

  return (
    <div className={`bg-purple-50 border border-purple-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-purple-900">AI Treatment Suggestions</h3>
        <Button
          size="sm"
          onClick={handleGetSuggestions}
          disabled={isLoading}
          variant="secondary"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-1 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading...
            </>
          ) : (
            'Get Suggestions'
          )}
        </Button>
      </div>

      {error && (
        <div className="text-xs text-red-600 mb-2">
          AI suggestions unavailable: {error.message}
        </div>
      )}

      {treatments.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-600 mb-2">
            Select treatments to add to the form:
          </p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {treatments.map((treatment, index) => (
              <label
                key={index}
                className="flex items-start gap-2 p-2 hover:bg-purple-100 rounded cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedTreatments.has(index)}
                  onChange={() => toggleTreatment(index)}
                  className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700 flex-1">{treatment}</span>
              </label>
            ))}
          </div>
          
          {selectedTreatments.size > 0 && (
            <div className="flex justify-end pt-2 border-t border-purple-200">
              <Button
                size="sm"
                onClick={handleApply}
              >
                Add {selectedTreatments.size} Selected
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
