'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import Input from '@/components/Input';
import Alert from '@/components/Alert';
import Badge from '@/components/Badge';
import ConfirmDialog from '@/components/ConfirmDialog';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getEhrId } from '@/utils/ehr.utils';
import Tabs from '@/components/Tabs';
import { patientService, appointmentService, ehrService, isDoctor } from '@/services';
import { Patient, Appointment, EHR, ApiError } from '@/types/api.types';
import { dateAPIToInput, dateInputToAPI, formatDateForDisplay, formatTimeForDisplay } from '@/utils/date.utils';
import { User, Calendar, FileText, Phone, Eye, Edit, Search, Plus, ChevronRight, ChevronLeft, ChevronDown, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function PatientsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientAppointments, setPatientAppointments] = useState<Appointment[]>([]);
  const [patientEHR, setPatientEHR] = useState<EHR[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [genderFilter, setGenderFilter] = useState<'All' | 'Male' | 'Female'>('All');
  const [sortBy, setSortBy] = useState<'name' | 'age'>('name');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [formData, setFormData] = useState({
    first: '',
    middle: '',
    last: '',
    gender: 'Male',
    dob: '',
    phone: '',
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      const data = await patientService.getAllPatients() as Patient[];
      setPatients(data);
    } catch (error) {
      console.error('Error fetching patients:', error);
      showAlert('error', 'Failed to load patients');
    } finally {
      setIsLoading(false);
    }
  };

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleOpenModal = (patient?: Patient) => {
    if (patient) {
      setEditingPatient(patient);
      setFormData({
        first: patient.first,
        middle: patient.middle || '',
        last: patient.last,
        gender: patient.gender,
        dob: dateAPIToInput(patient.dob),
        phone: patient.phone || '',
      });
    } else {
      setEditingPatient(null);
      setFormData({
        first: '',
        middle: '',
        last: '',
        gender: 'Male',
        dob: '',
        phone: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPatient(null);
  };

  const handleViewPatient = async (patient: Patient) => {
    setSelectedPatient(patient);
    setIsDetailModalOpen(true);
    setDetailsLoading(true);
    
    try {
      // Fetch appointments for this patient
      try {
        const patientAppts = await appointmentService.getAppointmentsByPatient(patient.patient_ID) as Appointment[];
        setPatientAppointments(patientAppts);
      } catch (aptError) {
        console.error('Error fetching appointments:', aptError);
        setPatientAppointments([]); // Set empty array on error
      }

      // Fetch EHR for this patient
      try {
        const ehrData = await ehrService.getByPatient(patient.patient_ID) as EHR[];
        setPatientEHR(ehrData);
      } catch (ehrError) {
        console.error('Error fetching EHR:', ehrError);
        setPatientEHR([]); // Set empty array on error
      }
    } catch (error) {
      console.error('Error fetching patient details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedPatient(null);
    setPatientAppointments([]);
    setPatientEHR([]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation matching backend rules
    if (!formData.first || formData.first.trim().length === 0) {
      showAlert('error', 'First name is required');
      return;
    }
    if (formData.first.trim().length > 100) {
      showAlert('error', 'First name must not exceed 100 characters');
      return;
    }
    if (!formData.last || formData.last.trim().length === 0) {
      showAlert('error', 'Last name is required');
      return;
    }
    if (formData.last.trim().length > 100) {
      showAlert('error', 'Last name must not exceed 100 characters');
      return;
    }
    if (formData.middle && formData.middle.trim().length > 100) {
      showAlert('error', 'Middle name must not exceed 100 characters');
      return;
    }
    if (!formData.gender) {
      showAlert('error', 'Gender is required');
      return;
    }
    if (formData.gender.length > 50) {
      showAlert('error', 'Gender must not exceed 50 characters');
      return;
    }
    if (formData.phone && formData.phone.trim().length > 20) {
      showAlert('error', 'Phone number must not exceed 20 characters');
      return;
    }
    if (!formData.dob) {
      showAlert('error', 'Date of birth is required');
      return;
    }
    
    // Check if DOB is in the future
    const dobDate = new Date(formData.dob);
    if (dobDate > new Date()) {
      showAlert('error', 'Date of birth cannot be in the future');
      return;
    }
    
    // Check minimum age
    const age = calculateAge(formData.dob);
    if (age < 0) {
      showAlert('error', 'Invalid date of birth');
      return;
    }

    try {
      // Prepare data matching backend PatientCreateRequest/PatientUpdateRequest
      const patientData = {
        first: formData.first.trim(),
        middle: formData.middle?.trim() || null,
        last: formData.last.trim(),
        gender: formData.gender,
        dob: formData.dob, // Already in YYYY-MM-DD format from date input
        phone: formData.phone?.trim() || null,
      };

      if (editingPatient) {
        const response = await patientService.updatePatient(editingPatient.patient_ID, patientData);
        showAlert('success', response.message || 'Patient updated successfully');
      } else {
        await patientService.createPatient(patientData);
        showAlert('success', 'Patient created successfully');
      }
      handleCloseModal();
      fetchPatients();
    } catch (error) {
      const apiError = error as ApiError;
      // Handle validation errors from backend
      if (apiError.details && Array.isArray(apiError.details)) {
        showAlert('error', apiError.details.join(', '));
      } else {
        showAlert('error', apiError.error || 'Operation failed');
      }
    }
  };

  // Calculate age from date of birth
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

  // Filter and sort patients
  const filteredPatients = useMemo(() => {
    let filtered = patients;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(patient => {
        const fullName = `${patient.first} ${patient.middle || ''} ${patient.last}`.toLowerCase();
        const phone = (patient.phone || '').toLowerCase();
        const id = patient.patient_ID.toString();
        const query = searchQuery.toLowerCase();
        return fullName.includes(query) || phone.includes(query) || id.includes(query);
      });
    }

    // Apply gender filter
    if (genderFilter !== 'All') {
      filtered = filtered.filter(patient => patient.gender === genderFilter);
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'name') {
        const nameA = `${a.first} ${a.last}`.toLowerCase();
        const nameB = `${b.first} ${b.last}`.toLowerCase();
        return nameA.localeCompare(nameB);
      } else {
        return calculateAge(a.dob) - calculateAge(b.dob);
      }
    });

    return filtered;
  }, [patients, searchQuery, genderFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const columns = [
    {
      key: 'patient_ID',
      header: 'ID',
    },
    {
      key: 'name',
      header: 'Name',
      render: (patient: Patient) => (
        <div>
          <p className="font-semibold text-gray-900">
            {patient.first} {patient.middle ? patient.middle + ' ' : ''}{patient.last}
          </p>
        </div>
      ),
    },
    {
      key: 'gender',
      header: 'Gender',
    },
    {
      key: 'age',
      header: 'Age',
      render: (patient: Patient) => calculateAge(patient.dob),
    },
    {
      key: 'phone',
      header: 'Phone',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (patient: Patient) => (
        <div className="flex flex-wrap gap-1 sm:gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleViewPatient(patient)}
            icon={<Eye className="w-3 h-3" />}
          >
            <span className="hidden sm:inline">View</span>
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleOpenModal(patient)}
            icon={<Edit className="w-3 h-3" />}
          >
            <span className="hidden sm:inline">Edit</span>
          </Button>
        </div>
      ),
    },
  ];

  // Show loading spinner if not authorized
  if (isLoading && patients.length === 0) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="max-w-full overflow-hidden">
      {/* Breadcrumb */}
      <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row gap-2 sm:gap-0 items-start sm:items-center justify-between">
        <div className="flex items-center text-xs sm:text-sm text-gray-600">
          <span className="hover:text-primary-600 cursor-pointer">Dashboard</span>
          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 mx-1 sm:mx-2" />
          <span className="text-gray-900 font-medium">Patients</span>
        </div>
        <Button 
          size="sm" 
          onClick={() => handleOpenModal()}
          icon={<Plus className="w-3 h-3 sm:w-4 sm:h-4" />}
          className="w-full sm:w-auto"
        >
          Add
        </Button>
      </div>

      {/* Page Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
          <User className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
          PATIENTS
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Manage patient records and information</p>
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

      {/* Search and Actions */}
      <Card className="mb-4">
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Search and Add Button */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="text"
                placeholder="🔍 Search by name, phone, or ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Add Patient Button - Hidden on mobile (already in header) */}
            <Button onClick={() => handleOpenModal()} icon={<Plus className="w-4 h-4" />} className="hidden sm:flex">
              Add Patient
            </Button>
          </div>

          {/* Filters and Sort */}
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Filters:</span>
              <div className="flex gap-2">
                {(['All', 'Male', 'Female'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => {
                      setGenderFilter(filter);
                      setCurrentPage(1);
                    }}
                    className={`flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                      genderFilter === filter
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 flex-shrink-0">Sort:</span>
              <div className="relative flex-1 sm:flex-initial">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'age')}
                  className="appearance-none w-full pl-3 pr-8 py-1.5 text-xs sm:text-sm font-medium border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white cursor-pointer"
                >
                  <option value="name">Name</option>
                  <option value="age">Age</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Patients Table */}
      <Card>
        <Table
          data={paginatedPatients as unknown as Record<string, unknown>[]}
          columns={columns as any}
          isLoading={isLoading}
          emptyMessage="No patients found. Add your first patient to get started."
        />

        {/* Pagination */}
        {filteredPatients.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
              Showing {(currentPage - 1) * itemsPerPage + 1}-
              {Math.min(currentPage * itemsPerPage, filteredPatients.length)} of{' '}
              {filteredPatients.length} patients
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-1.5 sm:p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>

              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 sm:p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Add/Edit Patient Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingPatient ? 'Edit Patient' : 'Add New Patient'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* First Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="first"
              value={formData.first}
              onChange={handleChange}
              placeholder="Ahmed"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          {/* Middle Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Middle Name
            </label>
            <input
              type="text"
              name="middle"
              value={formData.middle}
              onChange={handleChange}
              placeholder="Hassan"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="last"
              value={formData.last}
              onChange={handleChange}
              placeholder="Ali"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          {/* Gender & Date of Birth - 2 Column Layout */}
          <div className="grid grid-cols-2 gap-3">
            {/* Gender */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Gender <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full appearance-none px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white cursor-pointer"
                  required
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
              {/* Auto-calculated Age */}
              {formData.dob && (
                <p className="mt-1 text-xs text-gray-600">
                  Age: {calculateAge(formData.dob)} years
                </p>
              )}
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="555-0101 or +1-555-0101"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">Optional - max 20 characters</p>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={handleCloseModal} size="sm">
              Cancel
            </Button>
            <Button type="submit" size="sm">
              {editingPatient ? 'Update Patient' : 'Create Patient'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Patient Details Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        title="Patient Overview"
        size="xl"
      >
        {selectedPatient && (
          <div className="space-y-3">
            {/* Patient Information */}
            <div className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-blue-50 to-gray-50">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold text-gray-900">Patient Information</h2>
                <Button
                  size="sm"
                  variant="outline"
                  icon={<Edit className="w-4 h-4" />}
                  onClick={() => {
                    handleCloseDetailModal();
                    handleOpenModal(selectedPatient);
                  }}
                >
                  Edit
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-semibold text-gray-900">Name:</span>{' '}
                  <span className="text-gray-700">
                    {selectedPatient.first} {selectedPatient.middle ? selectedPatient.middle + ' ' : ''}{selectedPatient.last}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-gray-900">Age:</span>{' '}
                  <span className="text-gray-700">{calculateAge(selectedPatient.dob)}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-900">Gender:</span>{' '}
                  <span className="text-gray-700">{selectedPatient.gender}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-900">Last Visit:</span>{' '}
                  <span className="text-gray-700">
                    {patientAppointments.length > 0 ? formatDateForDisplay(patientAppointments[0].date) : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3 h-3 text-gray-500" />
                  <span className="font-semibold text-gray-900">Phone:</span>{' '}
                  <span className="text-gray-700">{selectedPatient.phone || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* EHR Summary */}
            <div className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-green-50 to-gray-50">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold text-gray-900">EHR Summary</h2>
                <div className="flex gap-1">
                  {patientEHR.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<FileText className="w-3 h-3" />}
                      onClick={() => {
                        handleCloseDetailModal();
                        router.push(`/dashboard/ehr/${getEhrId(patientEHR[0])}`);
                      }}
                    >
                      View
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="primary"
                    icon={<FileText className="w-3 h-3" />}
                    onClick={() => {
                      handleCloseDetailModal();
                      const latestEHR = patientEHR.length > 0 ? patientEHR[0] : null;
                      if (latestEHR) {
                        router.push(`/dashboard/ehr/edit/${getEhrId(latestEHR)}`);
                      } else {
                        router.push(`/dashboard/ehr/new?patientId=${selectedPatient.patient_ID}`);
                      }
                    }}
                  >
                    {patientEHR.length > 0 ? 'Edit' : 'Create'}
                  </Button>
                </div>
              </div>
              
              {patientEHR.length > 0 ? (
                <div className="space-y-3">
                {/* Dental Chart Overview */}
                <div>
                    <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1 mb-1">
                      🦷 Dental Chart:
                    </h3>
                    {(patientEHR[0].teeth || patientEHR[0].Teeth || patientEHR[0].toothRecords) && ((patientEHR[0].teeth || patientEHR[0].Teeth || patientEHR[0].toothRecords) || []).length > 0 ? (
                      <ul className="space-y-1 text-xs text-gray-700 ml-2">
                        {((patientEHR[0].teeth || patientEHR[0].Teeth || patientEHR[0].toothRecords) || []).slice(0, 3).map((tooth, idx) => (
                          <li key={tooth.toothRecord_ID || tooth.ToothRecord_ID || idx} className="flex items-start gap-1">
                            <span className="text-gray-400">•</span>
                            <span>
                              <span className="font-medium">Tooth #{tooth.toothNumber || tooth.ToothNumber}:</span>{' '}
                              {tooth.condition || tooth.Condition}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-500 ml-2">No dental records</p>
                    )}
                  </div>

                  {/* Medications Overview */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1 mb-1">
                      💊 Medications:
                    </h3>
                    {patientEHR[0].medications && patientEHR[0].medications.length > 0 ? (
                      <ul className="space-y-1 text-xs text-gray-700 ml-2">
                        {patientEHR[0].medications.slice(0, 3).map((med, idx) => (
                          <li key={med.medication_ID || idx} className="flex items-start gap-1">
                            <span className="text-gray-400">•</span>
                            <span>
                              {med.name} ({med.dosage})
                              {med.frequency && ` - ${med.frequency}`}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-500 ml-2">No medications</p>
                    )}
                  </div>

                  {/* Treatments & Procedures Overview */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1 mb-1">
                      📝 Procedures:
                    </h3>
                    {patientEHR[0].procedures && patientEHR[0].procedures.length > 0 ? (
                      <ul className="space-y-1 text-xs text-gray-700 ml-2">
                        {patientEHR[0].procedures.slice(0, 3).map((proc, idx) => (
                          <li key={proc.procedure_ID || idx} className="flex items-start gap-1">
                            <span className="text-gray-400">•</span>
                            <span>
                              {proc.description} – {proc.performedAt ? formatDateForDisplay(proc.performedAt) : 'N/A'}
                              {proc.toothNumber && ` (Tooth #${proc.toothNumber})`}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-500 ml-2">No procedures</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <FileText className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">No EHR records available</p>
                </div>
              )}
            </div>

            {/* Appointment-linked Changes */}
            <div className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-purple-50 to-gray-50">
              <h2 className="text-sm font-bold text-gray-900 mb-2">Appointment-linked Changes</h2>
              {detailsLoading ? (
                <div className="flex justify-center py-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                </div>
              ) : patientAppointments.length > 0 ? (
                <ul className="space-y-1">
                  {patientAppointments.slice(0, 5).map((apt) => (
                    <li 
                      key={apt.appointment_ID}
                      className="flex items-start gap-2 p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Calendar className="w-3 h-3 text-primary-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 text-xs">
                        <span className="font-semibold text-gray-900">#{apt.ref_Num}</span>
                        <span className="text-gray-600"> – {formatDateForDisplay(apt.date)}: </span>
                        <span className="text-gray-700">{apt.type}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-500 text-center py-3">No appointments found</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 mt-1">
              <Button size="sm" variant="secondary" onClick={handleCloseDetailModal}>
                Close
              </Button>
              <Button 
                size="sm"
                variant="primary"
                onClick={() => router.push(`/dashboard/patients/${selectedPatient.patient_ID}`)}
              >
                View Profile
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
