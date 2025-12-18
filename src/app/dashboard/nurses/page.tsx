'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import NurseDetailsModal from '@/components/NurseDetailsModal';
import Input from '@/components/Input';
import PasswordInput from '@/components/PasswordInput';
import Alert from '@/components/Alert';
import ConfirmDialog from '@/components/ConfirmDialog';
import { nurseService, appointmentService, ehrService, isDoctor } from '@/services';
import { Nurse, ApiError } from '@/types/api.types';
import { validateEmail, validatePhone, validatePassword, validateMinLength } from '@/utils/validation.utils';
import { Heart, Plus, Eye, Edit, ChevronRight } from 'lucide-react';

export default function NursesPage() {
  const router = useRouter();
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNurseDetailsModalOpen, setIsNurseDetailsModalOpen] = useState(false);
  const [selectedNurse, setSelectedNurse] = useState<Nurse | null>(null);
  const [editingNurse, setEditingNurse] = useState<Nurse | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; nurse: Nurse | null }>({ isOpen: false, nurse: null });
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
    fetchNurses();
  }, []);

  const fetchNurses = async () => {
    try {
      setIsLoading(true);
      const data = await nurseService.getAllNurses() as Nurse[];
      setNurses(data);
    } catch (error) {
      console.error('Error fetching nurses:', error);
      showAlert('error', 'Failed to load nurses');
    } finally {
      setIsLoading(false);
    }
  };

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    if (type === 'success') {
      setTimeout(() => setAlert(null), 8000);
    }
  };

  const handleOpenModal = (nurse?: Nurse) => {
    if (nurse) {
      setEditingNurse(nurse);
      setFormData({
        name: nurse.name,
        phone: nurse.phone,
        email: nurse.email,
        password: '',
      });
    } else {
      setEditingNurse(null);
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
    setEditingNurse(null);
  };

  const handleViewNurse = (nurse: Nurse) => {
    setSelectedNurse(nurse);
    setIsNurseDetailsModalOpen(true);
  };

  const handleCloseNurseDetailsModal = () => {
    setIsNurseDetailsModalOpen(false);
    setSelectedNurse(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameError = validateMinLength(formData.name, 2, 'Name');
    if (nameError) {
      showAlert('error', nameError);
      return;
    }

    if (!validateEmail(formData.email)) {
      showAlert('error', 'Please enter a valid email address');
      return;
    }

    if (!validatePhone(formData.phone)) {
      showAlert('error', 'Phone must be in format: XXX-XXX-XXXX');
      return;
    }

    if (!editingNurse) {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.valid) {
        showAlert('error', `Password must have: ${passwordValidation.errors.join(', ')}`);
        return;
      }
    }

    try {
      if (editingNurse) {
        const updateData = {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
        };
        await nurseService.updateNurse(editingNurse.nursE_ID, updateData);
        showAlert('success', 'Nurse updated successfully');
      } else {
        await nurseService.createNurse(formData);
        showAlert('success', 'Nurse created successfully');
      }
      handleCloseModal();
      fetchNurses();
    } catch (error) {
      const apiError = error as ApiError;
      showAlert('error', apiError.error || 'Operation failed');
    }
  };

  const columns = [
    {
      key: 'nursE_ID',
      header: 'ID',
    },
    {
      key: 'name',
      header: 'Name',
      render: (nurse: Nurse) => (
        <p className="font-semibold text-gray-900">
          {nurse.name}
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
      render: (nurse: Nurse) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleViewNurse(nurse)}
          >
            View
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleOpenModal(nurse)}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => setDeleteConfirm({ isOpen: true, nurse })}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center text-sm text-gray-600">
          <span className="hover:text-primary-600 cursor-pointer">Dashboard</span>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-900 font-medium">Nurses</span>
        </div>
        <Button 
          size="sm" 
          onClick={() => handleOpenModal()}
          icon={<Plus className="w-4 h-4" />}
        >
          Add
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Heart className="w-8 h-8 text-primary-600" />
          NURSES
        </h1>
        <p className="text-gray-600 mt-2">Manage nurse information and profiles</p>
      </div>

      {alert && (
        <div className="mb-4">
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
            autoClose={alert.type !== 'error'}
            duration={alert.type === 'success' ? 8000 : 20000}
          />
        </div>
      )}

      <Card>

        <Table
          data={nurses as unknown as Record<string, unknown>[]}
          columns={columns as any}
          isLoading={isLoading}
          emptyMessage="No nurses found. Add your first nurse to get started."
        />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingNurse ? 'Edit Nurse' : 'Add New Nurse'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Fatima Ali"
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
            placeholder="e.g., fatima.ali@clinic.com"
            required
          />
          {!editingNurse && (
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
              {editingNurse ? 'Update Nurse' : 'Create Nurse'}
            </Button>
          </div>
        </form>
      </Modal>

      <NurseDetailsModal
        isOpen={isNurseDetailsModalOpen}
        nurse={selectedNurse}
        onClose={handleCloseNurseDetailsModal}
        onEdit={(nurse) => {
          handleCloseNurseDetailsModal();
          handleOpenModal(nurse);
        }}
      />
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onCancel={() => setDeleteConfirm({ isOpen: false, nurse: null })}
        onConfirm={async () => {
          if (!deleteConfirm.nurse) return;
          try {
            
            const allAppointments = await appointmentService.getAllAppointments();
            const nurseAppointments = allAppointments.filter(
              apt => apt.nurse_ID === deleteConfirm.nurse!.nursE_ID
            );
            
            if (nurseAppointments.length > 0) {
              
              try {
                const allEhrs = await ehrService.getAllEHRs();
                const appointmentIds = new Set(nurseAppointments.map(a => a.appointment_ID).filter(Boolean));
                const linkedEhrs = allEhrs.filter(ehr => appointmentIds.has(ehr.appointmentId || ehr.AppointmentId));

                if (linkedEhrs.length > 0) {
                  showAlert('error', `Cannot delete nurse. ${linkedEhrs.length} EHR record(s) are linked to appointments assigned to this nurse.`);
                  setDeleteConfirm({ isOpen: false, nurse: null });
                  return;
                }
              } catch (e) {
                console.error('Failed to verify EHR links for nurse deletion', e);
                showAlert('error', 'Cannot delete nurse right now because EHR verification failed.');
                setDeleteConfirm({ isOpen: false, nurse: null });
                return;
              }

              showAlert('error', `Cannot delete nurse. There are ${nurseAppointments.length} appointment(s) assigned to this nurse. Please reassign or delete those appointments first.`);
              setDeleteConfirm({ isOpen: false, nurse: null });
              return;
            }
            
            await nurseService.deleteNurse(deleteConfirm.nurse.nursE_ID);
            showAlert('success', 'Nurse deleted successfully');
            setDeleteConfirm({ isOpen: false, nurse: null });
            fetchNurses();
          } catch (error) {
            const apiError = error as ApiError;
            showAlert('error', apiError.error || 'Failed to delete nurse');
          }
        }}
        title="Delete Nurse"
        message={`Are you sure you want to delete ${deleteConfirm.nurse?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
