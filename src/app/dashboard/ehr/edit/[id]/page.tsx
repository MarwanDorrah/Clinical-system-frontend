/**
 * EHR Edit Page - Electronic Health Record Editor
 * 
 * API Endpoint: PUT /EHR/{EHR_ID}
 * Auth: Doctor Only
 * 
 * Request Format (EHRUpdateRequest):
 * - ehr_ID: number (required, must match URL param)
 * - patient_ID: number (required)
 * - appointmentId: number (required)
 * - allergies, medicalAlerts, diagnosis, xRayFindings, periodontalStatus, 
 *   clinicalNotes, recommendations, history (optional strings)
 * - medications: MedicationRecordDto[] (replaces entire collection)
 * - procedures: ProcedureRecordDto[] (replaces entire collection)
 * - teeth: ToothRecordDto[] (replaces entire collection)
 * - xRays: XRayRecordDto[] (replaces entire collection)
 * 
 * Response (200 OK):
 * { message: string, ehr: EHRResponse }
 * 
 * EHRResponse includes:
 * - All scalar fields + updatedAt, updatedBy
 * - Nested arrays with IDs assigned
 * - changeLogs: EHRChangeLogResponse[] (audit trail)
 * 
 * Notes:
 * - Nested arrays REPLACE existing collections (not merged)
 * - Change logs are auto-generated server-side
 * - Date format: YYYY-MM-DD
 * - DateTime format: YYYY-MM-DDTHH:mm:ss
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Save, ArrowLeft, Search, Filter, Plus, X, Calendar } from 'lucide-react';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Alert from '@/components/Alert';
import LoadingSpinner from '@/components/LoadingSpinner';
import Input from '@/components/Input';
import ToothChart from '@/components/ToothChart';
import { useAuth } from '@/contexts/AuthContext';
import { Patient, EHR, ToothRecord, Medication, Procedure } from '@/types/api.types';
import { patientService, ehrService } from '@/services';
import { calculateAge } from '@/utils/date.utils';

interface MedicationForm {
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  startDate: string;
  notes: string;
}

interface TreatmentForm {
  code: string;
  description: string;
  performedAt: string;
  toothNumber: string;
  status: string;
  notes: string;
}

export default function EditEHRPage() {
  const router = useRouter();
  const params = useParams();
  const { isDoctor } = useAuth();
  const ehrId = params.id as string;

  const [existingEHR, setExistingEHR] = useState<EHR | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Tooth selection and status
  const [selectedTeeth, setSelectedTeeth] = useState<ToothRecord[]>([]);
  const [selectedToothNumber, setSelectedToothNumber] = useState<number | null>(null);
  const [toothStatus, setToothStatus] = useState('Healthy');
  const [customToothCondition, setCustomToothCondition] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Medications
  const [medications, setMedications] = useState<MedicationForm[]>([]);

  // Treatments
  const [treatments, setTreatments] = useState<TreatmentForm[]>([]);

  // Form fields
  const [formData, setFormData] = useState({
    appointmentId: '',
    allergies: '',
    medicalAlerts: '',
    history: '',
    diagnosis: '',
    xRayFindings: '',
    periodontalStatus: '',
    clinicalNotes: '',
    recommendations: '',
  });

  useEffect(() => {
    // Only doctors can edit EHR records
    if (!isDoctor()) {
      router.push('/dashboard/ehr');
      return;
    }
    loadEHR();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ehrId]); // Only re-run when ehrId changes

  const loadEHR = async () => {
    try {
      setIsLoading(true);
      const data = await ehrService.getEHRById(ehrId) as EHR;
      setExistingEHR(data);
      
      if (data.patient_ID) {
        const patientData = await patientService.getPatientById(data.patient_ID.toString()) as Patient;
        setPatient(patientData);
      }

      setFormData({
        appointmentId: data.appointmentId?.toString() || '',
        allergies: data.allergies || '',
        medicalAlerts: data.medicalAlerts || '',
        history: data.history || '',
        diagnosis: data.diagnosis || '',
        xRayFindings: data.xRayFindings || '',
        periodontalStatus: data.periodontalStatus || '',
        clinicalNotes: data.clinicalNotes || '',
        recommendations: data.recommendations || '',
      });

      // Load teeth records
      if (data.teeth && data.teeth.length > 0) {
        setSelectedTeeth(data.teeth);
      }

      // Load medications
      if (data.medications && data.medications.length > 0) {
        setMedications(data.medications.map(med => ({
          name: med.name || '',
          dosage: med.dosage || '',
          frequency: med.frequency || '',
          route: med.route || '',
          startDate: med.startDate || '',
          notes: med.notes || '',
        })));
      }

      // Load procedures
      if (data.procedures && data.procedures.length > 0) {
        setTreatments(data.procedures.map(proc => ({
          code: proc.code || '',
          description: proc.description || '',
          performedAt: proc.performedAt || '',
          toothNumber: proc.toothNumber || '',
          status: proc.status || '',
          notes: proc.notes || '',
        })));
      }
    } catch (error: any) {
      console.error('Error loading EHR:', error);
      setAlert({ type: 'error', message: error?.error || 'Failed to load EHR' });
      setTimeout(() => router.push('/dashboard/ehr'), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  // Tooth handling
  const handleToothClick = (toothNumber: number) => {
    setSelectedToothNumber(toothNumber);
    const existingTooth = selectedTeeth.find(t => t.toothNumber === toothNumber);
    if (existingTooth) {
      setToothStatus(existingTooth.condition || existingTooth.Condition || 'Healthy');
    } else {
      setToothStatus('Healthy');
    }
  };

  const updateToothStatus = () => {
    if (selectedToothNumber === null) return;
    
    const existingIndex = selectedTeeth.findIndex(t => t.toothNumber === selectedToothNumber);
    
    if (existingIndex >= 0) {
      const updated = [...selectedTeeth];
      updated[existingIndex] = { ...updated[existingIndex], condition: toothStatus };
      setSelectedTeeth(updated);
    } else {
      setSelectedTeeth([...selectedTeeth, { 
        ToothNumber: selectedToothNumber,
        toothNumber: selectedToothNumber, 
        Condition: toothStatus,
        condition: toothStatus,
        LastUpdated: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      }]);
    }
    
    setSelectedToothNumber(null);
    setToothStatus('Healthy');
  };

  // Medications handling
  const addMedication = () => {
    setMedications([...medications, {
      name: '',
      dosage: '',
      frequency: '',
      route: 'Oral',
      startDate: new Date().toISOString().split('T')[0],
      notes: '',
    }]);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const updateMedication = (index: number, field: keyof MedicationForm, value: string) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
  };

  // Treatments handling
  const addTreatment = () => {
    setTreatments([...treatments, {
      code: '',
      description: '',
      performedAt: new Date().toISOString(),
      toothNumber: '',
      status: 'Completed',
      notes: '',
    }]);
  };

  const removeTreatment = (index: number) => {
    setTreatments(treatments.filter((_, i) => i !== index));
  };

  const updateTreatment = (index: number, field: keyof TreatmentForm, value: string) => {
    const updated = [...treatments];
    updated[index] = { ...updated[index], [field]: value };
    setTreatments(updated);
  };

  const handleSave = async () => {
    if (!existingEHR || !patient) {
      setAlert({ type: 'error', message: 'Required data is missing' });
      return;
    }

    // Comprehensive validation (as per API requirements)
    const errors: string[] = [];
    
    if (!formData.diagnosis || formData.diagnosis.trim().length < 10) {
      errors.push('Diagnosis is required (minimum 10 characters)');
    }
    
    if (!formData.allergies || formData.allergies.trim().length < 3) {
      errors.push('Allergies information is required (enter "None" if no allergies)');
    }
    
    if (!formData.medicalAlerts || formData.medicalAlerts.trim().length < 3) {
      errors.push('Medical alerts are required (enter "None" if no alerts)');
    }
    
    if (!formData.history || formData.history.trim().length < 10) {
      errors.push('Medical history is required (minimum 10 characters)');
    }

    // Validate medications
    for (let i = 0; i < medications.length; i++) {
      if (!medications[i].name.trim()) {
        errors.push(`Medication #${i + 1}: Name is required`);
      }
    }

    // Validate procedures
    for (let i = 0; i < treatments.length; i++) {
      if (!treatments[i].code.trim()) {
        errors.push(`Treatment #${i + 1}: Code is required`);
      }
      if (!treatments[i].description.trim()) {
        errors.push(`Treatment #${i + 1}: Description is required`);
      }
    }

    if (errors.length > 0) {
      setAlert({ type: 'error', message: errors.join(' | ') });
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare EHRUpdateRequest payload
      // NOTE: This REPLACES all nested collections (medications, procedures, teeth, xRays)
      const updateData = {
        ehr_ID: parseInt(ehrId),
        patient_ID: patient.patient_ID,
        appointmentId: parseInt(formData.appointmentId),
        // Scalar fields
        allergies: formData.allergies,
        medicalAlerts: formData.medicalAlerts,
        history: formData.history,
        diagnosis: formData.diagnosis,
        xRayFindings: formData.xRayFindings,
        periodontalStatus: formData.periodontalStatus,
        clinicalNotes: formData.clinicalNotes,
        recommendations: formData.recommendations,
        // Nested collections (REPLACE mode) - Using PascalCase to match backend DTOs
        medications: medications.map(med => ({
          name: med.name,
          Name: med.name,
          dosage: med.dosage || undefined,
          Dosage: med.dosage || undefined,
          frequency: med.frequency || undefined,
          Frequency: med.frequency || undefined,
          route: med.route || undefined,
          Route: med.route || undefined,
          startDate: med.startDate || undefined,
          StartDate: med.startDate || undefined,
          endDate: undefined,
          EndDate: undefined, // Optional
          notes: med.notes || undefined,
          Notes: med.notes || undefined,
        })),
        procedures: treatments.map(treatment => ({
          code: treatment.code,
          Code: treatment.code,
          description: treatment.description,
          Description: treatment.description,
          performedAt: treatment.performedAt,
          PerformedAt: treatment.performedAt,
          toothNumber: treatment.toothNumber || undefined,
          ToothNumber: treatment.toothNumber || undefined,
          status: treatment.status || undefined,
          Status: treatment.status || undefined,
          notes: treatment.notes || undefined,
          Notes: treatment.notes || undefined,
        })),
        teeth: selectedTeeth.filter(tooth => tooth.toothNumber || tooth.ToothNumber).map(tooth => ({
          toothNumber: (tooth.toothNumber || tooth.ToothNumber)!,
          ToothNumber: (tooth.toothNumber || tooth.ToothNumber)!,
          condition: tooth.condition || undefined,
          Condition: tooth.condition || undefined,
          treatmentPlanned: tooth.treatmentPlanned || undefined,
          TreatmentPlanned: tooth.treatmentPlanned || undefined,
          treatmentCompleted: tooth.treatmentCompleted || undefined,
          TreatmentCompleted: tooth.treatmentCompleted || undefined,
          surfaces: tooth.surfaces || undefined,
          Surfaces: tooth.surfaces || undefined,
          notes: tooth.notes || undefined,
          Notes: tooth.notes || undefined,
        })),
        xRays: [], // Empty for now, can be extended later
      };

      // API call: PUT /EHR/{EHR_ID}
      // Returns: { message: string, ehr: EHRResponse }
      const response = await ehrService.updateEHR(ehrId, updateData);
      
      setAlert({ type: 'success', message: response.message || 'EHR updated successfully' });
      
      // Reload the EHR to get updated changeLogs
      await loadEHR();
      
      // Optional: Navigate back after delay
      setTimeout(() => router.push('/dashboard/ehr'), 1500);
    } catch (error: any) {
      console.error('EHR Update Error:', error);
      
      // Handle specific error cases
      let errorMessage = 'Failed to update EHR';
      
      if (error?.error) {
        errorMessage = error.error;
      }
      
      // Handle validation errors with details
      if (error?.details && Array.isArray(error.details)) {
        errorMessage += ': ' + error.details.join(', ');
      }
      
      // Add hint if available
      if (error?.hint) {
        errorMessage += ' (' + error.hint + ')';
      }
      
      setAlert({ type: 'error', message: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <LoadingSpinner fullScreen />;

  // Authorization check - Only doctors can edit EHRs
  if (!isDoctor()) {
    return (
      <div className='text-center py-12'>
        <Alert type='error' message='Access Denied: Only doctors can edit EHR records.' />
        <Button className='mt-4' onClick={() => router.push('/dashboard/ehr')}>Back to EHR</Button>
      </div>
    );
  }

  if (!existingEHR || !patient) {
    return (
      <div className='text-center py-12'>
        <p className='text-gray-500'>EHR or patient data not found</p>
        <Button className='mt-4' onClick={() => router.push('/dashboard/ehr')}>Back</Button>
      </div>
    );
  }

  const patientAge = calculateAge(patient.dob);
  const lastVisit = existingEHR.updatedAt ? new Date(existingEHR.updatedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';

  return (
    <div className='space-y-6 pb-8'>
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {/* Header */}
      <div className='flex justify-between items-center'>
        <div className='flex items-center gap-3'>
          <Button 
            variant='outline' 
            size='sm' 
            onClick={() => router.back()} 
            icon={<ArrowLeft className='w-4 h-4' />}
          >
            Back
          </Button>
          <div>
            <h1 className='text-3xl font-bold'>🦷 Electronic Health Record (EHR) – Edit</h1>
            <p className='text-gray-600 mt-1'>Update medical & dental history, treatments, medications, and changes</p>
          </div>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSubmitting} 
          icon={<Save className='w-4 h-4' />}
          size='lg'
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <div className='flex gap-4'>
          <div className='flex-1 relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
            <input
              type='text'
              placeholder='🔍 Search in EHR...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent'
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500'
          >
            <option value='all'>All</option>
            <option value='medications'>Medications</option>
            <option value='treatments'>Treatments</option>
            <option value='dental'>Dental Chart</option>
          </select>
        </div>
      </Card>

      {/* Important Notice */}
      <div className='bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg'>
        <div className='flex items-start gap-3'>
          <div className='flex-shrink-0'>
            <svg className='w-5 h-5 text-yellow-600' fill='currentColor' viewBox='0 0 20 20'>
              <path fillRule='evenodd' d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z' clipRule='evenodd' />
            </svg>
          </div>
          <div>
            <h3 className='text-sm font-semibold text-yellow-800'>Important: Save replaces all data</h3>
            <p className='text-sm text-yellow-700 mt-1'>
              When you save, medications, treatments, and dental chart entries will <strong>replace</strong> all existing records (not merge). 
              Make sure all required information is included before saving.
            </p>
          </div>
        </div>
      </div>

      {/* Patient Information */}
      <Card>
        <h2 className='text-xl font-bold mb-4 flex items-center gap-2'>
          <span>🧑</span> Patient Information
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Name</label>
            <input
              type='text'
              value={`${patient.first} ${patient.middle || ''} ${patient.last}`.trim()}
              disabled
              className='w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50'
            />
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Age</label>
              <input
                type='text'
                value={patientAge}
                disabled
                className='w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Gender</label>
              <input
                type='text'
                value={patient.gender}
                disabled
                className='w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50'
              />
            </div>
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Phone</label>
            <input
              type='text'
              value={patient.phone || 'N/A'}
              disabled
              className='w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Last Visit</label>
            <input
              type='text'
              value={lastVisit}
              disabled
              className='w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50'
            />
          </div>
        </div>
      </Card>

      {/* Dental Chart */}
      <Card>
        <h2 className='text-xl font-bold mb-4 flex items-center gap-2'>
          <span>🦷</span> Dental Chart (Selectable Tooth Diagram)
        </h2>
        <div className='space-y-4'>
          <ToothChart
            selectedTeeth={selectedTeeth}
            onToothClick={handleToothClick}
            notation='universal'
            readonly={false}
          />
          
          <div className='bg-gradient-to-r from-green-50 to-gray-50 border border-gray-200 rounded-lg p-4 mt-4'>
            <p className='font-semibold text-gray-700 mb-3'>🎨 Color Legend:</p>
            <div className='grid grid-cols-2 gap-3 text-sm text-gray-700'>
              <div>● Healthy - Green</div>
              <div>● Treated (Filling, Crown, Root Canal) - Yellow</div>
              <div>● Problem (Caries, Extraction) - Red</div>
              <div>● Missing - Gray</div>
              <div>● Others (Custom Condition) - Purple</div>
            </div>
          </div>
          
          {selectedToothNumber !== null && (
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
              <div className='flex items-center gap-4 flex-wrap'>
                <p className='font-semibold text-lg'>Tooth #{selectedToothNumber}</p>
                <div className='flex items-center gap-2 flex-1 min-w-[300px]'>
                  <label className='font-medium text-gray-700'>Condition:</label>
                  <select
                    value={showCustomInput ? 'others' : toothStatus}
                    onChange={(e) => {
                      if (e.target.value === 'others') {
                        setShowCustomInput(true);
                        setToothStatus('');
                      } else {
                        setShowCustomInput(false);
                        setToothStatus(e.target.value);
                        setCustomToothCondition('');
                      }
                    }}
                    className='flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white cursor-pointer'
                  >
                    <option value='Healthy'>● Healthy</option>
                    <option value='Caries'>● Caries</option>
                    <option value='Filling'>● Filling</option>
                    <option value='Root Canal'>● Root Canal</option>
                    <option value='Extraction'>● Extraction</option>
                    <option value='Crown'>● Crown</option>
                    <option value='Missing'>● Missing</option>
                    <option value='others'>● Others (Custom)</option>
                  </select>
                </div>
                {showCustomInput && (
                  <input
                    type='text'
                    value={customToothCondition}
                    onChange={(e) => setCustomToothCondition(e.target.value)}
                    placeholder='Enter custom condition...'
                    className='px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                  />
                )}
                <Button 
                  onClick={() => {
                    if (showCustomInput && customToothCondition) {
                      setToothStatus(customToothCondition);
                    }
                    updateToothStatus();
                    setShowCustomInput(false);
                    setCustomToothCondition('');
                  }} 
                  size='sm'
                >
                  Update Status
                </Button>
                <Button 
                  variant='outline' 
                  size='sm' 
                  onClick={() => {
                    setSelectedToothNumber(null);
                    setShowCustomInput(false);
                    setCustomToothCondition('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Medications */}
      <Card>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='text-xl font-bold flex items-center gap-2'>
            <span>💊</span> Medications
          </h2>
          <Button onClick={addMedication} size='sm' icon={<Plus className='w-4 h-4' />}>
            Add Medication
          </Button>
        </div>
        
        <div className='space-y-3'>
          {medications.length === 0 ? (
            <p className='text-gray-500 text-center py-4'>No medications added yet. Click "Add Medication" to add one.</p>
          ) : (
            medications.map((med, index) => (
              <div key={index} className='border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50'>
                <div className='flex justify-between items-start'>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-3 flex-1'>
                    <input
                      type='text'
                      placeholder='Medication name'
                      value={med.name}
                      onChange={(e) => updateMedication(index, 'name', e.target.value)}
                      className='px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500'
                    />
                    <input
                      type='text'
                      placeholder='Dosage (e.g., 500mg)'
                      value={med.dosage}
                      onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                      className='px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500'
                    />
                    <input
                      type='text'
                      placeholder='Frequency (e.g., Twice daily)'
                      value={med.frequency}
                      onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                      className='px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500'
                    />
                  </div>
                  <button
                    onClick={() => removeMedication(index)}
                    className='ml-2 p-2 text-red-600 hover:bg-red-50 rounded-lg'
                  >
                    <X className='w-5 h-5' />
                  </button>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                  <input
                    type='date'
                    value={med.startDate}
                    onChange={(e) => updateMedication(index, 'startDate', e.target.value)}
                    className='px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500'
                  />
                  <input
                    type='text'
                    placeholder='Notes (e.g., As needed for pain)'
                    value={med.notes}
                    onChange={(e) => updateMedication(index, 'notes', e.target.value)}
                    className='px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500'
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Treatments & Procedures */}
      <Card>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='text-xl font-bold flex items-center gap-2'>
            <span>📝</span> Treatments & Procedures
          </h2>
          <Button onClick={addTreatment} size='sm' icon={<Plus className='w-4 h-4' />}>
            Add Treatment
          </Button>
        </div>
        
        <div className='space-y-3'>
          {treatments.length === 0 ? (
            <p className='text-gray-500 text-center py-4'>No treatments added yet. Click "Add Treatment" to add one.</p>
          ) : (
            treatments.map((treatment, index) => (
              <div key={index} className='border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50'>
                <div className='flex justify-between items-start'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-3 flex-1'>
                    <input
                      type='text'
                      placeholder='Procedure code'
                      value={treatment.code}
                      onChange={(e) => updateTreatment(index, 'code', e.target.value)}
                      className='px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500'
                    />
                    <input
                      type='text'
                      placeholder='Description (e.g., Cleaning & Scaling)'
                      value={treatment.description}
                      onChange={(e) => updateTreatment(index, 'description', e.target.value)}
                      className='px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500'
                    />
                  </div>
                  <button
                    onClick={() => removeTreatment(index)}
                    className='ml-2 p-2 text-red-600 hover:bg-red-50 rounded-lg'
                  >
                    <X className='w-5 h-5' />
                  </button>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                  <input
                    type='datetime-local'
                    value={treatment.performedAt.slice(0, 16)}
                    onChange={(e) => updateTreatment(index, 'performedAt', e.target.value)}
                    className='px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500'
                  />
                  <input
                    type='text'
                    placeholder='Tooth number (optional)'
                    value={treatment.toothNumber}
                    onChange={(e) => updateTreatment(index, 'toothNumber', e.target.value)}
                    className='px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500'
                  />
                  <select
                    value={treatment.status}
                    onChange={(e) => updateTreatment(index, 'status', e.target.value)}
                    className='px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500'
                  >
                    <option value='Planned'>Planned</option>
                    <option value='In Progress'>In Progress</option>
                    <option value='Completed'>Completed</option>
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Appointment-linked Changes (Audit Trail) */}
      {existingEHR.changeLogs && existingEHR.changeLogs.length > 0 && (
        <Card>
          <h2 className='text-xl font-bold mb-4 flex items-center gap-2'>
            <span>🗂️</span> Appointment-linked Changes (Audit Trail)
          </h2>
          <p className='text-sm text-gray-600 mb-4'>
            Complete history of all changes made to this EHR, tracked by appointment and doctor.
          </p>
          <div className='space-y-3'>
            {existingEHR.changeLogs
              .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
              .map((change) => {
                const changeDate = new Date(change.changedAt);
                const isCreate = change.changeType === 'Create';
                const isDelete = change.changeType === 'Delete';
                const isUpdate = change.changeType === 'Update';
                
                return (
                  <div 
                    key={change.changeLog_ID} 
                    className={`border-l-4 p-4 rounded-r-lg ${
                      isCreate ? 'border-green-500 bg-green-50' :
                      isDelete ? 'border-red-500 bg-red-50' :
                      'border-blue-500 bg-blue-50'
                    }`}
                  >
                    <div className='flex items-start gap-3'>
                      <Calendar className={`w-5 h-5 mt-0.5 ${
                        isCreate ? 'text-green-600' :
                        isDelete ? 'text-red-600' :
                        'text-blue-600'
                      }`} />
                      <div className='flex-1'>
                        <div className='flex items-center gap-2 flex-wrap'>
                          <p className={`font-semibold ${
                            isCreate ? 'text-green-900' :
                            isDelete ? 'text-red-900' :
                            'text-blue-900'
                          }`}>
                            Appointment ID: {change.appointmentId}
                          </p>
                          <span className='text-gray-400'>•</span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${
                            isCreate ? 'bg-green-200 text-green-800' :
                            isDelete ? 'bg-red-200 text-red-800' :
                            'bg-blue-200 text-blue-800'
                          }`}>
                            {change.changeType}
                          </span>
                          <span className='text-gray-400'>•</span>
                          <span className='text-sm text-gray-600'>
                            {changeDate.toLocaleDateString('en-US', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </span>
                        </div>
                        
                        <p className={`text-sm mt-2 ${
                          isCreate ? 'text-green-800' :
                          isDelete ? 'text-red-800' :
                          'text-blue-800'
                        }`}>
                          <strong>Field:</strong> {change.fieldName}
                        </p>
                        
                        {(change.oldValue || change.newValue) && (
                          <div className='mt-2 text-sm'>
                            {change.oldValue && (
                              <p className='text-gray-700'>
                                <strong>Old:</strong> <span className='font-mono bg-white px-2 py-1 rounded'>{change.oldValue}</span>
                              </p>
                            )}
                            {change.newValue && (
                              <p className='text-gray-700 mt-1'>
                                <strong>New:</strong> <span className='font-mono bg-white px-2 py-1 rounded'>{change.newValue}</span>
                              </p>
                            )}
                          </div>
                        )}
                        
                        <p className='text-xs text-gray-600 mt-2'>
                          Updated by <strong>{change.changedByDoctorName}</strong> (ID: {change.changedByDoctorId}) 
                          at {changeDate.toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      )}

      {/* Medical Information Fields */}
      <Card>
        <h2 className='text-xl font-bold mb-4'>Medical Information</h2>
        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-semibold mb-2'>🔬 Diagnosis <span className='text-red-500'>*</span></label>
            <textarea
              value={formData.diagnosis}
              onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
              rows={3}
              className='w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500'
              placeholder='Enter primary dental diagnosis...'
              required
            />
          </div>

          <div>
            <label className='block text-sm font-semibold mb-2'>🩹 Allergies <span className='text-red-500'>*</span></label>
            <textarea
              value={formData.allergies}
              onChange={(e) => setFormData({...formData, allergies: e.target.value})}
              rows={2}
              className='w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500'
              placeholder='List all known allergies or enter "None"'
              required
            />
          </div>

          <div>
            <label className='block text-sm font-semibold mb-2'>⚠️ Medical Alerts <span className='text-red-500'>*</span></label>
            <textarea
              value={formData.medicalAlerts}
              onChange={(e) => setFormData({...formData, medicalAlerts: e.target.value})}
              rows={2}
              className='w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500'
              placeholder='Important medical conditions or warnings'
              required
            />
          </div>

          <div>
            <label className='block text-sm font-semibold mb-2'>📋 Medical History <span className='text-red-500'>*</span></label>
            <textarea
              value={formData.history}
              onChange={(e) => setFormData({...formData, history: e.target.value})}
              rows={3}
              className='w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500'
              placeholder='Complete medical and dental history...'
              required
            />
          </div>

          <div>
            <label className='block text-sm font-semibold mb-2'>📸 X-Ray Findings</label>
            <textarea
              value={formData.xRayFindings}
              onChange={(e) => setFormData({...formData, xRayFindings: e.target.value})}
              rows={2}
              className='w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500'
              placeholder='Radiographic findings and interpretations...'
            />
          </div>

          <div>
            <label className='block text-sm font-semibold mb-2'>🦷 Periodontal Status</label>
            <textarea
              value={formData.periodontalStatus}
              onChange={(e) => setFormData({...formData, periodontalStatus: e.target.value})}
              rows={2}
              className='w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500'
              placeholder='Gum health, pocket depth, bleeding, inflammation status...'
            />
          </div>

          <div>
            <label className='block text-sm font-semibold mb-2'>📝 Clinical Notes</label>
            <textarea
              value={formData.clinicalNotes}
              onChange={(e) => setFormData({...formData, clinicalNotes: e.target.value})}
              rows={3}
              className='w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500'
              placeholder='Additional observations, patient complaints...'
            />
          </div>

          <div>
            <label className='block text-sm font-semibold mb-2'>💡 Recommendations</label>
            <textarea
              value={formData.recommendations}
              onChange={(e) => setFormData({...formData, recommendations: e.target.value})}
              rows={3}
              className='w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500'
              placeholder='Treatment plan, follow-up care, and patient instructions...'
            />
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className='flex justify-end gap-3 sticky bottom-0 bg-white py-4 border-t'>
        <Button variant='secondary' onClick={() => router.back()} size='lg'>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={isSubmitting} 
          icon={<Save className='w-4 h-4' />} 
          size='lg'
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
