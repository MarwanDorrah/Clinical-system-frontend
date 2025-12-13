'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import DoctorDetailsModal from '@/components/DoctorDetailsModal';
import Input from '@/components/Input';
import PasswordInput from '@/components/PasswordInput';
import Alert from '@/components/Alert';
import { doctorService, isDoctor } from '@/services';
import { Doctor, ApiError } from '@/types/api.types';
import { validateEmail, validatePhone, validatePassword, validateMinLength } from '@/utils/validation.utils';
import { Stethoscope, Plus, Eye, Edit, ChevronRight } from 'lucide-react';

export default function DoctorsPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDoctorDetailsModalOpen, setIsDoctorDetailsModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    if (!isDoctor()) {
      router.push('/dashboard');
      return;
    }
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setIsLoading(true);
      const data = await doctorService.getAllDoctors() as Doctor[];
      setDoctors(data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      showAlert('error', 'Failed to load doctors');
    } finally {
      setIsLoading(false);
    }
  };

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleOpenModal = (doctor?: Doctor) => {
    if (doctor) {
      setEditingDoctor(doctor);
      setFormData({
        name: doctor.name,
        phone: doctor.phone,
        email: doctor.email,
        password: '',
      });
    } else {
      setEditingDoctor(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        password: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDoctor(null);
  };

  const handleViewDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setIsDoctorDetailsModalOpen(true);
  };

  const handleCloseDoctorDetailsModal = () => {
    setIsDoctorDetailsModalOpen(false);
    setSelectedDoctor(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate name
    const nameError = validateMinLength(formData.name, 2, 'Name');
    if (nameError) {
      showAlert('error', nameError);
      return;
    }

    // Validate email
    if (!validateEmail(formData.email)) {
      showAlert('error', 'Please enter a valid email address');
      return;
    }

    // Validate phone
    if (!validatePhone(formData.phone)) {
      showAlert('error', 'Phone must be in format: XXX-XXX-XXXX');
      return;
    }

    // Validate password for new doctors
    if (!editingDoctor) {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.valid) {
        showAlert('error', `Password must have: ${passwordValidation.errors.join(', ')}`);
        return;
      }
    }

    try {
      if (editingDoctor) {
        const updateData = {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
        };
        await doctorService.updateDoctor(editingDoctor.id, updateData);
        showAlert('success', 'Doctor updated successfully');
      } else {
        await doctorService.createDoctor(formData);
        showAlert('success', 'Doctor created successfully');
      }
      handleCloseModal();
      fetchDoctors();
    } catch (error) {
      const apiError = error as ApiError;
      showAlert('error', apiError.error || 'Operation failed');
    }
  };

  const columns = [
    {
      key: 'id',
      header: 'ID',
    },
    {
      key: 'name',
      header: 'Name',
      render: (doctor: Doctor) => (
        <p className="font-semibold text-gray-900">
          Dr. {doctor.name}
        </p>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
    },
    {
      key: 'email',
      header: 'Email',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (doctor: Doctor) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleViewDoctor(doctor)}
          >
            View
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleOpenModal(doctor)}
          >
            Edit
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center text-sm text-gray-600">
          <span className="hover:text-primary-600 cursor-pointer">Dashboard</span>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-900 font-medium">Doctors</span>
        </div>
        <Button 
          size="sm" 
          onClick={() => handleOpenModal()}
          icon={<Plus className="w-4 h-4" />}
        >
          Add
        </Button>
      </div>

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Stethoscope className="w-8 h-8 text-primary-600" />
          DOCTORS
        </h1>
        <p className="text-gray-600 mt-2">Manage doctor information and profiles</p>
      </div>

      {/* Alert */}
      {alert && (
        <div className="mb-4">
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        </div>
      )}

      {/* Doctors Table */}
      <Card>
        <div className="mb-4 flex justify-end">
          <Button onClick={() => handleOpenModal()} icon={<Plus className="w-4 h-4" />}>
            Add Doctor
          </Button>
        </div>

        <Table
          data={doctors as unknown as Record<string, unknown>[]}
          columns={columns as any}
          isLoading={isLoading}
          emptyMessage="No doctors found. Add your first doctor to get started."
        />
      </Card>

      {/* Add/Edit Doctor Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Dr. John Smith"
            required
          />
          <Input
            label="Phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="e.g., 123-456-7890"
            required
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="e.g., doctor@clinic.com"
            required
          />
          {!editingDoctor && (
            <PasswordInput
              label="Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          )}

          <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit">
              {editingDoctor ? 'Update Doctor' : 'Create Doctor'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Doctor Details Modal */}
      <DoctorDetailsModal
        isOpen={isDoctorDetailsModalOpen}
        doctor={selectedDoctor}
        onClose={handleCloseDoctorDetailsModal}
        onEdit={(doctor) => {
          handleCloseDoctorDetailsModal();
          handleOpenModal(doctor);
        }}
      />
    </div>
  );
}
