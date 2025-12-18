import React, { useState } from 'react';
import { useAIGenerateNotes } from '@/hooks/useAIGenerateNotes';
import Button from './Button';
import Modal from './Modal';

interface AIGenerateNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (notes: string) => void;
  patientContext?: string;
}

export const AIGenerateNotesModal: React.FC<AIGenerateNotesModalProps> = ({
  isOpen,
  onClose,
  onApply,
  patientContext,
}) => {
  const [bulletPoints, setBulletPoints] = useState('');
  const [editableNotes, setEditableNotes] = useState('');

  const { generatedNotes, isGenerating, error, generateNotes, clearNotes } = useAIGenerateNotes({
    onSuccess: (notes) => {
      setEditableNotes(notes);
    },
  });

  const handleGenerate = async () => {
    await generateNotes(bulletPoints, patientContext);
  };

  const handleApply = () => {
    if (editableNotes.trim()) {
      onApply(editableNotes);
      handleClose();
    }
  };

  const handleClose = () => {
    setBulletPoints('');
    setEditableNotes('');
    clearNotes();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Generate Clinical Notes with AI">
      <div className="space-y-4">
        {}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
          <strong>How to use:</strong>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Enter quick bullet points or shorthand notes</li>
            <li>Click &quot;Generate Notes&quot; to convert them to professional clinical notes</li>
            <li>Review and edit the generated notes before applying</li>
          </ul>
        </div>

        {}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bullet Points / Quick Notes
          </label>
          <textarea
            value={bulletPoints}
            onChange={(e) => setBulletPoints(e.target.value)}
            placeholder="Enter bullet points, e.g.:
- tooth pain #19
- deep cavity
- allergic penicillin
- recommend root canal"
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {}
        <div>
          <Button
            onClick={handleGenerate}
            disabled={!bulletPoints.trim() || isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              'Generate Notes with AI'
            )}
          </Button>
        </div>

        {}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
            <strong>Error:</strong> {error.message}
            <br />
            <span className="text-xs">AI assistance is temporarily unavailable. You can continue entering notes manually.</span>
          </div>
        )}

        {}
        {editableNotes && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Generated Clinical Notes (Editable)
            </label>
            <textarea
              value={editableNotes}
              onChange={(e) => setEditableNotes(e.target.value)}
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Review and edit the generated notes before applying to the form.
            </p>
          </div>
        )}

        {}
        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          {editableNotes && (
            <Button onClick={handleApply}>
              Apply to Form
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
