'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/Card';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import Breadcrumb from '@/components/Breadcrumb';
import { patientService, appointmentService, ehrService } from '@/services';
import { Patient, Appointment, EHR } from '@/types/api.types';
import { getEhrId } from '@/utils/ehr.utils';
import { formatDateForDisplay, formatTimeForDisplay } from '@/utils/date.utils';
import { User, Calendar, FileText, Phone, MapPin, Edit } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function PatientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const patientId = Number(params.id);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [ehrRecords, setEhrRecords] = useState<EHR[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isNaN(patientId)) {
      console.error('Invalid patient ID:', params.id);
      router.push('/dashboard/patients');
      return;
    }
    fetchPatientData();
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      setIsLoading(true);

      const patientData = await patientService.getPatientById(patientId) as Patient;
      setPatient(patientData);

      try {
        const appointmentData = await appointmentService.getAppointmentsByPatient(patientId) as Appointment[];
        
        const sortedAppointments = appointmentData.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setAppointments(sortedAppointments);
      } catch (aptError) {
        console.error('Error fetching appointments:', aptError);
        setAppointments([]);
      }
      
      try {
        const ehrData = await ehrService.getByPatient(patientId) as EHR[];
        setEhrRecords(ehrData);
      } catch (ehrError) {
        console.error('Error fetching EHR:', ehrError);
        setEhrRecords([]);
      }
    } catch (error) {
      console.error('Error fetching patient data:', error);
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

  const getLatestEHR = () => {
    if (ehrRecords.length === 0) return null;
    return ehrRecords.reduce((latest, current) => {
      const currentDate = current.updatedAt ? new Date(current.updatedAt) : new Date(0);
      const latestDate = latest.updatedAt ? new Date(latest.updatedAt) : new Date(0);
      return currentDate > latestDate ? current : latest;
    });
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

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Patient not found</p>
        <Button onClick={() => router.push('/dashboard/patients')} className="mt-4">
          Back to Patients
        </Button>
      </div>
    );
  }

  const latestEHR = getLatestEHR();
  const patientFullName = `${patient.first} ${patient.middle ? patient.middle + ' ' : ''}${patient.last}`;

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Patients', href: '/dashboard/patients' },
          { label: 'Patient View' }
        ]}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <User className="w-8 h-8 text-primary-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Patient Overview</h1>
            <p className="text-sm text-gray-600 mt-0.5">View general patient information and access EHR</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              if (latestEHR) {
                router.push(`/dashboard/ehr/${getEhrId(latestEHR)}`);
              } else {
                router.push(`/dashboard/ehr?patientId=${patientId}`);
              }
            }}
            variant="outline"
            icon={<FileText className="w-4 h-4" />}
          >
            {latestEHR ? 'View EHR' : 'EHR Records'}
          </Button>
          <Button
            onClick={() => router.push('/dashboard/patients')}
            variant="outline"
          >
            Back to Patients
          </Button>
        </div>
      </div>

      <Card className="border-2 border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Patient Information</h2>
          <Button
            size="sm"
            variant="outline"
            icon={<Edit className="w-4 h-4" />}
          >
            Edit Patient Info
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold text-gray-900">Name:</span>{' '}
            <span className="text-gray-700">{patientFullName}</span>
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
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-500" />
            <span className="font-semibold text-gray-900">Phone:</span>{' '}
            <span className="text-gray-700">{patient.phone || 'N/A'}</span>
          </div>
        </div>
      </Card>

      <Card className="border-2 border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">EHR Summary</h2>
          <div className="flex gap-2">
            {latestEHR && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  icon={<FileText className="w-4 h-4" />}
                  onClick={() => router.push(`/dashboard/ehr/${getEhrId(latestEHR)}`)}
                >
                  View Full EHR
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  icon={<FileText className="w-4 h-4" />}
                  onClick={() => router.push(`/dashboard/ehr/${getEhrId(latestEHR)}/history`)}
                >
                  View History
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="primary"
              icon={<Edit className="w-4 h-4" />}
              onClick={() => latestEHR 
                ? router.push(`/dashboard/ehr/edit/${getEhrId(latestEHR)}`)
                : router.push(`/dashboard/ehr/new?patientId=${patientId}`)
              }
            >
              {latestEHR ? 'Edit EHR' : 'Create EHR'}
            </Button>
          </div>
        </div>

        {latestEHR ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
                Dental Chart Overview:
              </h3>
              {(latestEHR.teeth || latestEHR.Teeth || latestEHR.toothRecords) && ((latestEHR.teeth || latestEHR.Teeth || latestEHR.toothRecords) || []).length > 0 ? (
                <ul className="space-y-2 text-sm text-gray-700 ml-4">
                  {((latestEHR.teeth || latestEHR.Teeth || latestEHR.toothRecords) || []).slice(0, 4).map((tooth, idx) => (
                    <li key={tooth.ToothRecord_ID || tooth.toothRecord_ID || idx} className="flex items-start gap-2">
                      <span className="text-gray-400">-</span>
                      <span>
                        <span className="font-medium">Tooth #{tooth.ToothNumber || tooth.toothNumber}:</span>{' '}
                        {tooth.Condition || tooth.condition}
                        {(tooth.TreatmentCompleted || tooth.treatmentCompleted) && ` - ${tooth.TreatmentCompleted || tooth.treatmentCompleted}`}
                        {(tooth.TreatmentPlanned || tooth.treatmentPlanned) && !(tooth.TreatmentCompleted || tooth.treatmentCompleted) && ` - Planned: ${tooth.TreatmentPlanned || tooth.treatmentPlanned}`}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 ml-4">No dental records available</p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
                Medications Overview:
              </h3>
              {latestEHR.medications && latestEHR.medications.length > 0 ? (
                <ul className="space-y-2 text-sm text-gray-700 ml-4">
                  {latestEHR.medications.slice(0, 3).map((med, idx) => (
                    <li key={med.medication_ID || idx} className="flex items-start gap-2">
                      <span className="text-gray-400">-</span>
                      <span>
                        {med.name} ({med.dosage})
                        {med.frequency && ` - ${med.frequency}`}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 ml-4">No medications on record</p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
                Treatments & Procedures Overview:
              </h3>
              {latestEHR.procedures && latestEHR.procedures.length > 0 ? (
                <ul className="space-y-2 text-sm text-gray-700 ml-4">
                  {latestEHR.procedures.slice(0, 3).map((proc, idx) => (
                    <li key={proc.procedure_ID || idx} className="flex items-start gap-2">
                      <span className="text-gray-400">-</span>
                      <span>
                        {proc.description} – {proc.performedAt ? formatDateForDisplay(proc.performedAt) : 'N/A'}
                        {proc.toothNumber && ` (Tooth #${proc.toothNumber})`}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 ml-4">No procedures recorded</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No EHR records available for this patient</p>
            <Button
              size="sm"
              onClick={() => router.push(`/dashboard/ehr/new?patientId=${patientId}`)}
              icon={<FileText className="w-4 h-4" />}
            >
              Create First EHR
            </Button>
          </div>
        )}
      </Card>

      <Card className="border-2 border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Appointment-linked Changes</h2>
        
        {appointments.length > 0 ? (
          <ul className="space-y-3">
            {appointments.slice(0, 5).map((apt) => (
              <li 
                key={apt.appointment_ID}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Calendar className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 text-sm">
                  <span className="font-semibold text-gray-900">#{apt.ref_Num}</span>
                  <span className="text-gray-600"> – {formatDateForDisplay(apt.date)}: </span>
                  <span className="text-gray-700">{apt.type}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 text-center py-6">No appointments found</p>
        )}
      </Card>
    </div>
  );
}
