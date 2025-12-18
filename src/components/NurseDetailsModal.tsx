'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Nurse, Appointment, Patient } from '@/types/api.types';
import { appointmentService, patientService } from '@/services';
import { formatDateForDisplay, formatTimeForDisplay } from '@/utils/date.utils';
import { Phone, Mail, Users, Heart, Edit, FileText, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface NurseDetailsModalProps {
  isOpen: boolean;
  nurse: Nurse | null;
  onClose: () => void;
  onEdit?: (nurse: Nurse) => void;
}

export default function NurseDetailsModal({
  isOpen,
  nurse,
  onClose,
  onEdit,
}: NurseDetailsModalProps) {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [patientPage, setPatientPage] = useState(0);
  const PATIENTS_PER_PAGE = 3;

  useEffect(() => {
    if (isOpen && nurse) {
      fetchNurseDetails();
    }
  }, [isOpen, nurse]);

  const fetchNurseDetails = async () => {
    if (!nurse) return;

    try {
      setIsLoading(true);

      const allAppointments = (await appointmentService.getAllAppointments()) as Appointment[];
      const allPatients = (await patientService.getAllPatients()) as Patient[];

      const nurseAppointmentPatientIds = new Set(
        allAppointments
          .filter((apt) => apt.nurse_ID === (nurse.nursE_ID || nurse.nurse_ID))
          .map((apt) => apt.patient_ID)
      );

      const nursePatients = allPatients.filter((p) =>
        nurseAppointmentPatientIds.has(p.patient_ID)
      );

      setPatients(nursePatients);
    } catch (error) {
      console.error('Error fetching nurse details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPatientAge = (patientId: number): number | null => {
    const patient = patients.find((p) => p.patient_ID === patientId);
    if (!patient) return null;

    const dob = new Date(patient.dob);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < dob.getDate())
    ) {
      age--;
    }

    return age;
  };

  if (!nurse) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nurse Details"
      size="lg"
      disableBackdropClose={true}
      footer={(
        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Close
          </Button>
          <Button 
            onClick={() => {
              if (onEdit && nurse) {
                onEdit(nurse);
                onClose();
              }
            }}
            icon={<Edit className="w-4 h-4" />}
          >
            Edit Nurse Info
          </Button>
        </div>
      )}
    >
      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="space-y-6">
          {}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary-600" />
              Nurse Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-gray-600 mb-1">Name</p>
                <p className="text-sm font-semibold text-gray-900">
                  {nurse.name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-600">Phone</p>
                  <p className="text-sm text-gray-900">{nurse.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-600">Email</p>
                  <p className="text-sm text-gray-900">{nurse.email}</p>
                </div>
              </div>
            </div>
          </div>

          {}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-600" />
                Assigned Patients ({patients.length})
              </h3>
              {patients.length > PATIENTS_PER_PAGE && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPatientPage(p => Math.max(0, p - 1))}
                    disabled={patientPage === 0}
                    className="p-1.5 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-gray-600">
                    {patientPage + 1} / {Math.ceil(patients.length / PATIENTS_PER_PAGE)}
                  </span>
                  <button
                    onClick={() => setPatientPage(p => Math.min(Math.ceil(patients.length / PATIENTS_PER_PAGE) - 1, p + 1))}
                    disabled={patientPage >= Math.ceil(patients.length / PATIENTS_PER_PAGE) - 1}
                    className="p-1.5 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            {patients.length === 0 ? (
              <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
                No patients assigned yet
              </p>
            ) : (
              <div className="space-y-3">
                {patients.slice(patientPage * PATIENTS_PER_PAGE, (patientPage + 1) * PATIENTS_PER_PAGE).map((patient) => (
                  <div
                    key={patient.patient_ID}
                    className="p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {patient.first} {patient.last}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Age: {getPatientAge(patient.patient_ID)} years · ID: {patient.patient_ID}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          onClose();
                          router.push(`/dashboard/ehr?patient=${patient.patient_ID}`);
                        }}
                        icon={<FileText className="w-3 h-3" />}
                      >
                        <span className="text-xs">EHR</span>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          onClose();
                          router.push(`/dashboard/appointments?patient=${patient.patient_ID}`);
                        }}
                        icon={<Calendar className="w-3 h-3" />}
                      >
                        <span className="text-xs">Appointments</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
