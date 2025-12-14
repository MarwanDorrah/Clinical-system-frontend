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
import { Phone, Mail, Calendar, Clock, Users, ArrowRight, Stethoscope, CalendarDays, FileText, Edit } from 'lucide-react';

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

  useEffect(() => {
    if (isOpen && doctor) {
      fetchDoctorDetails();
    }
  }, [isOpen, doctor]);

  const fetchDoctorDetails = async () => {
    if (!doctor) return;

    try {
      setIsLoading(true);

      // Fetch all appointments and filter by doctor
      const allAppointments = (await appointmentService.getAllAppointments()) as Appointment[];
      const doctorAppointments = allAppointments
        .filter((apt) => apt.doctor_ID === doctor.id)
        .sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time}`).getTime();
          const dateB = new Date(`${b.date}T${b.time}`).getTime();
          return dateB - dateA; // Newest first, but show upcoming
        })
        .slice(0, 5); // Get last 5 appointments

      // Fetch all patients
      const allPatients = (await patientService.getAllPatients()) as Patient[];

      // Get unique patients for this doctor's appointments
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
    >
      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Doctor Information Section */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-primary-600" />
              Doctor Information
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">Name</p>
                <p className="text-lg font-semibold text-gray-900">
                  Dr. {doctor.name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="text-gray-900">{doctor.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-gray-900">{doctor.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule & Availability Section */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary-600" />
              Schedule & Availability
            </h3>
            <div className="space-y-3 mb-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Working Days</p>
                  <p className="text-gray-900">Saturday – Thursday</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Working Hours</p>
                  <p className="text-gray-900">10:00 AM – 6:00 PM</p>
                </div>
              </div>
            </div>

            {/* Upcoming Appointments */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">
                Upcoming Appointments
              </p>
              {appointments.length === 0 ? (
                <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
                  No appointments scheduled
                </p>
              ) : (
                <div className="space-y-2">
                  {appointments.map((appointment) => (
                    <div
                      key={appointment.appointment_ID}
                      className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {formatDateForDisplay(appointment.date)} –{' '}
                          {formatTimeForDisplay(appointment.time)} –{' '}
                          {getPatientName(appointment.patient_ID)}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {appointment.type}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              )}
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
              variant="secondary" 
              className="flex-1"
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
              className="flex-1"
              onClick={() => {
                onClose();
                router.push(`/dashboard/appointments?doctor=${doctor?.id}`);
              }}
              icon={<CalendarDays className="w-4 h-4" />}
            >
              View Full Schedule
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
