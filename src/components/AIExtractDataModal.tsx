import React, { useState } from 'react';
import { useAIExtractData } from '@/hooks/useAIExtractData';
import { ExtractClinicalDataResponse } from '@/services';
import Button from './Button';
import Modal from './Modal';

interface AIExtractDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: ExtractClinicalDataResponse) => void;
}

export const AIExtractDataModal: React.FC<AIExtractDataModalProps> = ({
  isOpen,
  onClose,
  onApply,
}) => {
  const [freeText, setFreeText] = useState('');
  const { extractedData, isExtracting, error, extractData, clearData } = useAIExtractData();

  const handleExtract = async () => {
    await extractData(freeText);
  };

  const handleApply = () => {
    if (extractedData) {
      onApply(extractedData);
      handleClose();
    }
  };

  const handleClose = () => {
    setFreeText('');
    clearData();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Extract Clinical Data with AI">
      <div className="space-y-4">
        {}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
          <strong>How to use:</strong>
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Paste or type free-text clinical notes (e.g., from dictation)</li>
            <li>Click &quot;Extract Data&quot; to analyze the text</li>
            <li>Review extracted data and apply to the form</li>
          </ul>
        </div>

        {}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Free Text Clinical Notes
          </label>
          <textarea
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="Paste or type clinical notes here, e.g.:
Patient has pain on upper left, large cavity on tooth 26, diabetic, takes metformin, moderate gingivitis. Plan: composite filling next week."
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
          />
        </div>

        {}
        <div>
          <Button
            onClick={handleExtract}
            disabled={!freeText.trim() || isExtracting}
            className="w-full"
          >
            {isExtracting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Extracting...
              </>
            ) : (
              'Extract Data with AI'
            )}
          </Button>
        </div>

        {}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
            <strong>Error:</strong> {error.message}
            <br />
            <span className="text-xs">AI assistance is temporarily unavailable. You can continue entering data manually.</span>
          </div>
        )}

        {}
        {extractedData && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <h4 className="text-sm font-semibold text-green-900 mb-3">Extracted Data:</h4>
            <div className="space-y-3 text-sm">
              {extractedData.diagnosis && (
                <div>
                  <span className="font-medium text-gray-700">Diagnosis:</span>
                  <p className="text-gray-900 mt-1">{extractedData.diagnosis}</p>
                </div>
              )}
              
              {extractedData.symptoms && extractedData.symptoms.length > 0 && (
                <div>
                  <span className="font-medium text-gray-700">Symptoms:</span>
                  <ul className="list-disc ml-5 mt-1 text-gray-900">
                    {extractedData.symptoms.map((symptom, index) => (
                      <li key={index}>{symptom}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {extractedData.treatments && extractedData.treatments.length > 0 && (
                <div>
                  <span className="font-medium text-gray-700">Treatments:</span>
                  <ul className="list-disc ml-5 mt-1 text-gray-900">
                    {extractedData.treatments.map((treatment, index) => (
                      <li key={index}>{treatment}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {extractedData.periodontalStatus && (
                <div>
                  <span className="font-medium text-gray-700">Periodontal Status:</span>
                  <p className="text-gray-900 mt-1">{extractedData.periodontalStatus}</p>
                </div>
              )}
              
              {extractedData.medications && extractedData.medications.length > 0 && (
                <div>
                  <span className="font-medium text-gray-700">Medications:</span>
                  <ul className="list-disc ml-5 mt-1 text-gray-900">
                    {extractedData.medications.map((medication, index) => (
                      <li key={index}>{medication}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {extractedData.affectedTeeth && extractedData.affectedTeeth.length > 0 && (
                <div>
                  <span className="font-medium text-gray-700">Affected Teeth:</span>
                  <p className="text-gray-900 mt-1">{extractedData.affectedTeeth.join(', ')}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {}
        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          {extractedData && (
            <Button onClick={handleApply}>
              Apply to Form
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
