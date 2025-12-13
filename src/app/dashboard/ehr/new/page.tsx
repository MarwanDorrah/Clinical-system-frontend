'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Plus, X, Save, FileText, Upload } from 'lucide-react';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Input from '@/components/Input';
import PatientAutocomplete from '@/components/PatientAutocomplete';
import AutoExpandTextarea from '@/components/AutoExpandTextarea';
import { useAuth } from '@/contexts/AuthContext';
import { Patient, Appointment, EHR } from '@/types/api.types';
import { patientService, appointmentService, ehrService } from '@/services';

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
  toothNumber: string;
  status: string;
  performedAt: string;
  notes: string;
}

interface ToothRecord {
  id: string;
  toothNumber: number;
  condition: string;
  treatmentPlanned: string;
  treatmentCompleted: boolean;
  completedDate: string;
  surfacesAffected: string;
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
  
  const [sections, setSections] = useState<Section[]>([
    { id: 1, title: 'SECTION 1: GENERAL MEDICAL INFORMATION', isOpen: true },
    { id: 2, title: 'SECTION 2: DIAGNOSIS & FINDINGS', isOpen: true },
    { id: 3, title: 'SECTION 3: MEDICATIONS', isOpen: true },
    { id: 4, title: 'SECTION 4: PROCEDURES PERFORMED', isOpen: true },
    { id: 5, title: 'SECTION 5: TOOTH CHART', isOpen: true },
    { id: 6, title: 'SECTION 6: X-RAYS', isOpen: true },
    { id: 7, title: 'SECTION 7: TREATMENT & RECOMMENDATIONS', isOpen: true },
  ]);

  // Form data
  const [allergies, setAllergies] = useState('');
  const [medicalAlerts, setMedicalAlerts] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState('');
  const [xRayFindings, setXRayFindings] = useState('');
  const [periodontalStatus, setPeriodontalStatus] = useState('');
  const [treatmentsProvided, setTreatmentsProvided] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [recommendations, setRecommendations] = useState('');

