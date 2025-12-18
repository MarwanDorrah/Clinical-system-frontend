import { useState } from 'react';
import { AIAutoCompleteTextarea } from '@/components/AIAutoCompleteTextarea';
import { AITerminologyInput } from '@/components/AITerminologyInput';
import { AIGenerateNotesModal } from '@/components/AIGenerateNotesModal';
import { AITreatmentSuggestions } from '@/components/AITreatmentSuggestions';
import { AIExtractDataModal } from '@/components/AIExtractDataModal';
import { ExtractClinicalDataResponse } from '@/services';
import Button from '@/components/Button';

function ClinicalNotesExample() {
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [patientInfo, setPatientInfo] = useState('John Doe, Age 45, Diabetic');

  return (
    <AIAutoCompleteTextarea
      value={clinicalNotes}
      onChange={setClinicalNotes}
      placeholder="Enter clinical notes..."
      label="Clinical Notes"
      rows={6}
      context={`Patient: ${patientInfo}. Initial exam.`}
      minChars={10}
      debounceMs={500}
    />
  );
}

function DiagnosisExample() {
  const [diagnosis, setDiagnosis] = useState('');

  return (
    <AITerminologyInput
      value={diagnosis}
      onChange={setDiagnosis}
      placeholder="Enter diagnosis..."
      label="Primary Diagnosis"
      minChars={3}
      debounceMs={300}
    />
  );
}

function GenerateNotesExample() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [patientContext, setPatientContext] = useState('Omar, Age 45, diabetic');

  const handleApplyNotes = (notes: string) => {
    setClinicalNotes(notes);
  };

  return (
    <div>
      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Clinical Notes
        </label>
        <div className="flex gap-2">
          <textarea
            value={clinicalNotes}
            onChange={(e) => setClinicalNotes(e.target.value)}
            rows={6}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Enter clinical notes or use AI to generate from bullet points..."
          />
        </div>
      </div>
      
      <Button
        onClick={() => setIsModalOpen(true)}
        variant="secondary"
        size="sm"
      >
        Generate with AI
      </Button>

      <AIGenerateNotesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onApply={handleApplyNotes}
        patientContext={patientContext}
      />
    </div>
  );
}

function TreatmentSuggestionsExample() {
  const [diagnosis, setDiagnosis] = useState('');
  const [treatments, setTreatments] = useState('');
  const [patientHistory, setPatientHistory] = useState('No allergies, regular patient, good oral hygiene');

  const handleSelectTreatments = (selectedTreatments: string[]) => {
    
    const newTreatments = treatments 
      ? `${treatments}\n${selectedTreatments.join('\n')}`
      : selectedTreatments.join('\n');
    setTreatments(newTreatments);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Diagnosis
        </label>
        <input
          type="text"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          placeholder="Enter diagnosis..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      {diagnosis && (
        <AITreatmentSuggestions
          diagnosis={diagnosis}
          patientHistory={patientHistory}
          onSelectTreatments={handleSelectTreatments}
        />
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Treatments
        </label>
        <textarea
          value={treatments}
          onChange={(e) => setTreatments(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="Treatments will be added here..."
        />
      </div>
    </div>
  );
}

function ExtractDataExample() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [diagnosis, setDiagnosis] = useState('');
  const [periodontalStatus, setPeriodontalStatus] = useState('');
  const [treatments, setTreatments] = useState('');
  const [medications, setMedications] = useState<string[]>([]);
  const [affectedTeeth, setAffectedTeeth] = useState<number[]>([]);

  const handleApplyExtractedData = (data: ExtractClinicalDataResponse) => {
    if (data.diagnosis) setDiagnosis(data.diagnosis);
    if (data.periodontalStatus) setPeriodontalStatus(data.periodontalStatus);
    if (data.treatments) setTreatments(data.treatments.join('\n'));
    if (data.medications) setMedications(data.medications);
    if (data.affectedTeeth) setAffectedTeeth(data.affectedTeeth);
  };

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold">EHR Data Entry</h3>
        <Button
          onClick={() => setIsModalOpen(true)}
          variant="secondary"
          size="sm"
        >
          📋 Paste & Extract Data
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Diagnosis
          </label>
          <input
            type="text"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Periodontal Status
          </label>
          <input
            type="text"
            value={periodontalStatus}
            onChange={(e) => setPeriodontalStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Treatments
          </label>
          <textarea
            value={treatments}
            onChange={(e) => setTreatments(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {medications.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Extracted Medications
            </label>
            <ul className="list-disc ml-5">
              {medications.map((med, index) => (
                <li key={index}>{med}</li>
              ))}
            </ul>
          </div>
        )}

        {affectedTeeth.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Affected Teeth
            </label>
            <p>{affectedTeeth.join(', ')}</p>
          </div>
        )}
      </div>

      <AIExtractDataModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onApply={handleApplyExtractedData}
      />
    </div>
  );
}

export {
  ClinicalNotesExample,
  DiagnosisExample,
  GenerateNotesExample,
  TreatmentSuggestionsExample,
  ExtractDataExample,
};
