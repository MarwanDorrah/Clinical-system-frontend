import React, { useState } from 'react';
import { useAIParseEHR } from '@/hooks/useAIParseEHR';
import { ParseEHRExtractedFields, ParseEHRMedication, ParseEHRProcedure, ParseEHRAffectedTooth, ParseEHRXRay } from '@/services';
import Modal from './Modal';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';

interface AIParseEHRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyData: (fields: ParseEHRExtractedFields) => void;
  patientContext?: string;
}

export function AIParseEHRModal({ isOpen, onClose, onApplyData, patientContext }: AIParseEHRModalProps) {
  const [largeText, setLargeText] = useState('');
  const { parsedData, isParsing, error, parseEHR, clearData } = useAIParseEHR();

  const handleParse = async () => {
    if (!largeText.trim()) return;
    await parseEHR(largeText, patientContext);
  };

  const handleApply = () => {
    if (parsedData?.extractedFields) {
      onApplyData(parsedData.extractedFields);
      handleClose();
    }
  };

  const handleClose = () => {
    setLargeText('');
    clearData();
    onClose();
  };

  const renderFieldValue = (value: string | null) => {
    if (!value) return <span className="text-gray-400 italic">Not detected</span>;
    return <span className="text-gray-900">{value}</span>;
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Extract & Analyze Clinical Data">
      <div className="space-y-4">
        {}
        {!parsedData && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Instructions:</strong> Paste any clinical text (notes, reports, discharge summaries) and AI will automatically extract structured data including diagnosis, medications, procedures, affected teeth, and more.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Clinical Text to Analyze
              </label>
              <textarea
                value={largeText}
                onChange={(e) => setLargeText(e.target.value)}
                placeholder="Example: Patient presents with severe pain in lower right molar. Diagnosis: Deep caries on tooth #30. Treatment: Root canal therapy performed. Prescribed Amoxicillin 500mg TID for 7 days..."
                rows={12}
                spellCheck={true}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error.message}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleParse}
                disabled={!largeText.trim() || isParsing}
              >
                {isParsing ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Extracting Data...</span>
                  </>
                ) : (
                  'Extract & Analyze'
                )}
              </Button>
            </div>
          </>
        )}

        {}
        {parsedData && (
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {}
            <div className={`px-4 py-3 rounded-md text-sm ${
              parsedData.success 
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-yellow-50 border border-yellow-200 text-yellow-700'
            }`}>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                  AI Suggestion
                </span>
                <span>{parsedData.message}</span>
              </div>
            </div>

            {}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="font-medium text-gray-900">Clinical Summary</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600">Diagnosis</label>
                  <div className="mt-1">{renderFieldValue(parsedData.extractedFields.diagnosis)}</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Periodontal Status</label>
                  <div className="mt-1">{renderFieldValue(parsedData.extractedFields.periodontalStatus)}</div>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600">Allergies</label>
                <div className="mt-1">{renderFieldValue(parsedData.extractedFields.allergies)}</div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600">Medical Alerts</label>
                <div className="mt-1">{renderFieldValue(parsedData.extractedFields.medicalAlerts)}</div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600">History</label>
                <div className="mt-1">{renderFieldValue(parsedData.extractedFields.history)}</div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600">X-Ray Findings</label>
                <div className="mt-1">{renderFieldValue(parsedData.extractedFields.xRayFindings)}</div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600">Clinical Notes</label>
                <div className="mt-1">{renderFieldValue(parsedData.extractedFields.clinicalNotes)}</div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600">Treatments</label>
                <div className="mt-1">{renderFieldValue(parsedData.extractedFields.treatments)}</div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600">Recommendations</label>
                <div className="mt-1">{renderFieldValue(parsedData.extractedFields.recommendations)}</div>
              </div>
            </div>

            {}
            {parsedData.extractedFields.medications.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Medications ({parsedData.extractedFields.medications.length})</h3>
                <div className="space-y-2">
                  {parsedData.extractedFields.medications.map((med: ParseEHRMedication, index: number) => (
                    <div key={index} className="bg-white p-3 rounded border border-gray-200">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Name:</span> {med.name || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Dosage:</span> {med.dosage || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Frequency:</span> {med.frequency || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Duration:</span> {med.duration || 'N/A'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {}
            {parsedData.extractedFields.procedures.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Procedures ({parsedData.extractedFields.procedures.length})</h3>
                <div className="space-y-2">
                  {parsedData.extractedFields.procedures.map((proc: ParseEHRProcedure, index: number) => (
                    <div key={index} className="bg-white p-3 rounded border border-gray-200">
                      <div className="text-sm space-y-1">
                        <div>
                          <span className="font-medium text-gray-600">Name:</span> {proc.name || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Description:</span> {proc.description || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Date:</span> {proc.date ? new Date(proc.date).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {}
            {parsedData.extractedFields.affectedTeeth.filter(tooth => tooth.condition || tooth.treatment).length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Affected Teeth ({parsedData.extractedFields.affectedTeeth.filter(tooth => tooth.condition || tooth.treatment).length})</h3>
                <div className="grid grid-cols-2 gap-2">
                  {parsedData.extractedFields.affectedTeeth
                    .filter(tooth => tooth.condition || tooth.treatment)
                    .map((tooth: ParseEHRAffectedTooth, index: number) => (
                    <div key={index} className="bg-white p-3 rounded border border-gray-200">
                      <div className="text-sm">
                        <div className="font-bold text-blue-600 mb-1">Tooth #{tooth.toothNumber}</div>
                        <div><span className="font-medium text-gray-600">Condition:</span> {tooth.condition || 'Not specified'}</div>
                        <div><span className="font-medium text-gray-600">Treatment:</span> {tooth.treatment || 'Not specified'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {}
            {parsedData.extractedFields.xRays.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">X-Rays ({parsedData.extractedFields.xRays.length})</h3>
                <div className="space-y-2">
                  {parsedData.extractedFields.xRays.map((xray: ParseEHRXRay, index: number) => (
                    <div key={index} className="bg-white p-3 rounded border border-gray-200">
                      <div className="text-sm space-y-1">
                        <div>
                          <span className="font-medium text-gray-600">Type:</span> {xray.type || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Findings:</span> {xray.findings || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Date:</span> {xray.date ? new Date(xray.date).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="secondary" onClick={() => { clearData(); }}>
                Analyze Another Text
              </Button>
              <Button onClick={handleApply}>
                Apply Extracted Data to Form
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
