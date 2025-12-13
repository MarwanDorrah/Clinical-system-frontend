'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import Table from '@/components/Table';
import LoadingSpinner from '@/components/LoadingSpinner';
import Modal from '@/components/Modal';
import Input from '@/components/Input';
import Alert from '@/components/Alert';
import { doctorService, appointmentService, ehrService } from '@/services';
import { Doctor, Appointment, EHR } from '@/types/api.types';
import { getEhrId } from '@/utils/ehr.utils';
import { formatDateForDisplay, formatTimeForDisplay } from '@/utils/date.utils';
import { Stethoscope, Calendar, FileText, Phone, Mail, Edit, ArrowLeft, Activity, ChevronRight } from 'lucide-react';

export default function DoctorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const doctorId = Number(params.id);

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [ehrRecords, setEhrRecords] = useState<EHR[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    if (isNaN(doctorId)) {
      router.push('/dashboard/doctors');
      return;
    }
    fetchDoctorData();
  }, [doctorId]);

  const fetchDoctorData = async () => {
    try {
      setIsLoading(true);
      const [doctorData, allAppointments, allEhrs] = await Promise.all([
        doctorService.getDoctorById(doctorId) as Promise<Doctor>,
        appointmentService.getAllAppointments() as Promise<Appointment[]>,
        ehrService.getAllEHRs() as Promise<EHR[]>,
      ]);

      setDoctor(doctorData);
      setAppointments(allAppointments.filter(apt => apt.doctor_ID === doctorId));
      setEhrRecords(allEhrs.filter(ehr => ehr.updatedBy === doctorData.name));
      setFormData({
        name: doctorData.name,
        phone: doctorData.phone,
        email: doctorData.email,
      });
    } catch (error) {
      console.error('Error fetching doctor data:', error);
      showAlert('error', 'Failed to load doctor data');
    } finally {
      setIsLoading(false);
    }
  };

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await doctorService.updateDoctor(doctorId, formData);
      showAlert('success', 'Doctor updated successfully');
      setIsEditModalOpen(false);
      fetchDoctorData();
    } catch (error: any) {
      showAlert('error', error?.error || 'Failed to update doctor');
    }
  };

  const upcomingAppointments = appointments.filter(apt => new Date(apt.date) >= new Date());
  const pastAppointments = appointments.filter(apt => new Date(apt.date) < new Date());

  const appointmentColumns = [
    {
      key: 'date',
      header: 'Date',
      render: (apt: Appointment) => formatDateForDisplay(apt.date),
    },
    {
      key: 'time',
      header: 'Time',
      render: (apt: Appointment) => formatTimeForDisplay(apt.time),
    },
    {
      key: 'patient',
      header: 'Patient',
      render: (apt: Appointment) => apt.patient ? `${apt.patient.first} ${apt.patient.last}` : `Patient #${apt.patient_ID}`,
    },
    {
      key: 'type',
      header: 'Type',
      render: (apt: Appointment) => <Badge variant="default">{apt.type}</Badge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (apt: Appointment) => (
        <Button size="sm" onClick={() => router.push(`/dashboard/appointments`)}>View</Button>
      ),
    },
  ];

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!doctor) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Doctor not found</p>
        <Button onClick={() => router.push('/dashboard/doctors')} className="mt-4">
          Back to Doctors
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center text-sm text-gray-600">
        <span className="hover:text-primary-600 cursor-pointer" onClick={() => router.push('/dashboard')}>
          Dashboard
        </span>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="hover:text-primary-600 cursor-pointer" onClick={() => router.push('/dashboard/doctors')}>
          Doctors
        </span>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-gray-900 font-medium">{doctor.name}</span>
      </div>

      {alert && (
        <div className="mb-4">
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="secondary" size="sm" onClick={() => router.push('/dashboard/doctors')} icon={<ArrowLeft className="w-4 h-4" />}>
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Doctor Profile</h1>
            <p className="text-gray-600 mt-1">View doctor information and activity</p>
          </div>
        </div>
        <Button onClick={() => setIsEditModalOpen(true)} icon={<Edit className="w-4 h-4" />}>
          Edit Profile
        </Button>
      </div>

      {/* Doctor Information */}
      <Card className="mb-6">
        <div className="flex items-start space-x-6">
          <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Stethoscope className="w-12 h-12 text-primary-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-900">{doctor.name}</h2>
            <p className="text-sm text-gray-600 mt-1">Doctor ID: #{doctor.id}</p>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Mail className="w-4 h-4" /> Email
                </p>
                <p className="text-lg font-semibold text-gray-900">{doctor.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Phone className="w-4 h-4" /> Phone
                </p>
                <p className="text-lg font-semibold text-gray-900">{doctor.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Activity className="w-4 h-4" /> Activity
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {appointments.length} appointments, {ehrRecords.length} EHRs
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Appointments</p>
              <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
            </div>
            <Calendar className="w-8 h-8 text-primary-500" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Upcoming</p>
              <p className="text-2xl font-bold text-blue-600">{upcomingAppointments.length}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{pastAppointments.length}</p>
            </div>
            <Calendar className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">EHR Records</p>
              <p className="text-2xl font-bold text-purple-600">{ehrRecords.length}</p>
            </div>
            <FileText className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Recent Appointments */}
      <Card className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary-600" />
          Recent Appointments ({upcomingAppointments.slice(0, 5).length})
        </h3>
        <Table
          data={upcomingAppointments.slice(0, 5) as unknown as Record<string, unknown>[]}
          columns={appointmentColumns as any}
          isLoading={false}
          emptyMessage="No upcoming appointments"
        />
      </Card>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Doctor Profile">
        <form onSubmit={handleEdit}>
          <Input
            label="Name"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <Input
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
          <div className="mt-6 flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Update Doctor</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
