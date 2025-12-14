'use client';

import { useState } from 'react';
import { EHR, Medication, Procedure, ToothRecord, XRay } from '@/types/api.types';
import Button from './Button';
import Input from './Input';
import ToothChart from './ToothChart';
import ImageUpload from './ImageUpload';
import { ChevronDown, ChevronRight, Plus, Trash2, Save, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface EnhancedEHRFormProps {
  initialData?: Partial<EHR>;
  patientId: number;
  appointmentId: number;
  onSubmit: (data: Partial<EHR>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface Section {
  id: string;
  title: string;
  isOpen: boolean;
}

interface FormErrors {
  diagnosis?: string;
  allergies?: string;
  medications?: { [key: number]: { [field: string]: string } };
  procedures?: { [key: number]: { [field: string]: string } };
}

export default function EnhancedEHRForm({
  initialData,
  patientId,
  appointmentId,
  onSubmit,
  onCancel,
  isLoading = false,
}: EnhancedEHRFormProps) {
  const [sections, setSections] = useState<Section[]>([
    { id: 'general', title: 'General Medical Information', isOpen: true },
    { id: 'diagnosis', title: 'Diagnosis & Findings', isOpen: false },
    { id: 'medications', title: 'Medications', isOpen: false },
    { id: 'procedures', title: 'Procedures', isOpen: false },
    { id: 'teeth', title: 'Tooth Chart & Records', isOpen: false },
    { id: 'xrays', title: 'X-Rays', isOpen: false },
    { id: 'clinical', title: 'Clinical Notes & Recommendations', isOpen: false },
  ]);

  const [errors, setErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState<Partial<EHR>>({
    patient_ID: patientId,
    appointmentId: appointmentId,
    allergies: initialData?.allergies || '',
    medicalAlerts: initialData?.medicalAlerts || '',
    history: initialData?.history || '',
    diagnosis: initialData?.diagnosis || '',
    xRayFindings: initialData?.xRayFindings || '',
    periodontalStatus: initialData?.periodontalStatus || '',
    clinicalNotes: initialData?.clinicalNotes || '',
    recommendations: initialData?.recommendations || '',
    treatments: initialData?.treatments || '',
    medications: initialData?.medications || [],
    procedures: initialData?.procedures || [],
    teeth: initialData?.teeth || [],
    xRays: initialData?.xRays || [],
  });

  const toggleSection = (sectionId: string) => {
    setSections(sections.map(s => 
      s.id === sectionId ? { ...s, isOpen: !s.isOpen } : s
    ));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Validate diagnosis (required, minimum length)
    if (!formData.diagnosis || formData.diagnosis.trim().length < 10) {
      newErrors.diagnosis = 'Diagnosis is required (minimum 10 characters)';
    }
    
    // Validate medications
    formData.medications?.forEach((med, index) => {
      if (!med.name?.trim()) {
        if (!newErrors.medications) newErrors.medications = {};
        if (!newErrors.medications[index]) newErrors.medications[index] = {};
        newErrors.medications[index].name = 'Medication name is required';
      }
    });
    
    // Validate procedures
    formData.procedures?.forEach((proc, index) => {
      if (!proc.code?.trim()) {
        if (!newErrors.procedures) newErrors.procedures = {};
        if (!newErrors.procedures[index]) newErrors.procedures[index] = {};
        newErrors.procedures[index].code = 'Procedure code is required';
      }
      if (!proc.description?.trim()) {
        if (!newErrors.procedures) newErrors.procedures = {};
        if (!newErrors.procedures[index]) newErrors.procedures[index] = {};
        newErrors.procedures[index].description = 'Description is required';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      await onSubmit(formData);
    }
  };

  // Medication handlers
  const addMedication = () => {
    setFormData({
      ...formData,
      medications: [
        ...(formData.medications || []),
        {
          name: '',
          dosage: '',
          frequency: '',
          route: '',
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          notes: '',
        },
      ],
    });
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updated = [...(formData.medications || [])];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, medications: updated });
  };

  const removeMedication = (index: number) => {
    const updated = (formData.medications || []).filter((_, i) => i !== index);
    setFormData({ ...formData, medications: updated });
  };

  // Procedure handlers
  const addProcedure = () => {
    setFormData({
      ...formData,
      procedures: [
        ...(formData.procedures || []),
        {
          code: '',
          description: '',
          performedAt: new Date().toISOString().split('T')[0],
          toothNumber: '',
          status: 'Planned',
          notes: '',
        },
      ],
    });
  };

  const updateProcedure = (index: number, field: keyof Procedure, value: string) => {
    const updated = [...(formData.procedures || [])];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, procedures: updated });
  };

  const removeProcedure = (index: number) => {
    const updated = (formData.procedures || []).filter((_, i) => i !== index);
    setFormData({ ...formData, procedures: updated });
  };

  // Tooth Chart handlers
  const handleToothClick = (toothNumber: number) => {
    const existingTeeth = formData.teeth || [];
    const existingIndex = existingTeeth.findIndex(t => t.toothNumber === toothNumber);

    if (existingIndex >= 0) {
      // Remove tooth if already selected
      const updated = existingTeeth.filter((_, i) => i !== existingIndex);
      setFormData({ ...formData, teeth: updated });
    } else {
      // Add new tooth
      setFormData({
        ...formData,
        teeth: [
          ...existingTeeth,
          {
            toothNumber,
            condition: 'Healthy',
            treatmentPlanned: '',
            treatmentCompleted: '',
            surfaces: '',
            notes: '',
          },
        ],
      });
    }
  };

  const updateTooth = (index: number, field: keyof ToothRecord, value: string | number) => {
    const updated = [...(formData.teeth || [])];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, teeth: updated });
  };

  const removeTooth = (index: number) => {
    const updated = (formData.teeth || []).filter((_, i) => i !== index);
    setFormData({ ...formData, teeth: updated });
  };

  // X-Ray handlers
  const addXRay = () => {
    setFormData({
      ...formData,
      xRays: [
        ...(formData.xRays || []),
        {
          type: '',
          findings: '',
          takenAt: new Date().toISOString().split('T')[0],
          takenBy: '',
          notes: '',
        },
      ],
    });
  };

  const updateXRay = (index: number, field: keyof XRay, value: string) => {
    const updated = [...(formData.xRays || [])];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, xRays: updated });
  };

  const removeXRay = (index: number) => {
    const updated = (formData.xRays || []).filter((_, i) => i !== index);
    setFormData({ ...formData, xRays: updated });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Display validation errors */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900">Please fix the following errors:</h4>
              <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
                {errors.diagnosis && <li>{errors.diagnosis}</li>}
                {errors.allergies && <li>{errors.allergies}</li>}
                {errors.medications && Object.values(errors.medications).map((medErr, idx) => (
                  Object.values(medErr).map((err, i) => <li key={`med-${idx}-${i}`}>Medication {idx + 1}: {err}</li>)
                ))}
                {errors.procedures && Object.values(errors.procedures).map((procErr, idx) => (
                  Object.values(procErr).map((err, i) => <li key={`proc-${idx}-${i}`}>Procedure {idx + 1}: {err}</li>)
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {sections.map((section) => (
        <div key={section.id} className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <button
            type="button"
            onClick={() => toggleSection(section.id)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
            {section.isOpen ? (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-500" />
            )}
          </button>

          {section.isOpen && (
            <div className="p-4 border-t border-gray-200">
              {/* Section 1: General Medical Information */}
              {section.id === 'general' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      🩹 Allergies
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      List all known drug, food, or material allergies (e.g., Penicillin, Latex, Aspirin)
                    </p>
                    <textarea
                      value={formData.allergies || ''}
                      onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={3}
                      placeholder="e.g., Penicillin (severe rash), Latex (anaphylaxis), Aspirin (GI upset)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ⚠️ Medical Alerts
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Critical conditions that require special attention during treatment
                    </p>
                    <textarea
                      value={formData.medicalAlerts || ''}
                      onChange={(e) => setFormData({ ...formData, medicalAlerts: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={3}
                      placeholder="e.g., Anticoagulant therapy (Warfarin), Pacemaker, Pregnancy, Diabetes"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      📋 Medical History
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Comprehensive medical background including past conditions, surgeries, and chronic diseases
                    </p>
                    <textarea
                      value={formData.history || ''}
                      onChange={(e) => setFormData({ ...formData, history: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={4}
                      placeholder="e.g., Hypertension (2015-present), Appendectomy (2010), No known cardiac disease"
                    />
                  </div>
                </div>
              )}

              {/* Section 2: Diagnosis & Findings */}
              {section.id === 'diagnosis' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      🔬 Diagnosis <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Primary diagnosis or chief complaint (Required, minimum 10 characters)
                    </p>
                    <textarea
                      value={formData.diagnosis || ''}
                      onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors.diagnosis ? 'border-red-500' : 'border-gray-300'
                      }`}
                      rows={3}
                      placeholder="e.g., Dental caries tooth #14, acute pulpitis with periapical abscess"
                      required
                      minLength={10}
                    />
                    {errors.diagnosis && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.diagnosis}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      X-Ray Findings
                    </label>
                    <textarea
                      value={formData.xRayFindings || ''}
                      onChange={(e) => setFormData({ ...formData, xRayFindings: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={3}
                      placeholder="X-ray findings and observations..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Periodontal Status
                    </label>
                    <textarea
                      value={formData.periodontalStatus || ''}
                      onChange={(e) => setFormData({ ...formData, periodontalStatus: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={3}
                      placeholder="Periodontal assessment..."
                    />
                  </div>
                </div>
              )}

              {/* Section 3: Medications */}
              {section.id === 'medications' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      {(formData.medications || []).length} medication(s) listed
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      icon={<Plus className="w-4 h-4" />}
                      onClick={addMedication}
                    >
                      Add Medication
                    </Button>
                  </div>
                  {(formData.medications || []).map((med, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-gray-900">Medication #{index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeMedication(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          label="Name"
                          value={med.name}
                          onChange={(e) => updateMedication(index, 'name', e.target.value)}
                          placeholder="Medication name"
                        />
                        <Input
                          label="Dosage"
                          value={med.dosage}
                          onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                          placeholder="e.g., 500mg"
                        />
                        <Input
                          label="Frequency"
                          value={med.frequency}
                          onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                          placeholder="e.g., Twice daily"
                        />
                        <Input
                          label="Route"
                          value={med.route}
                          onChange={(e) => updateMedication(index, 'route', e.target.value)}
                          placeholder="e.g., Oral"
                        />
                        <Input
                          label="Start Date"
                          type="date"
                          value={med.startDate}
                          onChange={(e) => updateMedication(index, 'startDate', e.target.value)}
                        />
                        <Input
                          label="End Date"
                          type="date"
                          value={med.endDate}
                          onChange={(e) => updateMedication(index, 'endDate', e.target.value)}
                        />
                      </div>
                      <Input
                        label="Notes"
                        value={med.notes || ''}
                        onChange={(e) => updateMedication(index, 'notes', e.target.value)}
                        placeholder="Additional notes..."
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Section 4: Procedures */}
              {section.id === 'procedures' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      {(formData.procedures || []).length} procedure(s) listed
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      icon={<Plus className="w-4 h-4" />}
                      onClick={addProcedure}
                    >
                      Add Procedure
                    </Button>
                  </div>
                  {(formData.procedures || []).map((proc, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-gray-900">Procedure #{index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeProcedure(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          label="Code"
                          value={proc.code}
                          onChange={(e) => updateProcedure(index, 'code', e.target.value)}
                          placeholder="Procedure code"
                        />
                        <Input
                          label="Performed At"
                          type="date"
                          value={proc.performedAt}
                          onChange={(e) => updateProcedure(index, 'performedAt', e.target.value)}
                        />
                        <Input
                          label="Tooth Number"
                          value={proc.toothNumber}
                          onChange={(e) => updateProcedure(index, 'toothNumber', e.target.value)}
                          placeholder="e.g., 14"
                        />
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status
                          </label>
                          <select
                            value={proc.status}
                            onChange={(e) => updateProcedure(index, 'status', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="Planned">Planned</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>
                      <Input
                        label="Description"
                        value={proc.description}
                        onChange={(e) => updateProcedure(index, 'description', e.target.value)}
                        placeholder="Procedure description..."
                      />
                      <Input
                        label="Notes"
                        value={proc.notes || ''}
                        onChange={(e) => updateProcedure(index, 'notes', e.target.value)}
                        placeholder="Additional notes..."
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Section 5: Tooth Chart */}
              {section.id === 'teeth' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Click on teeth to select/deselect. Selected teeth will be added to records below.
                  </p>
                  <ToothChart
                    selectedTeeth={formData.teeth || []}
                    onToothClick={handleToothClick}
                    notation="universal"
                  />
                  
                  {/* Tooth Records List */}
                  {(formData.teeth || []).length > 0 && (
                    <div className="mt-6 space-y-3">
                      <h4 className="font-semibold text-gray-900">
                        Selected Teeth Records ({(formData.teeth || []).length})
                      </h4>
                      {(formData.teeth || []).map((tooth, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3 bg-gray-50">
                          <div className="flex justify-between items-center">
                            <h5 className="font-medium text-gray-900">
                              Tooth #{tooth.toothNumber}
                            </h5>
                            <button
                              type="button"
                              onClick={() => removeTooth(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Condition
                              </label>
                              <select
                                value={tooth.condition}
                                onChange={(e) => updateTooth(index, 'condition', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              >
                                <option value="Healthy">Healthy</option>
                                <option value="Cavity">Cavity</option>
                                <option value="Filled">Filled</option>
                                <option value="Crown">Crown</option>
                                <option value="Missing">Missing</option>
                                <option value="Decay">Decay</option>
                              </select>
                            </div>
                            <Input
                              label="Surfaces"
                              value={tooth.surfaces || ''}
                              onChange={(e) => updateTooth(index, 'surfaces', e.target.value)}
                              placeholder="e.g., MOD"
                            />
                            <Input
                              label="Treatment Planned"
                              value={tooth.treatmentPlanned || ''}
                              onChange={(e) => updateTooth(index, 'treatmentPlanned', e.target.value)}
                              placeholder="Planned treatment..."
                            />
                            <Input
                              label="Treatment Completed"
                              value={tooth.treatmentCompleted || ''}
                              onChange={(e) => updateTooth(index, 'treatmentCompleted', e.target.value)}
                              placeholder="Completed treatment..."
                            />
                          </div>
                          <Input
                            label="Notes"
                            value={tooth.notes || ''}
                            onChange={(e) => updateTooth(index, 'notes', e.target.value)}
                            placeholder="Additional notes about this tooth..."
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Section 6: X-Rays */}
              {section.id === 'xrays' && (
                <div className="space-y-4">
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Select X-Ray Images</h4>
                    <ImageUpload
                      maxFiles={10}
                      maxSizeMB={10}
                      existingImages={(formData.xRays || []).filter(x => x.imagePath).map(x => x.imagePath!)}
                      onRemoveExisting={(imagePath) => {
                        const updated = (formData.xRays || []).filter(x => x.imagePath !== imagePath);
                        setFormData({ ...formData, xRays: updated });
                      }}
                      onChange={(files) => {
                        // Just store files locally for preview, no backend upload
                        const newXRays = files.map(file => ({
                          type: 'Local Image',
                          findings: '',
                          takenAt: new Date().toISOString().split('T')[0],
                          takenBy: '',
                          imagePath: URL.createObjectURL(file),
                          notes: '',
                        }));
                        setFormData({
                          ...formData,
                          xRays: [...(formData.xRays || []), ...newXRays],
                        });
                      }}
                    />
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      {(formData.xRays || []).length} X-ray record(s)
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      icon={<Plus className="w-4 h-4" />}
                      onClick={addXRay}
                    >
                      Add X-Ray Details
                    </Button>
                  </div>
                  {(formData.xRays || []).map((xray, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center space-x-2">
                          <ImageIcon className="w-5 h-5 text-gray-400" />
                          <h4 className="font-medium text-gray-900">X-Ray #{index + 1}</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeXRay(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          label="Type"
                          value={xray.type}
                          onChange={(e) => updateXRay(index, 'type', e.target.value)}
                          placeholder="e.g., Bitewing, Periapical"
                        />
                        <Input
                          label="Taken At"
                          type="date"
                          value={xray.takenAt}
                          onChange={(e) => updateXRay(index, 'takenAt', e.target.value)}
                        />
                        <Input
                          label="Taken By"
                          value={xray.takenBy}
                          onChange={(e) => updateXRay(index, 'takenBy', e.target.value)}
                          placeholder="Technician/Doctor name"
                        />
                        <Input
                          label="Image Path (Optional)"
                          value={xray.imagePath || ''}
                          onChange={(e) => updateXRay(index, 'imagePath', e.target.value)}
                          placeholder="Path to X-ray image"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Findings
                        </label>
                        <textarea
                          value={xray.findings}
                          onChange={(e) => updateXRay(index, 'findings', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          rows={3}
                          placeholder="X-ray findings..."
                        />
                      </div>
                      <Input
                        label="Notes"
                        value={xray.notes || ''}
                        onChange={(e) => updateXRay(index, 'notes', e.target.value)}
                        placeholder="Additional notes..."
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Section 7: Clinical Notes */}
              {section.id === 'clinical' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Clinical Notes
                    </label>
                    <textarea
                      value={formData.clinicalNotes || ''}
                      onChange={(e) => setFormData({ ...formData, clinicalNotes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={5}
                      placeholder="Detailed clinical observations and notes..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Treatments
                    </label>
                    <textarea
                      value={formData.treatments || ''}
                      onChange={(e) => setFormData({ ...formData, treatments: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={4}
                      placeholder="Treatment details..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recommendations
                    </label>
                    <textarea
                      value={formData.recommendations || ''}
                      onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={4}
                      placeholder="Recommendations for the patient..."
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          icon={<Save className="w-5 h-5" />}
          isLoading={isLoading}
        >
          Save EHR
        </Button>
      </div>
    </form>
  );
}
