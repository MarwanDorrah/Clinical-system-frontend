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
import { FileText, Pill, Stethoscope, Calendar, Edit, History, User, Activity, Printer } from 'lucide-react';
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
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

      const ehrData = await ehrService.getEHRById(ehrId) as EHR;
      setEhr(ehrData);
      
      console.log('EHR Data received:', ehrData);
      console.log('Teeth array:', ehrData.teeth || ehrData.Teeth);
      console.log('Number of teeth:', (ehrData.teeth || ehrData.Teeth)?.length);

      if (ehrData.patient_ID) {
        const patientData = await patientService.getPatientById(ehrData.patient_ID) as Patient;
        setPatient(patientData);

        try {
          const appointmentData = await appointmentService.getAppointmentsByPatient(ehrData.patient_ID) as Appointment[];
          setAppointments(appointmentData);
        } catch (error) {
          console.error('Error fetching appointments:', error);
          setAppointments([]);
        }
      }

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
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Patients', href: '/dashboard/patients' },
          { label: 'EHR View' }
        ]}
      />

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
        <Button
          variant="outline"
          onClick={() => router.push(`/dashboard/ehr/print/${ehrId}`)}
          icon={<Printer className="w-4 h-4" />}
        >
          Print EHR
        </Button>
      </div>

      <Card className="border-2 border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5 text-gray-600" /> Patient Information
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

      <Card className="border-2 border-gray-200">
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-600" /> Dental Chart (Select Tooth from Diagram)
          </h2>
        </div>

        <div className="space-y-6">
          {}
          <div>
            <ToothChart
              selectedTeeth={ehr.teeth || ehr.Teeth || []}
              onToothClick={handleToothClick}
              readonly={false}
            />
            <p className="text-sm text-gray-600 mt-4 text-center">
              Click on a tooth to view details
            </p>
          </div>

          {selectedTooth && (
            <div className="border-t-2 border-gray-200 pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Tooth #{selectedTooth.ToothNumber || selectedTooth.toothNumber} Details
              </h3>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Condition</p>
                    <p className="text-base font-bold text-gray-900">
                      {(selectedTooth.Condition || selectedTooth.condition || 'Healthy').trim()}
                    </p>
                  </div>
                  
                  {(selectedTooth.TreatmentPlanned || selectedTooth.treatmentPlanned) && (
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Treatment Planned</p>
                      <p className="text-base font-medium text-gray-900">
                        {selectedTooth.TreatmentPlanned || selectedTooth.treatmentPlanned}
                      </p>
                    </div>
                  )}
                  
                  {(selectedTooth.TreatmentCompleted || selectedTooth.treatmentCompleted) && (
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Treatment Status</p>
                      <p className="text-base font-medium text-green-700">
                        {selectedTooth.TreatmentCompleted || selectedTooth.treatmentCompleted}
                      </p>
                    </div>
                  )}
                  
                  {(selectedTooth.Surfaces || selectedTooth.surfaces) && (
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Surfaces Affected</p>
                      <p className="text-base font-medium text-gray-900">
                        {selectedTooth.Surfaces || selectedTooth.surfaces}
                      </p>
                    </div>
                  )}
                </div>
                
                {(selectedTooth.Notes || selectedTooth.notes) && (
                  <div className="bg-white rounded-lg p-4 shadow-sm mt-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Notes</p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {selectedTooth.Notes || selectedTooth.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {}
          {(ehr.teeth || ehr.Teeth) && ((ehr.teeth || ehr.Teeth) || []).length > 0 && (
            <details className="border-t-2 border-gray-200 pt-6">
              <summary className="text-sm font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors">
                View All Teeth Records ({((ehr.teeth || ehr.Teeth) || []).length} teeth)
              </summary>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-4">
                {((ehr.teeth || ehr.Teeth) || []).map((tooth) => (
                  <button
                    key={tooth.ToothRecord_ID || tooth.toothRecord_ID}
                    onClick={() => handleToothClick(tooth.ToothNumber || tooth.toothNumber || 0)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      selectedTooth?.ToothNumber === (tooth.ToothNumber || tooth.toothNumber) || 
                      selectedTooth?.toothNumber === (tooth.ToothNumber || tooth.toothNumber)
                        ? 'bg-blue-50 border-blue-400 shadow-md'
                        : 'bg-gray-50 border-gray-200 hover:border-blue-300 hover:shadow-sm'
                    }`}
                  >
                    <p className="font-semibold text-gray-900 text-sm mb-1">
                      Tooth #{tooth.ToothNumber || tooth.toothNumber}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {(tooth.Condition || tooth.condition || 'Healthy').trim()}
                    </p>
                  </button>
                ))}
              </div>
            </details>
          )}
        </div>
      </Card>

      {}
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

      {}
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

      {}
      <Card className="border-2 border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" /> Appointment-linked Changes
        </h2>

        {appointments.length > 0 ? (
          <div className="space-y-3">
            {appointments.map((apt) => (
              <div 
                key={apt.appointment_ID}
                className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
              >
                <div className="p-3 flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      Appointment ID: {apt.ref_Num} – {formatDateForDisplay(apt.date)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Type: {apt.type} • Time: {apt.time}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={selectedAppointment?.appointment_ID === apt.appointment_ID ? "primary" : "outline"}
                    onClick={() => setSelectedAppointment(selectedAppointment?.appointment_ID === apt.appointment_ID ? null : apt)}
                    className="flex-shrink-0"
                  >
                    {selectedAppointment?.appointment_ID === apt.appointment_ID ? 'Hide' : 'View'} Details
                  </Button>
                </div>
                
                {selectedAppointment?.appointment_ID === apt.appointment_ID && (
                  <div className="px-3 pb-3 pt-2 border-t border-gray-200 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Appointment Details</p>
                        <div className="space-y-2 text-sm">
                          <p><span className="font-medium text-gray-700">Reference:</span> {apt.ref_Num}</p>
                          <p><span className="font-medium text-gray-700">Date:</span> {formatDateForDisplay(apt.date)}</p>
                          <p><span className="font-medium text-gray-700">Time:</span> {apt.time}</p>
                          <p><span className="font-medium text-gray-700">Type:</span> {apt.type}</p>
                          {apt.status && (
                            <p><span className="font-medium text-gray-700">Status:</span> <span className="capitalize inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">{apt.status}</span></p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Healthcare Providers</p>
                        <div className="space-y-2 text-sm">
                          {apt.doctor && (
                            <p><span className="font-medium text-gray-700">Doctor:</span> {apt.doctor.name}</p>
                          )}
                          {apt.nurse && (
                            <p><span className="font-medium text-gray-700">Nurse:</span> {apt.nurse.name}</p>
                          )}
                          {apt.patient && (
                            <p><span className="font-medium text-gray-700">Patient:</span> {apt.patient.first} {apt.patient.last}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-6">No appointment changes recorded</p>
        )}
      </Card>

      {}
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

      {}
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
