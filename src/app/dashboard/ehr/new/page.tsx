'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Plus, X, Save, FileText, Upload, Brain } from 'lucide-react';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Input from '@/components/Input';
import ToothChart from '@/components/ToothChart';
import { TOOTH_CONDITIONS } from '@/components/ToothChart';
import PatientAutocomplete from '@/components/PatientAutocomplete';
import AutoExpandTextarea from '@/components/AutoExpandTextarea';
import ToastNotification from '@/components/ToastNotification';
import { useAuth } from '@/contexts/AuthContext';
import { Patient, Appointment, EHR } from '@/types/api.types';
import { patientService, appointmentService, ehrService } from '@/services';
import { AIAutoCompleteTextarea } from '@/components/AIAutoCompleteTextarea';
import { AITerminologyInput } from '@/components/AITerminologyInput';
import { AIGenerateNotesModal } from '@/components/AIGenerateNotesModal';
import { AITreatmentSuggestions } from '@/components/AITreatmentSuggestions';
import { AIParseEHRModal } from '@/components/AIParseEHRModal';
import { ParseEHRExtractedFields } from '@/services';

interface Section {
  id: number;
  title: string;
  isOpen: boolean;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  startDate: string;
  endDate: string;
  notes: string;
}

interface Procedure {
  id: string;
  code: string;
  description: string;
  toothNumber: number;
  status: string;
  performedAt: string;
  notes: string;
}

interface XRay {
  id: string;
  type: string;
  findings: string;
  takenAt: string;
  takenBy: string;
  imageUrl: string;
  notes: string;
}