  // Dynamic arrays
  const [medications, setMedications] = useState<Medication[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [toothRecords, setToothRecords] = useState<ToothRecord[]>([]);
  const [xrays, setXRays] = useState<XRay[]>([]);
  const [customToothCondition, setCustomToothCondition] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Only doctors can create EHR records
    if (!isDoctor()) {
      router.push('/dashboard/ehr');
      return;
    }
    loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  useEffect(() => {
    if (selectedPatient) {
      loadPatientAppointments(selectedPatient.patient_ID);
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
      // USE BACKEND FILTER - More efficient than client-side filtering
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

  // Medication handlers
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

  // Procedure handlers
  const addProcedure = () => {
    const newProc: Procedure = {
      id: Date.now().toString(),
      code: '',
      description: '',
      toothNumber: '',
      status: 'Planned',
      performedAt: new Date().toISOString().slice(0, 16),
      notes: '',
    };
    setProcedures([...procedures, newProc]);
  };

  const removeProcedure = (id: string) => {
    setProcedures(procedures.filter(p => p.id !== id));
  };

  const updateProcedure = (id: string, field: keyof Procedure, value: string) => {
    setProcedures(procedures.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  // Tooth record handlers
  const addToothRecord = () => {
    const newTooth: ToothRecord = {
      id: Date.now().toString(),
      toothNumber: 11,
      condition: '',
      treatmentPlanned: '',
      treatmentCompleted: false,
      completedDate: '',
      surfacesAffected: '',
      notes: '',
    };
    setToothRecords([...toothRecords, newTooth]);
  };

  const removeToothRecord = (id: string) => {
    setToothRecords(toothRecords.filter(t => t.id !== id));
  };

  const updateToothRecord = (id: string, field: keyof ToothRecord, value: any) => {
    setToothRecords(toothRecords.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  // Authorization check - Only doctors can create EHRs
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

  // X-Ray handlers
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

  const handleSave = async (isDraft: boolean = false) => {
    if (!selectedPatient || !selectedAppointmentId) {
      alert('Please select a patient and appointment');
      return;
    }

    if (!primaryDiagnosis && !isDraft) {
      alert('Primary diagnosis is required');
      return;
    }

    setIsSubmitting(true);

    try {
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
          Name: m.name,
          dosage: m.dosage,
          Dosage: m.dosage,
          frequency: m.frequency,
          Frequency: m.frequency,
          route: m.route,
          Route: m.route,
          startDate: m.startDate,
          StartDate: m.startDate,
          endDate: m.endDate,
          EndDate: m.endDate,
          notes: m.notes,
          Notes: m.notes,
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
          performedAt: p.performedAt,
          PerformedAt: p.performedAt,
          notes: p.notes,
          Notes: p.notes,
        })) : [],
        xRays: xrays.length > 0 ? xrays.map(x => ({
          type: x.type,
          Type: x.type,
          findings: x.findings,
          Findings: x.findings,
          takenAt: x.takenAt,
          TakenAt: x.takenAt,
          takenBy: x.takenBy || '',
          TakenBy: x.takenBy || '',
          notes: x.notes,
          Notes: x.notes,
        })) : [],
        teeth: toothRecords.length > 0 ? toothRecords.map(t => ({
          toothNumber: t.toothNumber,
          ToothNumber: t.toothNumber,
          condition: t.condition,
          Condition: t.condition,
          treatmentPlanned: t.treatmentPlanned,
          TreatmentPlanned: t.treatmentPlanned,
          notes: t.notes,
          Notes: t.notes,
        })) : [],
      };

      console.log('Creating EHR with data:', ehrData);
      await ehrService.createEHR(ehrData);
      alert(isDraft ? 'EHR draft saved successfully' : 'EHR saved successfully');
      router.push('/dashboard/ehr');
    } catch (error: any) {
      console.error('Error saving EHR:', error);
      const errorMessage = error?.error || error?.message || 'Failed to save EHR';
      alert(errorMessage);
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Electronic Health Record</h1>
          <p className="text-gray-600 mt-1">Complete patient health record documentation</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => handleSave(true)}
            disabled={isSubmitting}
          >
            <FileText className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button 
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
          {/* Patient Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🔍 Select Patient <span className="text-red-500">*</span>
            </label>
            <PatientAutocomplete
              value={selectedPatient}
              onChange={setSelectedPatient}
              showLastVisit
            />
          </div>

          {/* Appointment Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🔍 Select Appointment <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedAppointmentId}
              onChange={(e) => setSelectedAppointmentId(e.target.value)}
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
            {selectedApt && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                Selected: {selectedApt.date} at {selectedApt.time} - {selectedApt.type}
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 my-6"></div>

          {/* SECTION 1: General Medical Information */}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
                  <textarea
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Penicillin, Latex"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Medical Alerts / Warnings</label>
                  <textarea
                    value={medicalAlerts}
                    onChange={(e) => setMedicalAlerts(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., High blood pressure - monitor carefully"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Medical History</label>
                  <AutoExpandTextarea
                    label=""
                    name="medicalHistory"
                    value={medicalHistory}
                    onChange={(e) => setMedicalHistory(e.target.value)}
                    placeholder="Previous surgeries, chronic conditions, etc."
                    rows={3}
                    templates={[
                      { label: 'No Medical History', value: 'No significant medical history reported.' },
                      { label: 'Diabetic Patient', value: 'Patient has Type 2 Diabetes. Blood sugar levels monitored regularly.' },
                      { label: 'Hypertension', value: 'Patient has controlled hypertension. Currently on medication.' }
                    ]}
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: Diagnosis & Findings */}
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
                  <AutoExpandTextarea
                    label=""
                    name="primaryDiagnosis"
                    value={primaryDiagnosis}
                    onChange={(e) => setPrimaryDiagnosis(e.target.value)}
                    placeholder="e.g., Dental Caries - Class II Cavity"
                    required
                    rows={2}
                    templates={[
                      { label: 'Dental Caries', value: 'Dental Caries - Class II Cavity detected' },
                      { label: 'Gingivitis', value: 'Gingivitis - Mild inflammation of gingival tissue' },
                      { label: 'Periodontitis', value: 'Chronic Periodontitis - Moderate bone loss observed' }
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">X-Ray Findings</label>
                  <textarea
                    value={xRayFindings}
                    onChange={(e) => setXRayFindings(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Cavity detected in tooth #14, moderate depth"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Periodontal Status</label>
                  <textarea
                    value={periodontalStatus}
                    onChange={(e) => setPeriodontalStatus(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Healthy gums, no bleeding, good oral hygiene"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: Medications */}
          <div>
            <button
              onClick={() => toggleSection(3)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="font-semibold text-gray-900">{sections[2].isOpen ? '▼' : '▶'} {sections[2].title}</span>
              <Button size="sm" onClick={(e: React.MouseEvent) => { e.stopPropagation(); addMedication(); }}>
                <Plus className="w-4 h-4 mr-1" />
                Add Med
              </Button>
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
                      <div className="grid grid-cols-4 gap-3">
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
                      <div className="grid grid-cols-3 gap-3">
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

          {/* SECTION 4: Procedures */}
          <div>
            <button
              onClick={() => toggleSection(4)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
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
                      <div className="grid grid-cols-4 gap-3">
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
                          value={proc.toothNumber}
                          onChange={(e) => updateProcedure(proc.id, 'toothNumber', e.target.value)}
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
                      <div className="grid grid-cols-2 gap-3">
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

          {/* SECTION 5: Tooth Chart */}
          <div>
            <button
              onClick={() => toggleSection(5)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="font-semibold text-gray-900">{sections[4].isOpen ? '▼' : '▶'} {sections[4].title}</span>
              <Button size="sm" onClick={(e: React.MouseEvent) => { e.stopPropagation(); addToothRecord(); }}>
                <Plus className="w-4 h-4 mr-1" />
                Add Tooth
              </Button>
            </button>
            {sections[4].isOpen && (
              <div className="mt-4 space-y-4">
                {/* Interactive Tooth Chart */}
                <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                  <h4 className="font-semibold text-center mb-4">VISUAL TOOTH DIAGRAM (Interactive)</h4>
                  <div className="flex justify-center items-center space-x-8">
                    <div className="text-center">
                      <p className="text-sm font-medium mb-2">Upper Right</p>
                      <div className="grid grid-cols-4 gap-1">
                        {[18, 17, 16, 15].map(num => (
                          <button
                            key={num}
                            onClick={() => {
                              const exists = toothRecords.find(t => t.toothNumber === num);
                              if (!exists) {
                                const newTooth: ToothRecord = {
                                  id: Date.now().toString(),
                                  toothNumber: num,
                                  condition: '',
                                  treatmentPlanned: '',
                                  treatmentCompleted: false,
                                  completedDate: '',
                                  surfacesAffected: '',
                                  notes: '',
                                };
                                setToothRecords([...toothRecords, newTooth]);
                              }
                            }}
                            className={`w-10 h-10 border-2 rounded-lg font-semibold text-xs ${
                              toothRecords.find(t => t.toothNumber === num)
                                ? 'bg-yellow-100 border-yellow-500 text-yellow-900'
                                : 'bg-green-100 border-green-500 text-green-900'
                            } hover:scale-110 transition-transform`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-4 gap-1 mt-1">
                        {[14, 13, 12, 11].map(num => (
                          <button
                            key={num}
                            onClick={() => {
                              const exists = toothRecords.find(t => t.toothNumber === num);
                              if (!exists) {
                                const newTooth: ToothRecord = {
                                  id: Date.now().toString(),
                                  toothNumber: num,
                                  condition: '',
                                  treatmentPlanned: '',
                                  treatmentCompleted: false,
                                  completedDate: '',
                                  surfacesAffected: '',
                                  notes: '',
                                };
                                setToothRecords([...toothRecords, newTooth]);
                              }
                            }}
                            className={`w-10 h-10 border-2 rounded-lg font-semibold text-xs ${
                              toothRecords.find(t => t.toothNumber === num)
                                ? 'bg-yellow-100 border-yellow-500 text-yellow-900'
                                : 'bg-green-100 border-green-500 text-green-900'
                            } hover:scale-110 transition-transform`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium mb-2">Upper Left</p>
                      <div className="grid grid-cols-4 gap-1">
                        {[25, 26, 27, 28].map(num => (
                          <button
                            key={num}
                            onClick={() => {
                              const exists = toothRecords.find(t => t.toothNumber === num);
                              if (!exists) {
                                const newTooth: ToothRecord = {
                                  id: Date.now().toString(),
                                  toothNumber: num,
                                  condition: '',
                                  treatmentPlanned: '',
                                  treatmentCompleted: false,
                                  completedDate: '',
                                  surfacesAffected: '',
                                  notes: '',
                                };
                                setToothRecords([...toothRecords, newTooth]);
                              }
                            }}
                            className={`w-10 h-10 border-2 rounded-lg font-semibold text-xs ${
                              toothRecords.find(t => t.toothNumber === num)
                                ? 'bg-yellow-100 border-yellow-500 text-yellow-900'
                                : 'bg-green-100 border-green-500 text-green-900'
                            } hover:scale-110 transition-transform`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-4 gap-1 mt-1">
                        {[21, 22, 23, 24].map(num => (
                          <button
                            key={num}
                            onClick={() => {
                              const exists = toothRecords.find(t => t.toothNumber === num);
                              if (!exists) {
                                const newTooth: ToothRecord = {
                                  id: Date.now().toString(),
                                  toothNumber: num,
                                  condition: '',
                                  treatmentPlanned: '',
                                  treatmentCompleted: false,
                                  completedDate: '',
                                  surfacesAffected: '',
                                  notes: '',
                                };
                                setToothRecords([...toothRecords, newTooth]);
                              }
                            }}
                            className={`w-10 h-10 border-2 rounded-lg font-semibold text-xs ${
                              toothRecords.find(t => t.toothNumber === num)
                                ? 'bg-yellow-100 border-yellow-500 text-yellow-900'
                                : 'bg-green-100 border-green-500 text-green-900'
                            } hover:scale-110 transition-transform`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center items-center space-x-8 mt-4">
                    <div className="text-center">
                      <div className="grid grid-cols-4 gap-1">
                        {[48, 47, 46, 45].map(num => (
                          <button
                            key={num}
                            onClick={() => {
                              const exists = toothRecords.find(t => t.toothNumber === num);
                              if (!exists) {
                                const newTooth: ToothRecord = {
                                  id: Date.now().toString(),
                                  toothNumber: num,
                                  condition: '',
                                  treatmentPlanned: '',
                                  treatmentCompleted: false,
                                  completedDate: '',
                                  surfacesAffected: '',
                                  notes: '',
                                };
                                setToothRecords([...toothRecords, newTooth]);
                              }
                            }}
                            className={`w-10 h-10 border-2 rounded-lg font-semibold text-xs ${
                              toothRecords.find(t => t.toothNumber === num)
                                ? 'bg-yellow-100 border-yellow-500 text-yellow-900'
                                : 'bg-green-100 border-green-500 text-green-900'
                            } hover:scale-110 transition-transform`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-4 gap-1 mt-1">
                        {[44, 43, 42, 41].map(num => (
                          <button
                            key={num}
                            onClick={() => {
                              const exists = toothRecords.find(t => t.toothNumber === num);
                              if (!exists) {
                                const newTooth: ToothRecord = {
                                  id: Date.now().toString(),
                                  toothNumber: num,
                                  condition: '',
                                  treatmentPlanned: '',
                                  treatmentCompleted: false,
                                  completedDate: '',
                                  surfacesAffected: '',
                                  notes: '',
                                };
                                setToothRecords([...toothRecords, newTooth]);
                              }
                            }}
                            className={`w-10 h-10 border-2 rounded-lg font-semibold text-xs ${
                              toothRecords.find(t => t.toothNumber === num)
                                ? 'bg-yellow-100 border-yellow-500 text-yellow-900'
                                : 'bg-green-100 border-green-500 text-green-900'
                            } hover:scale-110 transition-transform`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                      <p className="text-sm font-medium mt-2">Lower Right</p>
                    </div>
                    <div className="text-center">
                      <div className="grid grid-cols-4 gap-1">
                        {[35, 36, 37, 38].map(num => (
                          <button
                            key={num}
                            onClick={() => {
                              const exists = toothRecords.find(t => t.toothNumber === num);
                              if (!exists) {
                                const newTooth: ToothRecord = {
                                  id: Date.now().toString(),
                                  toothNumber: num,
                                  condition: '',
                                  treatmentPlanned: '',
                                  treatmentCompleted: false,
                                  completedDate: '',
                                  surfacesAffected: '',
                                  notes: '',
                                };
                                setToothRecords([...toothRecords, newTooth]);
                              }
                            }}
                            className={`w-10 h-10 border-2 rounded-lg font-semibold text-xs ${
                              toothRecords.find(t => t.toothNumber === num)
                                ? 'bg-yellow-100 border-yellow-500 text-yellow-900'
                                : 'bg-green-100 border-green-500 text-green-900'
                            } hover:scale-110 transition-transform`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-4 gap-1 mt-1">
                        {[31, 32, 33, 34].map(num => (
                          <button
                            key={num}
                            onClick={() => {
                              const exists = toothRecords.find(t => t.toothNumber === num);
                              if (!exists) {
                                const newTooth: ToothRecord = {
                                  id: Date.now().toString(),
                                  toothNumber: num,
                                  condition: '',
                                  treatmentPlanned: '',
                                  treatmentCompleted: false,
                                  completedDate: '',
                                  surfacesAffected: '',
                                  notes: '',
                                };
                                setToothRecords([...toothRecords, newTooth]);
                              }
                            }}
                            className={`w-10 h-10 border-2 rounded-lg font-semibold text-xs ${
                              toothRecords.find(t => t.toothNumber === num)
                                ? 'bg-yellow-100 border-yellow-500 text-yellow-900'
                                : 'bg-green-100 border-green-500 text-green-900'
                            } hover:scale-110 transition-transform`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                      <p className="text-sm font-medium mt-2">Lower Left</p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
                    <p className="font-semibold text-gray-700 mb-3">🎨 Color Legend:</p>
                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
                      <div>● Healthy - Green</div>
                      <div>● Treated (Filling, Crown, Root Canal) - Yellow</div>
                      <div>● Problem (Caries, Extraction) - Red</div>
                      <div>● Missing - Gray</div>
                      <div>● Others (Custom Condition) - Purple</div>
                    </div>
                  </div>
                  <p className="text-center text-sm text-gray-600 mt-3">Click tooth to add/edit details</p>
                </div>

                {/* Selected Tooth Records */}
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
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                            <select
                              value={tooth.condition}
                              onChange={(e) => {
                                if (e.target.value === 'others') {
                                  const customVal = prompt('Enter custom tooth condition:');
                                  if (customVal) {
                                    updateToothRecord(tooth.id, 'condition', customVal);
                                  }
                                } else {
                                  updateToothRecord(tooth.id, 'condition', e.target.value);
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white cursor-pointer"
                            >
                              <option value="">Select condition...</option>
                              <option value="Healthy">● Healthy</option>
                              <option value="Caries">● Caries</option>
                              <option value="Filling">● Filling</option>
                              <option value="Root Canal">● Root Canal</option>
                              <option value="Extraction">● Extraction</option>
                              <option value="Crown">● Crown</option>
                              <option value="Missing">● Missing</option>
                              <option value="others">● Others (Custom)</option>
                            </select>
                          </div>
                          <Input
                            label="Treatment Planned"
                            value={tooth.treatmentPlanned}
                            onChange={(e) => updateToothRecord(tooth.id, 'treatmentPlanned', e.target.value)}
                            placeholder="e.g., Amalgam filling"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
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
                        <Input
                          label="Notes"
                          value={tooth.notes}
                          onChange={(e) => updateToothRecord(tooth.id, 'notes', e.target.value)}
                          placeholder="Additional tooth notes"
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 6: X-Rays */}
          <div>
            <button
              onClick={() => toggleSection(6)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
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
                      <div className="grid grid-cols-2 gap-3">
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
                      <div className="grid grid-cols-3 gap-3">
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
                          placeholder="Doctor/Technician name"
                        />
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                          <button className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center text-sm">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Image
                          </button>
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

          {/* SECTION 7: Treatment & Recommendations */}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Treatments Provided</label>
                  <AutoExpandTextarea
                    label=""
                    name="treatmentsProvided"
                    value={treatmentsProvided}
                    onChange={(e) => setTreatmentsProvided(e.target.value)}
                    placeholder="e.g., Amalgam filling on tooth #14, fluoride treatment"
                    rows={3}
                    templates={[
                      { label: 'Filling', value: 'Amalgam filling applied to cavity. Patient tolerated procedure well.' },
                      { label: 'Cleaning', value: 'Professional dental cleaning performed. Plaque and calculus removed.' },
                      { label: 'Extraction', value: 'Tooth extraction completed under local anesthesia. No complications.' }
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Clinical Notes</label>
                  <AutoExpandTextarea
                    label=""
                    name="clinicalNotes"
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    placeholder="e.g., Patient tolerated procedure well, no complications"
                    rows={3}
                    templates={[
                      { label: 'Routine Visit', value: 'Routine examination completed. Patient in good oral health.' },
                      { label: 'Post-Procedure', value: 'Patient tolerated procedure well. No immediate complications observed.' },
                      { label: 'Follow-up Required', value: 'Patient requires follow-up. Condition to be monitored closely.' }
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recommendations</label>
                  <AutoExpandTextarea
                    label=""
                    name="recommendations"
                    value={recommendations}
                    onChange={(e) => setRecommendations(e.target.value)}
                    placeholder="e.g., Follow-up in 6 months, maintain good oral hygiene"
                    rows={3}
                    templates={[
                      { label: '6-Month Follow-up', value: 'Schedule follow-up appointment in 6 months. Continue current oral hygiene routine.' },
                      { label: 'Immediate Follow-up', value: 'Follow-up required in 2 weeks to assess healing progress.' },
                      { label: 'Preventive Care', value: 'Maintain good oral hygiene. Brush twice daily, floss regularly, use fluoride toothpaste.' }
                    ]}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 my-6"></div>

          {/* Footer Info */}
          <div className="text-sm text-gray-600 space-y-1">
            <p>Updated By: {selectedPatient ? 'Dr. Ahmed Hassan' : 'Not set'}</p>
            <p>Last Updated: {new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => handleSave(true)}
              disabled={isSubmitting}
            >
              <FileText className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button 
              onClick={() => handleSave(false)}
              disabled={isSubmitting}
            >
              <Save className="w-4 h-4 mr-2" />
              Save & Complete
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
