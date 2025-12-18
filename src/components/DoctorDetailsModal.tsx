'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import Badge from '@/components/Badge';
import { Doctor, Appointment, Patient } from '@/types/api.types';
import { appointmentService, patientService } from '@/services';
import { formatDateForDisplay, formatTimeForDisplay } from '@/utils/date.utils';
import { Phone, Mail, Calendar, Clock, Users, ArrowRight, Stethoscope, CalendarDays, FileText, Edit, ChevronLeft, ChevronRight } from 'lucide-react';

interface DoctorDetailsModalProps {
  isOpen: boolean;
  doctor: Doctor | null;
  onClose: () => void;
  onEdit?: (doctor: Doctor) => void;
}

export default function DoctorDetailsModal({
  isOpen,
  doctor,
  onClose,
  onEdit,
}: DoctorDetailsModalProps) {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [patientPage, setPatientPage] = useState(0);
  const PATIENTS_PER_PAGE = 3;

  useEffect(() => {
    if (isOpen && doctor) {
      fetchDoctorDetails();
    }
  }, [isOpen, doctor]);

  const fetchDoctorDetails = async () => {
    if (!doctor) return;

    try {
      setIsLoading(true);

      const allAppointments = (await appointmentService.getAllAppointments()) as Appointment[];
      const doctorAppointments = allAppointments
        .filter((apt) => apt.doctor_ID === doctor.id)
        .sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time}`).getTime();
          const dateB = new Date(`${b.date}T${b.time}`).getTime();
          return dateB - dateA; 
        })
        .slice(0, 5); 

      const allPatients = (await patientService.getAllPatients()) as Patient[];

      const appointmentPatientIds = new Set(
        doctorAppointments.map((apt) => apt.patient_ID)
      );
      const doctorPatients = allPatients.filter((p) =>
        appointmentPatientIds.has(p.patient_ID)
      );

      setAppointments(doctorAppointments);
      setPatients(doctorPatients);
    } catch (error) {
      console.error('Error fetching doctor details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPatientName = (patientId: number): string => {
    const patient = patients.find((p) => p.patient_ID === patientId);
    return patient ? `${patient.first} ${patient.last}` : `Patient #${patientId}`;
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

  if (!doctor) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Doctor Details"
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
            variant="secondary"
            onClick={() => {
              if (onEdit && doctor) {
                onEdit(doctor);
                onClose();
              }
            }}
            icon={<Edit className="w-4 h-4" />}
          >
            Edit Doctor Info
          </Button>
          <Button 
            onClick={() => {
              onClose();
              router.push(`/dashboard/appointments?doctor=${doctor?.id}`);
            }}
            icon={<CalendarDays className="w-4 h-4" />}
          >
            View Full Schedule
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
              <Stethoscope className="w-5 h-5 text-primary-600" />
              Doctor Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-gray-600 mb-1">Name</p>
                <p className="text-sm font-semibold text-gray-900">
                  Dr. {doctor.name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-600">Phone</p>
                  <p className="text-sm text-gray-900">{doctor.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-600">Email</p>
                  <p className="text-sm text-gray-900">{doctor.email}</p>
                </div>
              </div>
            </div>
          </div>

          {}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary-600" />
              Schedule & Availability
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-600">Working Days</p>
                  <p className="text-sm text-gray-900">Saturday – Thursday</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-600">Working Hours</p>
                  <p className="text-sm text-gray-900">10:00 AM – 6:00 PM</p>
                </div>
              </div>
            </div>

            {}
            <div className="border-t border-blue-100 pt-3">
              <p className="text-xs font-medium text-gray-700 mb-2">
                Recent Appointments ({appointments.length})
              </p>
              {appointments.length === 0 ? (
                <p className="text-xs text-gray-500 bg-white p-2 rounded">
                  No appointments scheduled
                </p>
              ) : (
                <div className="space-y-1.5">
                  {appointments.slice(0, 3).map((appointment) => (
                    <div
                      key={appointment.appointment_ID}
                      className="flex items-center justify-between p-2 bg-white rounded border border-blue-100 text-xs"
                    >
                      <div className="flex-1 truncate">
                        <span className="font-medium text-gray-900">
                          {formatDateForDisplay(appointment.date)} {formatTimeForDisplay(appointment.time)}
                        </span>
                        <span className="text-gray-600 ml-2">
                          {getPatientName(appointment.patient_ID)}
                        </span>
                      </div>
                      <Badge variant="info" className="text-xs px-2 py-0.5">{appointment.type}</Badge>
                    </div>
                  ))}
                  {appointments.length > 3 && (
                    <p className="text-xs text-center text-gray-500 pt-1">
                      + {appointments.length - 3} more
                    </p>
                  )}
                </div>
              )}
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