export default function NewEHRPage() {
  const router = useRouter();
  const { isDoctor } = useAuth();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const [formErrors, setFormErrors] = useState<{ patient?: string; appointment?: string; diagnosis?: string }>({});
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string } | null>(null);

  const [showGenerateNotesModal, setShowGenerateNotesModal] = useState(false);
  const [showParseEHRModal, setShowParseEHRModal] = useState(false);
  
  const [sections, setSections] = useState<Section[]>([
    { id: 1, title: 'SECTION 1: GENERAL MEDICAL INFORMATION', isOpen: true },
    { id: 2, title: 'SECTION 2: DIAGNOSIS & FINDINGS', isOpen: true },
    { id: 3, title: 'SECTION 3: MEDICATIONS', isOpen: true },
    { id: 4, title: 'SECTION 4: PROCEDURES PERFORMED', isOpen: true },
    { id: 5, title: 'SECTION 5: TOOTH CHART', isOpen: true },
    { id: 6, title: 'SECTION 6: X-RAYS', isOpen: true },
    { id: 7, title: 'SECTION 7: TREATMENT & RECOMMENDATIONS', isOpen: true },
  ]);

  const [allergies, setAllergies] = useState('');
  const [medicalAlerts, setMedicalAlerts] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState('');
  const [xRayFindings, setXRayFindings] = useState('');
  const [periodontalStatus, setPeriodontalStatus] = useState('');
  const [treatmentsProvided, setTreatmentsProvided] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [recommendations, setRecommendations] = useState('');

  const [medications, setMedications] = useState<Medication[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);

  interface LocalToothRecord {
    id: string;
    toothNumber: number;
    condition: string;
    treatmentPlanned: string;
    treatmentCompleted: boolean;
    completedDate: string;
    surfacesAffected: string;
    notes: string;
  }

  const [toothRecords, setToothRecords] = useState<LocalToothRecord[]>([]);
  const [xrays, setXRays] = useState<XRay[]>([]);
  const [pendingXRayFiles, setPendingXRayFiles] = useState<{ id: string; file: File }[]>([]);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [customToothCondition, setCustomToothCondition] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    
    if (!isDoctor()) {
      router.push('/dashboard/ehr');
      return;
    }
    loadAppointments();
    
  }, []); 

  useEffect(() => {
    if (selectedPatient) {
      loadPatientAppointments(selectedPatient.patient_ID);
      setSelectedAppointmentId('');
      setFormErrors((prev) => ({ ...prev, appointment: undefined }));
    }
  }, [selectedPatient]);

  const loadAppointments = async () => {
    try {
      const data = await appointmentService.getAllAppointments() as Appointment[];
      setAppointments(data);
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const loadPatientAppointments = async (patientId: number) => {
    try {
      
      const patientApts = await appointmentService.getAppointmentsByPatient(patientId) as Appointment[];
      setAppointments(patientApts);
    } catch (error) {
      console.error('Error loading patient appointments:', error);
    }
  };

  const toggleSection = (id: number) => {
    setSections(sections.map(s => 
      s.id === id ? { ...s, isOpen: !s.isOpen } : s
    ));
  };

  const addMedication = () => {
    const newMed: Medication = {
      id: Date.now().toString(),
      name: '',
      dosage: '',
      frequency: '',
      route: 'Oral',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      notes: '',
    };
    setMedications([...medications, newMed]);
  };

  const removeMedication = (id: string) => {
    setMedications(medications.filter(m => m.id !== id));
  };

  const updateMedication = (id: string, field: keyof Medication, value: string) => {
    setMedications(medications.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  const addProcedure = () => {
    const newProc: Procedure = {
      id: Date.now().toString(),
      code: '',
      description: '',
      toothNumber: 0,
      status: 'Planned',
      performedAt: new Date().toISOString().slice(0, 16),
      notes: '',
    };
    setProcedures([...procedures, newProc]);
  };

  const removeProcedure = (id: string) => {
    setProcedures(procedures.filter(p => p.id !== id));
  };

  const updateProcedure = (id: string, field: keyof Procedure, value: any) => {
    setProcedures(procedures.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p } as any;
      if (field === 'toothNumber') {
        const num = typeof value === 'number' ? value : parseInt(String(value) || '0');
        updated.toothNumber = Number.isNaN(num) ? 0 : num;
      } else {
        updated[field] = value;
      }
      return updated as Procedure;
    }));
  };

  const addToothRecord = () => {
    const newTooth: LocalToothRecord = {
      id: Date.now().toString(),
      toothNumber: 11,
      condition: '',
      treatmentPlanned: '',
      treatmentCompleted: false,
      completedDate: '',
      surfacesAffected: '',
      notes: '',
    };
    setToothRecords(prev => [...prev, newTooth]);
  };

  const ensureToothRecord = (toothNumber: number) => {
    const exists = toothRecords.find(t => t.toothNumber === toothNumber);
    if (!exists) {
      const newTooth: LocalToothRecord = {
        id: Date.now().toString(),
        toothNumber,
        condition: '',
        treatmentPlanned: '',
        treatmentCompleted: false,
        completedDate: '',
        surfacesAffected: '',
        notes: '',
      };
      setToothRecords(prev => [...prev, newTooth]);
    }
  };

  const removeToothRecord = (id: string) => {
    setToothRecords(prev => prev.filter(t => t.id !== id));
  };

  const updateToothRecord = (id: string, field: keyof LocalToothRecord, value: any) => {
    setToothRecords(prev => prev.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  if (!isDoctor()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <div className="text-center p-8">
            <p className="text-red-500 font-semibold mb-4">Access Denied</p>
            <p className="text-gray-600 mb-4">Only doctors can create EHR records.</p>
            <Button onClick={() => router.push('/dashboard/ehr')}>Back to EHR</Button>
          </div>
        </Card>
      </div>
    );
  }

  const addXRay = () => {
    const newXRay: XRay = {
      id: Date.now().toString(),
      type: 'Periapical',
      findings: '',
      takenAt: new Date().toISOString().slice(0, 16),
      takenBy: '',
      imageUrl: '',
      notes: '',
    };
    setXRays([...xrays, newXRay]);
  };

  const removeXRay = (id: string) => {
    setXRays(xrays.filter(x => x.id !== id));
  };

  const updateXRay = (id: string, field: keyof XRay, value: string) => {
    setXRays(xrays.map(x => 
      x.id === id ? { ...x, [field]: value } : x
    ));
  };

  const handleApplyGeneratedNotes = (notes: string) => {
    setClinicalNotes(notes);
    setShowGenerateNotesModal(false);
  };

  const handleApplyParsedEHR = (fields: ParseEHRExtractedFields) => {
    
    if (fields.allergies) setAllergies(fields.allergies);
    if (fields.medicalAlerts) setMedicalAlerts(fields.medicalAlerts);
    if (fields.history) setMedicalHistory(fields.history);
    if (fields.diagnosis) setPrimaryDiagnosis(fields.diagnosis);
    if (fields.xRayFindings) setXRayFindings(fields.xRayFindings);
    if (fields.periodontalStatus) setPeriodontalStatus(fields.periodontalStatus);
    if (fields.treatments) setTreatmentsProvided(fields.treatments);
    if (fields.clinicalNotes) setClinicalNotes(fields.clinicalNotes);
    if (fields.recommendations) setRecommendations(fields.recommendations);

    if (fields.medications && fields.medications.length > 0) {
      const newMedications: Medication[] = fields.medications.map(med => ({
        id: Date.now().toString() + Math.random(),
        name: med.name || '',
        dosage: med.dosage || '',
        frequency: med.frequency || '',
        route: 'Oral',
        startDate: new Date().toISOString().split('T')[0],
        endDate: med.duration || '',
        notes: '',
      }));
      setMedications(prev => [...prev, ...newMedications]);
    }

    if (fields.procedures && fields.procedures.length > 0) {
      const newProcedures: Procedure[] = fields.procedures.map(proc => ({
        id: Date.now().toString() + Math.random(),
        code: '',
        description: proc.name || '',
        toothNumber: 0,
        status: 'Completed',
        performedAt: proc.date || new Date().toISOString(),
        notes: proc.description || '',
      }));
      setProcedures(prev => [...prev, ...newProcedures]);
    }

    if (fields.affectedTeeth && fields.affectedTeeth.length > 0) {
      const teethWithIssues = fields.affectedTeeth.filter(tooth => tooth.condition || tooth.treatment);
      if (teethWithIssues.length > 0) {
        const newToothRecords: LocalToothRecord[] = teethWithIssues.map(tooth => ({
          id: Date.now().toString() + Math.random(),
          toothNumber: tooth.toothNumber,
          condition: tooth.condition || 'Caries',
          treatmentPlanned: tooth.treatment || '',
          treatmentCompleted: false,
          completedDate: '',
          surfacesAffected: '',
          notes: '',
        }));
        setToothRecords(prev => [...prev, ...newToothRecords]);
      }
    }

    if (fields.xRays && fields.xRays.length > 0) {
      const newXRays: XRay[] = fields.xRays.map(xray => ({
        id: Date.now().toString() + Math.random(),
        type: xray.type || '',
        findings: xray.findings || '',
        takenAt: xray.date || new Date().toISOString(),
        takenBy: '',
        imageUrl: '',
        notes: '',
      }));
      setXRays(prev => [...prev, ...newXRays]);
    }

    setShowParseEHRModal(false);
    setToast({ type: 'success', message: 'EHR parsed and applied successfully!' });
  };

  const handleSelectTreatments = (selectedTreatments: string[]) => {
    const currentTreatments = treatmentsProvided.trim();
    const newTreatments = currentTreatments 
      ? `${currentTreatments}\n${selectedTreatments.join('\n')}`
      : selectedTreatments.join('\n');
    setTreatmentsProvided(newTreatments);
  };

  const getPatientContext = (toothNumber?: number) => {
    if (!selectedPatient) return '';
    const age = selectedPatient.dob 
      ? Math.floor((new Date().getTime() - new Date(selectedPatient.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : 'Unknown';
    let context = `Patient: ${selectedPatient.first} ${selectedPatient.last}, Age: ${age}, Gender: ${selectedPatient.gender}${allergies ? `, Allergies: ${allergies}` : ''}${medicalHistory ? `, History: ${medicalHistory}` : ''}`;
    if (toothNumber) {
      context += `, Tooth #${toothNumber}`;
    }
    if (primaryDiagnosis) {
      context += `, Diagnosis: ${primaryDiagnosis}`;
    }
    return context;
  };

  const handleSave = async (isDraft: boolean = false) => {
    const errors: { patient?: string; appointment?: string; diagnosis?: string } = {};
    if (!selectedPatient) errors.patient = 'Select a patient to proceed';
    if (!selectedAppointmentId) errors.appointment = 'Select an appointment to link the record';
    if (!primaryDiagnosis && !isDraft) errors.diagnosis = 'Primary diagnosis is required to complete the record';

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setToast({ type: 'error', message: 'Please resolve the highlighted fields before saving.' });
      return;
    }

    setIsSubmitting(true);

    try {
      if (!selectedPatient) {
        setToast({ type: 'error', message: 'Patient must be selected' });
        return;
      }
      const ehrData = {
        patient_ID: selectedPatient.patient_ID,
        appointmentId: parseInt(selectedAppointmentId),
        diagnosis: primaryDiagnosis || '',
        treatments: treatmentsProvided || '',
        allergies: allergies || '',
        history: medicalHistory || '',
        medicalAlerts: medicalAlerts || '',
        xRayFindings: xRayFindings || '',
        periodontalStatus: periodontalStatus || '',
        clinicalNotes: clinicalNotes || '',
        recommendations: recommendations || '',
        medications: medications.length > 0 ? medications.map(m => ({
          name: m.name,
          dosage: m.dosage || undefined,
          frequency: m.frequency || undefined,
          route: m.route || undefined,
          startDate: m.startDate || undefined,
          endDate: m.endDate || undefined,
          notes: m.notes || undefined,
        })) : [],
        procedures: procedures.length > 0 ? procedures.map(p => ({
          code: p.code,
          Code: p.code,
          description: p.description,
          Description: p.description,
          status: p.status,
          Status: p.status,
          toothNumber: p.toothNumber,
          ToothNumber: p.toothNumber,
          performedAt: p.performedAt || '',
          PerformedAt: p.performedAt || '',
          notes: p.notes,
          Notes: p.notes,
        })) : [],
        xRays: xrays.length > 0 ? xrays.map(x => ({
          type: x.type,
          Type: x.type,
          findings: x.findings,
          Findings: x.findings,
          takenAt: x.takenAt || new Date().toISOString().slice(0, 16),
          TakenAt: x.takenAt || new Date().toISOString().slice(0, 16),
          takenBy: x.takenBy || '',
          TakenBy: x.takenBy || '',
          notes: x.notes,
          Notes: x.notes,
        })) : [],
        teeth: toothRecords.length > 0 ? toothRecords.map(t => ({
          toothNumber: t.toothNumber,
          ToothNumber: t.toothNumber,
          condition: t.condition || undefined,
          Condition: t.condition || undefined,
          treatmentPlanned: t.treatmentPlanned || undefined,
          TreatmentPlanned: t.treatmentPlanned || undefined,
          treatmentCompleted: t.treatmentCompleted ? 'true' : undefined,
          TreatmentCompleted: t.treatmentCompleted ? 'true' : undefined,
          surfaces: t.surfacesAffected || undefined,
          Surfaces: t.surfacesAffected || undefined,
          notes: t.notes || undefined,
          Notes: t.notes || undefined,
        })) : [],
      };

      console.log('Creating EHR with data:', ehrData);
      await ehrService.createEHR(ehrData);
      setToast({ type: 'success', message: isDraft ? 'Draft saved successfully.' : 'EHR saved successfully.' });
      router.push('/dashboard/ehr');
    } catch (error: any) {
      console.error('Error saving EHR:', error);
      const errorMessage = error?.error || error?.message || 'Failed to save EHR';
      setToast({ type: 'error', message: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSelectedAppointment = () => {
    return appointments.find(apt => apt.appointment_ID.toString() === selectedAppointmentId);
  };

  const selectedApt = getSelectedAppointment();

  return (
    <div className="space-y-6">
      {toast && (
        <ToastNotification
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
          position="top-center"
        />
      )}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-900">Create Electronic Health Record</h1>
          <p className="text-gray-600 mt-1">Complete patient health record documentation</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full md:w-auto">
          <Button 
            className="w-full sm:w-auto" 
            variant="secondary" 
            onClick={() => setShowParseEHRModal(true)}
          >
            <Brain className="w-4 h-4 mr-2" />
            Paste & Extract
          </Button>
          <Button className="w-full sm:w-auto" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            className="w-full sm:w-auto"
            variant="secondary"
            onClick={() => handleSave(true)}
            disabled={isSubmitting}
          >
            <FileText className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={() => handleSave(false)}
            disabled={isSubmitting}
          >
            <Save className="w-4 h-4 mr-2" />
            Save & Complete
          </Button>
        </div>
      </div>

      <Card>
        <div className="space-y-6">
          {}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Patient <span className="text-red-500">*</span></label>
            <PatientAutocomplete
              value={selectedPatient}
              onChange={(patient) => {
                setSelectedPatient(patient);
                setFormErrors((prev) => ({ ...prev, patient: undefined }));
              }}
              showLastVisit
            />
            {formErrors.patient && <p className="mt-1 text-sm text-red-600">{formErrors.patient}</p>}
          </div>

          {}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Appointment <span className="text-red-500">*</span></label>
            <select
              value={selectedAppointmentId}
              onChange={(e) => {
                setSelectedAppointmentId(e.target.value);
                setFormErrors((prev) => ({ ...prev, appointment: undefined }));
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!selectedPatient}
            >
              <option value="">Select an appointment...</option>
              {appointments.map((apt) => (
                <option key={apt.appointment_ID} value={apt.appointment_ID}>
                  {apt.date} - {apt.time} - {apt.type} (Ref: APT-{apt.appointment_ID.toString().padStart(3, '0')})
                </option>
              ))}
            </select>
            {formErrors.appointment && <p className="mt-1 text-sm text-red-600">{formErrors.appointment}</p>}
            {selectedApt && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                Selected: {selectedApt.date} at {selectedApt.time} - {selectedApt.type}
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 my-6"></div>

          {}
          <div>
            <button
              onClick={() => toggleSection(1)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="font-semibold text-gray-900">{sections[0].isOpen ? '▼' : '▶'} {sections[0].title}</span>
              {sections[0].isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {sections[0].isOpen && (
              <div className="mt-4 space-y-4 border border-gray-200 rounded-lg p-4">
                <div>
                  <AIAutoCompleteTextarea
                    value={allergies}
                    onChange={(value) => setAllergies(value)}
                    placeholder="e.g., Penicillin, Latex"
                    label="Allergies"
                    minChars={2}
                    debounceMs={300}
                    context="Medical allergies and sensitivities"
                    rows={2}
                    showAIBadge={true}
                  />
                </div>
                <div>
                  <AIAutoCompleteTextarea
                    value={medicalAlerts}
                    onChange={(value) => setMedicalAlerts(value)}
                    placeholder="e.g., High blood pressure - monitor carefully"
                    label="Medical Alerts / Warnings"
                    minChars={10}
                    debounceMs={300}
                    context="Medical alerts and warnings for clinical staff"
                    rows={2}
                    showAIBadge={true}
                  />
                </div>
                <div>
                  <AIAutoCompleteTextarea
                    value={medicalHistory}
                    onChange={(value) => setMedicalHistory(value)}
                    placeholder="Previous surgeries, chronic conditions, etc."
                    label="Medical History"
                    minChars={15}
                    debounceMs={300}
                    context={selectedPatient ? `Patient: ${selectedPatient.first} ${selectedPatient.last}, Age: ${new Date().getFullYear() - new Date(selectedPatient.dob).getFullYear()}` : undefined}
                    rows={3}
                    showAIBadge={true}
                  />
                </div>
              </div>
            )}
          </div>

          {}
          <div>
            <button
              onClick={() => toggleSection(2)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="font-semibold text-gray-900">{sections[1].isOpen ? '▼' : '▶'} {sections[1].title}</span>
              {sections[1].isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {sections[1].isOpen && (
              <div className="mt-4 space-y-4 border border-gray-200 rounded-lg p-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Diagnosis <span className="text-red-500">*</span>
                  </label>
                  <AITerminologyInput
                    value={primaryDiagnosis}
                    onChange={(value) => {
                      setPrimaryDiagnosis(value);
                      setFormErrors((prev) => ({ ...prev, diagnosis: undefined }));
                    }}
                    placeholder="e.g., Dental Caries - Class II Cavity"
                    label=""
                    minChars={3}
                    debounceMs={300}
                  />
                  {formErrors.diagnosis && <p className="mt-1 text-sm text-red-600">{formErrors.diagnosis}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">X-Ray Findings</label>
                  <AITerminologyInput
                    value={xRayFindings}
                    onChange={setXRayFindings}
                    placeholder="e.g., Periapical radiolucency, Cavity detected in tooth #14"
                    label=""
                    minChars={3}
                    debounceMs={300}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Periodontal Status</label>
                  <AITerminologyInput
                    value={periodontalStatus}
                    onChange={setPeriodontalStatus}
                    placeholder="e.g., Healthy gums, no bleeding, good oral hygiene"
                    label=""
                    minChars={3}
                    debounceMs={300}
                  />
                </div>
                
                {}
                {primaryDiagnosis && (
                  <AITreatmentSuggestions
                    diagnosis={primaryDiagnosis}
                    patientHistory={medicalHistory}
                    onSelectTreatments={handleSelectTreatments}
                  />
                )}
              </div>
            )}
          </div>

          {}
          <div>
            <button
              onClick={() => toggleSection(3)}
              className="w-full flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="font-semibold text-gray-900">{sections[2].isOpen ? '▼' : '▶'} {sections[2].title}</span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    router.push('/dashboard/clinical-decision-support');
                  }}
                >
                  <Brain className="w-4 h-4 mr-1" />
                  Decision Support
                </Button>
                <Button size="sm" onClick={(e: React.MouseEvent) => { e.stopPropagation(); addMedication(); }}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Med
                </Button>
              </div>
            </button>
            {sections[2].isOpen && (
              <div className="mt-4 space-y-4">
                {medications.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-500 mb-3">No medications added</p>
                    <Button size="sm" onClick={addMedication}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add First Medication
                    </Button>
                  </div>
                ) : (
                  medications.map((med, index) => (
                    <div key={med.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-gray-900">Medication #{index + 1}</h4>
                        <Button size="sm" variant="danger" onClick={() => removeMedication(med.id)}>
                          <X className="w-4 h-4" />
                          Remove
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <Input
                          label="Name"
                          value={med.name}
                          onChange={(e) => updateMedication(med.id, 'name', e.target.value)}
                          placeholder="e.g., Amoxicillin"
                        />
                        <Input
                          label="Dosage"
                          value={med.dosage}
                          onChange={(e) => updateMedication(med.id, 'dosage', e.target.value)}
                          placeholder="e.g., 500mg"
                        />
                        <Input
                          label="Frequency"
                          value={med.frequency}
                          onChange={(e) => updateMedication(med.id, 'frequency', e.target.value)}
                          placeholder="e.g., 3x/day"
                        />
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Route</label>
                          <select
                            value={med.route}
                            onChange={(e) => updateMedication(med.id, 'route', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Oral">Oral</option>
                            <option value="IV">IV</option>
                            <option value="Topical">Topical</option>
                            <option value="Injection">Injection</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <Input
                          label="Start Date"
                          type="date"
                          value={med.startDate}
                          onChange={(e) => updateMedication(med.id, 'startDate', e.target.value)}
                        />
                        <Input
                          label="End Date"
                          type="date"
                          value={med.endDate}
                          onChange={(e) => updateMedication(med.id, 'endDate', e.target.value)}
                        />
                        <Input
                          label="Notes"
                          value={med.notes}
                          onChange={(e) => updateMedication(med.id, 'notes', e.target.value)}
                          placeholder="e.g., Take after meals"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {}
          <div>
            <button
              onClick={() => toggleSection(4)}
              className="w-full flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="font-semibold text-gray-900">{sections[3].isOpen ? '▼' : '▶'} {sections[3].title}</span>
              <Button size="sm" onClick={(e: React.MouseEvent) => { e.stopPropagation(); addProcedure(); }}>
                <Plus className="w-4 h-4 mr-1" />
                Add Proc
              </Button>
            </button>
            {sections[3].isOpen && (
              <div className="mt-4 space-y-4">
                {procedures.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-500 mb-3">No procedures added</p>
                    <Button size="sm" onClick={addProcedure}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add First Procedure
                    </Button>
                  </div>
                ) : (
                  procedures.map((proc, index) => (
                    <div key={proc.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-gray-900">Procedure #{index + 1}</h4>
                        <Button size="sm" variant="danger" onClick={() => removeProcedure(proc.id)}>
                          <X className="w-4 h-4" />
                          Remove
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <Input
                          label="Code"
                          value={proc.code}
                          onChange={(e) => updateProcedure(proc.id, 'code', e.target.value)}
                          placeholder="e.g., D2140"
                        />
                        <Input
                          label="Description"
                          value={proc.description}
                          onChange={(e) => updateProcedure(proc.id, 'description', e.target.value)}
                          placeholder="e.g., Amalgam Filling"
                        />
                        <Input
                          label="Tooth #"
                          value={proc.toothNumber?.toString() || ''}
                          onChange={(e) => updateProcedure(proc.id, 'toothNumber', parseInt(e.target.value || '0'))}
                          placeholder="e.g., 14"
                        />
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                          <select
                            value={proc.status}
                            onChange={(e) => updateProcedure(proc.id, 'status', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Planned">Planned</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Done">Done</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                          label="Performed At"
                          type="datetime-local"
                          value={proc.performedAt}
                          onChange={(e) => updateProcedure(proc.id, 'performedAt', e.target.value)}
                        />
                        <Input
                          label="Notes"
                          value={proc.notes}
                          onChange={(e) => updateProcedure(proc.id, 'notes', e.target.value)}
                          placeholder="Additional procedure notes"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {}
          <div>
            <button
              onClick={() => toggleSection(5)}
              className="w-full flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="font-semibold text-gray-900">{sections[4].isOpen ? '▼' : '▶'} {sections[4].title}</span>
              <Button size="sm" onClick={(e: React.MouseEvent) => { e.stopPropagation(); addToothRecord(); }}>
                <Plus className="w-4 h-4 mr-1" />
                Add Tooth
              </Button>
            </button>
            {sections[4].isOpen && (
              <div className="mt-4 space-y-4">
                {}
                <div>
                  <ToothChart
                    selectedTeeth={toothRecords.map(t => ({
                      toothNumber: t.toothNumber,
                      ToothNumber: t.toothNumber,
                      condition: t.condition || undefined,
                      Condition: t.condition || undefined,
                      treatmentPlanned: t.treatmentPlanned || undefined,
                      TreatmentPlanned: t.treatmentPlanned || undefined,
                      treatmentCompleted: t.treatmentCompleted ? 'true' : 'false',
                      TreatmentCompleted: t.treatmentCompleted ? 'true' : 'false',
                      surfaces: t.surfacesAffected || undefined,
                      Surfaces: t.surfacesAffected || undefined,
                      notes: t.notes || undefined,
                      Notes: t.notes || undefined,
                    }))}
                    onToothClick={(num: number) => ensureToothRecord(num)}
                    notation="universal"
                    readonly={false}
                  />
                </div>

                {}
                <div className="space-y-3">
                  <h4 className="font-semibold">Selected Tooth Records:</h4>
                  {toothRecords.length === 0 ? (
                    <p className="text-gray-500 text-sm">No tooth records added yet. Click teeth in diagram above.</p>
                  ) : (
                    toothRecords.map((tooth) => (
                      <div key={tooth.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <h5 className="font-semibold text-gray-900">Tooth #{tooth.toothNumber}</h5>
                          <Button size="sm" variant="danger" onClick={() => removeToothRecord(tooth.id)}>
                            <X className="w-4 h-4" />
                            Remove
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                            <select
                              value={tooth.condition}
                              onChange={(e) => {
                                if (e.target.value === 'others') {
                                  const customVal = prompt('Enter custom tooth condition:');
                                  if (customVal && customVal.trim()) {
                                    updateToothRecord(tooth.id, 'condition', customVal.trim() as any);
                                  }
                                } else {
                                  updateToothRecord(tooth.id, 'condition', e.target.value as any);
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white cursor-pointer"
                            >
                              <option value="">Select condition...</option>
                              <option value={TOOTH_CONDITIONS.HEALTHY}>{TOOTH_CONDITIONS.HEALTHY}</option>
                              <option value={TOOTH_CONDITIONS.CARIES}>{TOOTH_CONDITIONS.CARIES}</option>
                              <option value={TOOTH_CONDITIONS.FILLING}>{TOOTH_CONDITIONS.FILLING}</option>
                              <option value={TOOTH_CONDITIONS.ROOT_CANAL}>{TOOTH_CONDITIONS.ROOT_CANAL}</option>
                              <option value={TOOTH_CONDITIONS.CROWN}>{TOOTH_CONDITIONS.CROWN}</option>
                              <option value={TOOTH_CONDITIONS.EXTRACTION}>{TOOTH_CONDITIONS.EXTRACTION}</option>
                              <option value={TOOTH_CONDITIONS.MISSING}>{TOOTH_CONDITIONS.MISSING}</option>
                              <option value={TOOTH_CONDITIONS.DECAY}>{TOOTH_CONDITIONS.DECAY}</option>
                              {tooth.condition && !Object.values(TOOTH_CONDITIONS).includes(tooth.condition as typeof TOOTH_CONDITIONS[keyof typeof TOOTH_CONDITIONS]) && (
                                <option value={tooth.condition}>{tooth.condition} (Custom)</option>
                              )}
                              <option value="others">+ Add Custom Condition</option>
                            </select>
                          </div>
                          <div>
                            <AIAutoCompleteTextarea
                              value={tooth.treatmentPlanned}
                              onChange={(value) => updateToothRecord(tooth.id, 'treatmentPlanned', value)}
                              placeholder="e.g., Amalgam filling"
                              label="Treatment Planned"
                              minChars={5}
                              debounceMs={300}
                              context={getPatientContext(tooth.toothNumber)}
                              rows={2}
                              showAIBadge={true}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          <div>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={tooth.treatmentCompleted}
                                onChange={(e) => updateToothRecord(tooth.id, 'treatmentCompleted', e.target.checked)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm font-medium text-gray-700">Treatment Completed</span>
                            </label>
                          </div>
                          {tooth.treatmentCompleted && (
                            <Input
                              label="Completed Date"
                              type="date"
                              value={tooth.completedDate}
                              onChange={(e) => updateToothRecord(tooth.id, 'completedDate', e.target.value)}
                            />
                          )}
                          <Input
                            label="Surfaces Affected"
                            value={tooth.surfacesAffected}
                            onChange={(e) => updateToothRecord(tooth.id, 'surfacesAffected', e.target.value)}
                            placeholder="e.g., MO (Mesial-Occlusal)"
                          />
                        </div>
                        <div>
                          <AIAutoCompleteTextarea
                            value={tooth.notes}
                            onChange={(value) => updateToothRecord(tooth.id, 'notes', value)}
                            placeholder="Additional tooth notes"
                            label="Notes"
                            minChars={10}
                            debounceMs={300}
                            context={getPatientContext(tooth.toothNumber)}
                            rows={2}
                            showAIBadge={true}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {}
          <div>
            <button
              onClick={() => toggleSection(6)}
              className="w-full flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="font-semibold text-gray-900">{sections[5].isOpen ? '▼' : '▶'} {sections[5].title}</span>
              <Button size="sm" onClick={(e: React.MouseEvent) => { e.stopPropagation(); addXRay(); }}>
                <Plus className="w-4 h-4 mr-1" />
                Add X-Ray
              </Button>
            </button>
            {sections[5].isOpen && (
              <div className="mt-4 space-y-4">
                {xrays.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-500 mb-3">No X-rays added</p>
                    <Button size="sm" onClick={addXRay}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add First X-Ray
                    </Button>
                  </div>
                ) : (
                  xrays.map((xray, index) => (
                    <div key={xray.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-gray-900">X-Ray #{index + 1}</h4>
                        <Button size="sm" variant="danger" onClick={() => removeXRay(xray.id)}>
                          <X className="w-4 h-4" />
                          Remove
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                          <select
                            value={xray.type}
                            onChange={(e) => updateXRay(xray.id, 'type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Periapical">Periapical</option>
                            <option value="Bitewing">Bitewing</option>
                            <option value="Panoramic">Panoramic</option>
                            <option value="Occlusal">Occlusal</option>
                            <option value="CBCT">CBCT</option>
                          </select>
                        </div>
                        <Input
                          label="Findings"
                          value={xray.findings}
                          onChange={(e) => updateXRay(xray.id, 'findings', e.target.value)}
                          placeholder="X-ray findings and observations"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <Input
                          label="Taken At"
                          type="datetime-local"
                          value={xray.takenAt}
                          onChange={(e) => updateXRay(xray.id, 'takenAt', e.target.value)}
                        />
                        <Input
                          label="Taken By"
                          value={xray.takenBy}
                          onChange={(e) => updateXRay(xray.id, 'takenBy', e.target.value)}
                          placeholder="Dr. Ahmed Hassan"
                        />
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="flex-1 w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center text-sm"
                              onClick={() => fileInputRefs.current[xray.id]?.click()}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Image
                            </button>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              ref={(el) => { fileInputRefs.current[xray.id] = el; }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                
                                const url = URL.createObjectURL(file);
                                setXRays(prev => prev.map(x => x.id === xray.id ? { ...x, imageUrl: url } : x));
                                setPendingXRayFiles(prev => [...prev, { id: xray.id, file }]);
                                
                                e.currentTarget.value = '';
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <Input
                        label="Notes"
                        value={xray.notes}
                        onChange={(e) => updateXRay(xray.id, 'notes', e.target.value)}
                        placeholder="Additional notes about the X-ray"
                      />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {}
          <div>
            <button
              onClick={() => toggleSection(7)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="font-semibold text-gray-900">{sections[6].isOpen ? '▼' : '▶'} {sections[6].title}</span>
              {sections[6].isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {sections[6].isOpen && (
              <div className="mt-4 space-y-4 border border-gray-200 rounded-lg p-4">
                <div>
                  <AIAutoCompleteTextarea
                    value={treatmentsProvided}
                    onChange={(value) => setTreatmentsProvided(value)}
                    placeholder="e.g., Amalgam filling on tooth #14, fluoride treatment"
                    label="Treatments Provided"
                    minChars={15}
                    debounceMs={300}
                    context={selectedPatient ? `Patient: ${selectedPatient.first} ${selectedPatient.last}, Diagnosis: ${primaryDiagnosis}` : undefined}
                    rows={3}
                    showAIBadge={true}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Clinical Notes</label>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowGenerateNotesModal(true)}
                    >
                      Generate with AI
                    </Button>
                  </div>
                  <AIAutoCompleteTextarea
                    value={clinicalNotes}
                    onChange={setClinicalNotes}
                    placeholder="e.g., Patient tolerated procedure well, no complications"
                    label=""
                    rows={5}
                    context={getPatientContext()}
                    minChars={20}
                    debounceMs={400}
                    showAIBadge={false}
                  />
                </div>
                <div>
                  <AIAutoCompleteTextarea
                    value={recommendations}
                    onChange={(value) => setRecommendations(value)}
                    placeholder="e.g., Follow-up in 6 months, maintain good oral hygiene"
                    label="Recommendations"
                    minChars={15}
                    debounceMs={300}
                    context={selectedPatient ? `Patient: ${selectedPatient.first} ${selectedPatient.last}, Diagnosis: ${primaryDiagnosis}, Treatments: ${treatmentsProvided}` : undefined}
                    rows={3}
                    showAIBadge={true}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 my-6"></div>

          {}
          <div className="text-sm text-gray-600 space-y-1">
            <p>Updated By: {selectedPatient ? 'Dr. Ahmed Hassan' : 'Not set'}</p>
            <p>Last Updated: {new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
          </div>

          {}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4 border-t border-gray-200">
            <Button className="w-full sm:w-auto" variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button
              className="w-full sm:w-auto"
              variant="secondary"
              onClick={() => handleSave(true)}
              disabled={isSubmitting}
            >
              <FileText className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={() => handleSave(false)}
              disabled={isSubmitting}
            >
              <Save className="w-4 h-4 mr-2" />
              Save & Complete
            </Button>
          </div>
        </div>
      </Card>

      {}
      <AIGenerateNotesModal
        isOpen={showGenerateNotesModal}
        onClose={() => setShowGenerateNotesModal(false)}
        onApply={handleApplyGeneratedNotes}
        patientContext={getPatientContext()}
      />

      <AIParseEHRModal
        isOpen={showParseEHRModal}
        onClose={() => setShowParseEHRModal(false)}
        onApplyData={handleApplyParsedEHR}
        patientContext={getPatientContext()}
      />
    </div>
  );
}
