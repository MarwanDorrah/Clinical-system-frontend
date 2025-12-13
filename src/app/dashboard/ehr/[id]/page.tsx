'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Breadcrumb from '@/components/Breadcrumb';
import ToothChart from '@/components/ToothChart';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ehrService, patientService, appointmentService } from '@/services';
import { EHR, Patient, Appointment, ToothRecord } from '@/types/api.types';
import { getEhrId } from '@/utils/ehr.utils';
import { formatDateForDisplay } from '@/utils/date.utils';
import { FileText, Pill, Stethoscope, Calendar, Edit, History } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function EHRViewPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const ehrId = Number(params.id);

  const [ehr, setEhr] = useState<EHR | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedTooth, setSelectedTooth] = useState<ToothRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isNaN(ehrId)) {
      console.error('Invalid EHR ID:', params.id);
      router.push('/dashboard/ehr');
      return;
    }
    fetchEHRData();
  }, [ehrId]);

  const fetchEHRData = async () => {
    try {
      setIsLoading(true);

      // Fetch EHR data
      const ehrData = await ehrService.getEHRById(ehrId) as EHR;
      setEhr(ehrData);
      
      console.log('EHR Data received:', ehrData);
      console.log('Teeth array:', ehrData.teeth || ehrData.Teeth);
      console.log('Number of teeth:', (ehrData.teeth || ehrData.Teeth)?.length);

      // Fetch patient data
      if (ehrData.patient_ID) {
        const patientData = await patientService.getPatientById(ehrData.patient_ID) as Patient;
        setPatient(patientData);

        // Fetch appointments for this patient
        try {
          const appointmentData = await appointmentService.getAppointmentsByPatient(ehrData.patient_ID) as Appointment[];
          setAppointments(appointmentData);
        } catch (error) {
          console.error('Error fetching appointments:', error);
          setAppointments([]);
        }
      }

      // Set first tooth as selected if available
      const teeth = ehrData.teeth || ehrData.Teeth || [];
      if (teeth && teeth.length > 0) {
        setSelectedTooth(teeth[0]);
      }
    } catch (error) {
      console.error('Error fetching EHR data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleToothClick = (toothNumber: number) => {
    const teeth = ehr?.teeth || ehr?.Teeth;
    if (teeth && teeth.length > 0) {
      const tooth = teeth.find(t => {
        const t_num = t.ToothNumber || t.toothNumber;
        return t_num === toothNumber;
      });
      if (tooth) {
        setSelectedTooth(tooth);
      } else {
        console.log('Tooth not found:', toothNumber, 'Available teeth:', teeth.map(t => t.ToothNumber || t.toothNumber));
      }
    } else {
      console.log('No teeth data available');
    }
  };

  const getLastVisit = () => {
    if (appointments.length === 0) return 'N/A';
    const sortedAppointments = [...appointments].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return formatDateForDisplay(sortedAppointments[0].date);
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!ehr || !patient) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">EHR not found</p>
        <Button onClick={() => router.push('/dashboard/ehr')} className="mt-4">
          Back to EHR
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Patients', href: '/dashboard/patients' },
          { label: 'EHR View' }
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-primary-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Electronic Health Record (EHR)</h1>
            <p className="text-sm text-gray-600 mt-0.5">View full medical & dental history, treatments, medications, and changes</p>
          </div>
        </div>
        <Button
          onClick={() => router.push(`/dashboard/ehr/edit/${ehrId}`)}
          icon={<Edit className="w-4 h-4" />}
        >
          Edit EHR
        </Button>
      </div>

      {/* Patient Information Card */}
      <Card className="border-2 border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            🧑 Patient Information
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold text-gray-900">Name:</span>{' '}
            <span className="text-gray-700">{patient.first} {patient.middle ? patient.middle + ' ' : ''}{patient.last}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-900">Age:</span>{' '}
            <span className="text-gray-700">{calculateAge(patient.dob)}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-900">Gender:</span>{' '}
            <span className="text-gray-700">{patient.gender}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-900">Last Visit:</span>{' '}
            <span className="text-gray-700">{getLastVisit()}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-900">Phone:</span>{' '}
            <span className="text-gray-700">{patient.phone || 'N/A'}</span>
          </div>
        </div>
      </Card>

      {/* Dental Chart Card */}
      <Card className="border-2 border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            🦷 Dental Chart (Select Tooth from Diagram)
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tooth Chart */}
          <div className="lg:col-span-2">
            <ToothChart
              selectedTeeth={ehr.teeth || ehr.Teeth || []}
              onToothClick={handleToothClick}
              readonly={false}
            />
            <p className="text-sm text-gray-600 mt-4 text-center">
              Click on a tooth to view/edit status
            </p>
          </div>

          {/* Teeth Details List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <h3 className="text-sm font-bold text-gray-900 sticky top-0 bg-white">
              Tooth Details
            </h3>
            {(ehr.teeth || ehr.Teeth) && ((ehr.teeth || ehr.Teeth) || []).length > 0 ? (
              <div className="space-y-2">
                {((ehr.teeth || ehr.Teeth) || []).map((tooth) => (
                  <div 
                    key={tooth.ToothRecord_ID || tooth.toothRecord_ID}
                    onClick={() => handleToothClick(tooth.ToothNumber || tooth.toothNumber || 0)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedTooth?.ToothNumber === (tooth.ToothNumber || tooth.toothNumber) || 
                      selectedTooth?.toothNumber === (tooth.ToothNumber || tooth.toothNumber)
                        ? 'bg-blue-50 border-blue-400'
                        : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <p className="font-semibold text-gray-900 text-sm mb-1">
                      Tooth #{tooth.ToothNumber || tooth.toothNumber}
                    </p>
                    <div className="text-xs space-y-1 text-gray-700">
                      <p>
                        <span className="font-medium">Condition:</span> {tooth.Condition || tooth.condition || 'Normal'}
                      </p>
                      {(tooth.TreatmentPlanned || tooth.treatmentPlanned) && (
                        <p>
                          <span className="font-medium">Planned:</span> {tooth.TreatmentPlanned || tooth.treatmentPlanned}
                        </p>
                      )}
                      {(tooth.TreatmentCompleted || tooth.treatmentCompleted) && (
                        <p>
                          <span className="font-medium">Completed:</span> {tooth.TreatmentCompleted || tooth.treatmentCompleted}
                        </p>
                      )}
                      {(tooth.Surfaces || tooth.surfaces) && (
                        <p>
                          <span className="font-medium">Surfaces:</span> {tooth.Surfaces || tooth.surfaces}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">No tooth records available</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Medications Card */}
      <Card className="border-2 border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Pill className="w-5 h-5" /> Medications
          </h2>
          <Button
            size="sm"
            variant="outline"
            icon={<Edit className="w-4 h-4" />}
            onClick={() => router.push(`/dashboard/ehr/edit/${ehrId}`)}
          >
            Edit Medications
          </Button>
        </div>

        {ehr.medications && ehr.medications.length > 0 ? (
          <div className="space-y-3">
            {ehr.medications.map((med, idx) => (
              <div key={med.medication_ID || idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {med.name} ({med.dosage})
                    </p>
                    <div className="mt-1 space-y-1 text-sm text-gray-600">
                      {med.frequency && <p>Frequency: {med.frequency}</p>}
                      {med.route && <p>Route: {med.route}</p>}
                      {med.startDate && <p>Started: {formatDateForDisplay(med.startDate)}</p>}
                      {med.endDate && <p>Ends: {formatDateForDisplay(med.endDate)}</p>}
                      {med.notes && <p>Notes: {med.notes}</p>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-6">No medications recorded</p>
        )}
      </Card>

      {/* Treatments & Procedures Card */}
      <Card className="border-2 border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Stethoscope className="w-5 h-5" /> Treatments & Procedures
          </h2>
          <Button
            size="sm"
            variant="outline"
            icon={<Edit className="w-4 h-4" />}
            onClick={() => router.push(`/dashboard/ehr/edit/${ehrId}`)}
          >
            Edit Procedures
          </Button>
        </div>

        {ehr.procedures && ehr.procedures.length > 0 ? (
          <div className="space-y-3">
            {ehr.procedures.map((proc, idx) => (
              <div key={proc.procedure_ID || idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      • {proc.description} – {proc.performedAt ? formatDateForDisplay(proc.performedAt) : 'N/A'}
                    </p>
                    <div className="mt-1 text-sm text-gray-600 ml-4">
                      {proc.toothNumber && <p>Tooth: #{proc.toothNumber}</p>}
                      {proc.status && <p>Status: {proc.status}</p>}
                      {proc.notes && <p>Notes: {proc.notes}</p>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-6">No procedures recorded</p>
        )}
      </Card>

      {/* Appointment-linked Changes Card */}
      <Card className="border-2 border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" /> Appointment-linked Changes
        </h2>

        {appointments.length > 0 ? (
          <div className="space-y-3">
            {appointments.map((apt) => (
              <div 
                key={apt.appointment_ID}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <p className="font-semibold text-gray-900">
                  Appointment ID: {apt.ref_Num} – {formatDateForDisplay(apt.date)}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  • EHR updated: {apt.type}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-6">No appointment changes recorded</p>
        )}
      </Card>

      {/* EHR History Card */}
      <Card className="border-2 border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5" /> EHR Change History
          </h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/dashboard/ehr/${ehrId}/history`)}
            icon={<History className="w-4 h-4" />}
          >
            View Full History
          </Button>
        </div>

        <div className="text-sm text-gray-600">
          <p className="mb-4">Track all changes made to this EHR record with timestamps and user information.</p>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-gray-600 mb-3">View the complete change history including:</p>
            <ul className="text-left inline-block space-y-2 text-sm">
              <li>✓ All modifications to patient information</li>
              <li>✓ Dental chart updates</li>
              <li>✓ Medication additions/removals</li>
              <li>✓ Procedure recordings</li>
              <li>✓ Timestamps and user actions</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Footer Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/ehr')}
        >
          Back to EHR List
        </Button>
        <Button
          onClick={() => router.push(`/dashboard/ehr/edit/${ehrId}`)}
          icon={<Edit className="w-4 h-4" />}
        >
          Edit EHR
        </Button>
      </div>
    </div>
  );
}
