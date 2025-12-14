'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Nurse, Appointment, Patient } from '@/types/api.types';
import { appointmentService, patientService } from '@/services';
import { formatDateForDisplay, formatTimeForDisplay } from '@/utils/date.utils';
import { Phone, Mail, Users, Heart, Edit, FileText, Calendar } from 'lucide-react';

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

  useEffect(() => {
    if (isOpen && nurse) {
      fetchNurseDetails();
    }
  }, [isOpen, nurse]);

  const fetchNurseDetails = async () => {
    if (!nurse) return;

    try {
      setIsLoading(true);

      // Fetch all appointments and patients
      const allAppointments = (await appointmentService.getAllAppointments()) as Appointment[];
      const allPatients = (await patientService.getAllPatients()) as Patient[];

      // Get unique patients assigned to this nurse
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
    >
      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Nurse Information Section */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary-600" />
              Nurse Information
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">Name</p>
                <p className="text-lg font-semibold text-gray-900">
                  {nurse.name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="text-gray-900">{nurse.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-gray-900">{nurse.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Patients Section */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Assigned Patients
            </h3>
            {patients.length === 0 ? (
              <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
                No patients assigned yet
              </p>
            ) : (
              <div className="space-y-3">
                {patients.map((patient) => (
                  <div
                    key={patient.patient_ID}
                    className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition"
                  >
                    <p className="font-medium text-gray-900">
                      {patient.first} {patient.last}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Age: {getPatientAge(patient.patient_ID)} years
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          onClose();
                          router.push(`/dashboard/ehr?patient=${patient.patient_ID}`);
                        }}
                        icon={<FileText className="w-4 h-4" />}
                      >
                        View EHR
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          onClose();
                          router.push(`/dashboard/appointments?patient=${patient.patient_ID}`);
                        }}
                        icon={<Calendar className="w-4 h-4" />}
                      >
                        View Appointments
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions Section */}
          <div className="pt-4 flex gap-3">
            <Button 
              className="flex-1"
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

          {/* Close Button */}
          <div className="pt-4 border-t border-gray-200 flex justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
