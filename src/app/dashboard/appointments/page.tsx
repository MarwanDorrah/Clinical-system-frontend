'use client';

import { useEffect, useState, useMemo } from 'react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import DoctorDetailsModal from '@/components/DoctorDetailsModal';
import NurseDetailsModal from '@/components/NurseDetailsModal';
import Input from '@/components/Input';
import Alert from '@/components/Alert';
import Badge from '@/components/Badge';
import Tabs from '@/components/Tabs';
import CalendarView from '@/components/CalendarView';
import DayAppointmentsSidebar from '@/components/DayAppointmentsSidebar';
import PatientAutocomplete from '@/components/PatientAutocomplete';
import { appointmentService, patientService, doctorService, nurseService, ehrService } from '@/services';
import { Appointment, Patient, Doctor, Nurse, EHR, ApiError } from '@/types/api.types';
import { dateAPIToInput, timeAPIToInput, timeInputToAPI, formatDateForDisplay, formatTimeForDisplay } from '@/utils/date.utils';
import { Calendar, User, FileText, Clock, Phone, Mail, List, CalendarDays, AlertCircle, ChevronDown } from 'lucide-react';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDoctorDetailsModalOpen, setIsDoctorDetailsModalOpen] = useState(false);
  const [isNurseDetailsModalOpen, setIsNurseDetailsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedNurse, setSelectedNurse] = useState<Nurse | null>(null);
  const [patientEHR, setPatientEHR] = useState<EHR[]>([]);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [modalError, setModalError] = useState<string>('');
  const [filterTab, setFilterTab] = useState<'all' | 'upcoming' | 'past'>('all');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    type: '',
    patient_ID: '',
    doctor_ID: '',
    nurse_ID: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, filterTab]);

  const filterAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let filtered = [...appointments];

    if (filterTab === 'upcoming') {
      filtered = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate >= today;
      });
    } else if (filterTab === 'past') {
      filtered = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate < today;
      });
    }

    // Sort by date and time
    filtered.sort((a, b) => {
      const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateCompare !== 0) return filterTab === 'past' ? -dateCompare : dateCompare;
      return a.time.localeCompare(b.time);
    });

    setFilteredAppointments(filtered);
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch data with individual error handling to prevent one failure from blocking all
      const results = await Promise.allSettled([
        appointmentService.getAllAppointments() as Promise<Appointment[]>,
        patientService.getAllPatients() as Promise<Patient[]>,
        doctorService.getAllDoctors() as Promise<Doctor[]>,
        nurseService.getAllNurses() as Promise<Nurse[]>,
      ]);

      const [appointmentsResult, patientsResult, doctorsResult, nursesResult] = results;

      // Handle each result separately
      if (appointmentsResult.status === 'fulfilled') {
        setAppointments(appointmentsResult.value);
      } else {
        console.error('Failed to fetch appointments:', appointmentsResult.reason);
      }

      if (patientsResult.status === 'fulfilled') {
        setPatients(patientsResult.value);
      } else {
        console.error('Failed to fetch patients:', patientsResult.reason);
      }

      if (doctorsResult.status === 'fulfilled') {
        setDoctors(doctorsResult.value);
      } else {
        console.error('Failed to fetch doctors:', doctorsResult.reason);
      }

      if (nursesResult.status === 'fulfilled') {
        setNurses(nursesResult.value);
      } else {
        console.error('Failed to fetch nurses:', nursesResult.reason);
      }

      // Check if any critical data failed to load
      if (
        appointmentsResult.status === 'rejected' ||
        patientsResult.status === 'rejected' ||
        doctorsResult.status === 'rejected'
      ) {
        showAlert('error', 'Failed to load some data. Please refresh the page.');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showAlert('error', 'Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  };

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleOpenModal = (appointment?: Appointment) => {
    setModalError('');
    if (appointment) {
      setEditingAppointment(appointment);
      setFormData({
        date: dateAPIToInput(appointment.date),
        time: timeAPIToInput(appointment.time),
        type: appointment.type,
        patient_ID: appointment.patient_ID.toString(),
        doctor_ID: appointment.doctor_ID.toString(),
        nurse_ID: appointment.nurse_ID.toString(),
      });
      // Find and set the selected patient
      const patient = patients.find(p => p.patient_ID === appointment.patient_ID);
      setSelectedPatient(patient || null);
    } else {
      setEditingAppointment(null);
      setSelectedPatient(null);
      setFormData({
        date: '',
        time: '',
        type: '',
        patient_ID: '',
        doctor_ID: '',
        nurse_ID: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleViewDetails = async (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailModalOpen(true);
    
    // Fetch patient EHR
    if (appointment.patient_ID) {
      try {
        const ehrData = await ehrService.getByPatient(appointment.patient_ID) as EHR[];
        setPatientEHR(ehrData);
      } catch (error) {
        console.error('Error fetching EHR:', error);
        setPatientEHR([]);
      }
    }
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedAppointment(null);
    setPatientEHR([]);
  };

  const handleViewDoctor = (doctorId: number) => {
    const doctor = doctors.find(d => d.id === doctorId);
    if (doctor) {
      setSelectedDoctor(doctor);
      setIsDoctorDetailsModalOpen(true);
    }
  };

  const handleCloseDoctorDetailsModal = () => {
    setIsDoctorDetailsModalOpen(false);
    setSelectedDoctor(null);
  };

  const handleViewNurse = (nurseId: number) => {
    const nurse = nurses.find(n => n.nursE_ID === nurseId);
    if (nurse) {
      setSelectedNurse(nurse);
      setIsNurseDetailsModalOpen(true);
    }
  };

  const handleCloseNurseDetailsModal = () => {
    setIsNurseDetailsModalOpen(false);
    setSelectedNurse(null);
  };

  const getAppointmentsForSelectedDate = () => {
    // Extract just the date part (YYYY-MM-DD) from the appointment date
    // Backend returns ISO format like "2024-12-22T00:00:00"
    const selectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    
    return appointments.filter((apt) => {
      // Extract date part from ISO datetime string
      const appointmentDateStr = apt.date.split('T')[0];
      return appointmentDateStr === selectedDateStr;
    });
  };

  // Generate auto reference number
  const generateRefNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    return `APT-${year}-${random}`;
  };

  // Calculate age from DOB
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

  // Get patient's last visit
  const getLastVisit = (patientId: number) => {
    const patientApts = appointments.filter(apt => 
      apt.patient_ID === patientId && 
      new Date(apt.date) < new Date()
    );
    if (patientApts.length === 0) return null;
    const sorted = patientApts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return sorted[0];
  };

  // Check for scheduling conflicts
  const checkConflict = useMemo(() => {
    if (!formData.date || !formData.time || !formData.doctor_ID) return null;

    const conflictingApt = appointments.find(apt => 
      apt.date === formData.date &&
      apt.doctor_ID === parseInt(formData.doctor_ID) &&
      Math.abs(new Date(`1970-01-01 ${apt.time}`).getTime() - new Date(`1970-01-01 ${formData.time}`).getTime()) < 30 * 60 * 1000 &&
      (!editingAppointment || apt.appointment_ID !== editingAppointment.appointment_ID)
    );

    if (conflictingApt) {
      const doctor = doctors.find(d => d.id === parseInt(formData.doctor_ID));
      return `${doctor?.name || 'Doctor'} has appointment at ${formatTimeForDisplay(conflictingApt.time)}`;
    }
    return null;
  }, [formData.date, formData.time, formData.doctor_ID, appointments, doctors, editingAppointment]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAppointment(null);
    setModalError('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    // Validate all required fields
    if (!formData.patient_ID || formData.patient_ID === '0' || formData.patient_ID === '') {
      setModalError('Please select a patient');
      return;
    }
    if (!formData.date) {
      setModalError('Please select a date');
      return;
    }
    if (!formData.time) {
      setModalError('Please select a time');
      return;
    }
    if (!formData.type) {
      setModalError('Please select appointment type');
      return;
    }
    if (!formData.doctor_ID || formData.doctor_ID === '0' || formData.doctor_ID === '') {
      setModalError('Please select a doctor');
      return;
    }
    if (!formData.nurse_ID || formData.nurse_ID === '0' || formData.nurse_ID === '') {
      setModalError('Please select a nurse');
      return;
    }

    try {
      if (editingAppointment) {
        const patientId = parseInt(formData.patient_ID);
        const doctorId = parseInt(formData.doctor_ID);
        const nurseId = parseInt(formData.nurse_ID);

        // Validate parsed integers
        if (isNaN(patientId)) {
          setModalError('Invalid patient ID. Please select a patient again.');
          console.error('Patient ID parse error:', formData.patient_ID, '→', patientId);
          return;
        }
        if (isNaN(doctorId)) {
          setModalError('Invalid doctor ID. Please select a doctor again.');
          console.error('Doctor ID parse error:', formData.doctor_ID, '→', doctorId);
          return;
        }
        if (isNaN(nurseId)) {
          setModalError('Invalid nurse ID. Please select a nurse again.');
          console.error('Nurse ID parse error:', formData.nurse_ID, '→', nurseId);
          return;
        }

        const updateData = {
          appointment_ID: editingAppointment.appointment_ID,
          date: formData.date,
          time: timeInputToAPI(formData.time),
          type: formData.type,
          ref_Num: editingAppointment.ref_Num,
          patient_ID: patientId,
          doctor_ID: doctorId,
          nurse_ID: nurseId,
        };
        console.log('Updating appointment with data:', updateData);
        console.log('Form data before parse:', formData);
        await appointmentService.updateAppointment(editingAppointment.appointment_ID, updateData);
        showAlert('success', 'Appointment updated successfully');
        handleCloseModal();
        fetchData();
      } else {
        const patientId = parseInt(formData.patient_ID);
        const doctorId = parseInt(formData.doctor_ID);
        const nurseId = parseInt(formData.nurse_ID);

        // Validate parsed integers with specific error messages
        if (isNaN(patientId)) {
          setModalError('Invalid patient ID. Please select a patient again.');
          console.error('Patient ID parse error:', formData.patient_ID, '→', patientId);
          return;
        }
        if (isNaN(doctorId)) {
          setModalError('Invalid doctor ID. Please select a doctor again.');
          console.error('Doctor ID parse error:', formData.doctor_ID, '→', doctorId);
          return;
        }
        if (isNaN(nurseId)) {
          setModalError('Invalid nurse ID. Please select a nurse again.');
          console.error('Nurse ID parse error:', formData.nurse_ID, '→', nurseId);
          return;
        }

        // Don't send ref_Num - backend will auto-generate it
        const createData = {
          date: formData.date,
          time: timeInputToAPI(formData.time),
          type: formData.type,
          patient_ID: patientId,
          doctor_ID: doctorId,
          nurse_ID: nurseId,
        };
        console.log('Creating appointment with data:', createData);
        console.log('Form data before parse:', formData);
        await appointmentService.createAppointment(createData);
        showAlert('success', 'Appointment created successfully');
        handleCloseModal();
        fetchData();
      }
    } catch (error: any) {
      console.error('Appointment error:', error);
      const errorMessage = error?.error || error?.message || 'Operation failed. Please check all fields and try again.';
      setModalError(errorMessage);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      // First check if there are any EHR records associated with this appointment
      const appointment = appointments.find(apt => apt.appointment_ID === id);
      if (appointment) {
        const ehrRecords = await ehrService.getByPatient(appointment.patient_ID);
        const appointmentEHRs = ehrRecords.filter(
          ehr => ehr.appointmentId === id
        );
        
        if (appointmentEHRs.length > 0) {
          const confirmMessage = `This appointment has ${appointmentEHRs.length} associated EHR record(s). Deleting the appointment will not delete these records. Are you sure you want to continue?`;
          if (!confirm(confirmMessage)) {
            return;
          }
        }
      }
      
      // Confirm deletion
      if (confirm('Are you sure you want to delete this appointment?')) {
        await appointmentService.deleteAppointment(id);
        showAlert('success', 'Appointment deleted successfully');
        fetchData();
      }
    } catch (error) {
      const apiError = error as ApiError;
      showAlert('error', apiError.error || 'Delete failed');
    }
  };

  const columns = [
    {
      key: 'ref_Num',
      header: 'Reference',
    },
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
      key: 'type',
      header: 'Type',
      render: (apt: Appointment) => (
        <Badge variant="info">{apt.type}</Badge>
      ),
    },
    {
      key: 'patient',
      header: 'Patient',
      render: (apt: Appointment) => apt.patient ? `${apt.patient.first} ${apt.patient.last}` : 'N/A',
    },
    {
      key: 'doctor',
      header: 'Doctor',
      render: (apt: Appointment) => (
        <div className="flex items-center justify-between gap-2">
          <span>{apt.doctor ? `Dr. ${apt.doctor.name}` : 'N/A'}</span>
          {apt.doctor && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleViewDoctor(apt.doctor_ID)}
            >
              View
            </Button>
          )}
        </div>
      ),
    },
    {
      key: 'nurse',
      header: 'Nurse',
      render: (apt: Appointment) => (
        <div className="flex items-center justify-between gap-2">
          <span>{apt.nurse ? apt.nurse.name : 'N/A'}</span>
          {apt.nurse && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleViewNurse(apt.nurse_ID)}
            >
              View
            </Button>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (apt: Appointment) => (
        <div className="flex flex-wrap gap-1 sm:gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => handleViewDetails(apt)}
            icon={<FileText className="w-3 h-3 sm:w-4 sm:h-4" />}
          >
            <span className="hidden sm:inline">View</span>
          </Button>
          <Button 
            size="sm" 
            variant="secondary" 
            onClick={() => handleOpenModal(apt)}
          >
            <span className="hidden sm:inline">Edit</span>
            <span className="sm:hidden">✏️</span>
          </Button>
          <Button 
            size="sm" 
            variant="danger" 
            onClick={() => handleDelete(apt.appointment_ID)}
          >
            <span className="hidden sm:inline">Delete</span>
            <span className="sm:hidden">🗑️</span>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-full overflow-hidden">
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage clinic appointments</p>
        </div>
        <Button 
          onClick={() => handleOpenModal()}
          icon={<Calendar className="w-4 h-4 sm:w-5 sm:h-5" />}
          className="w-full sm:w-auto"
        >
          Add Appointment
        </Button>
      </div>

      {alert && (
        <div className="mb-4">
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        </div>
      )}

      <Card className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <Tabs
            tabs={[
              { id: 'all', label: 'All', count: appointments.length },
              { id: 'upcoming', label: 'Upcoming', count: appointments.filter(a => new Date(a.date) >= new Date()).length },
              { id: 'past', label: 'Past', count: appointments.filter(a => new Date(a.date) < new Date()).length },
            ]}
            activeTab={filterTab}
            onChange={(tab) => setFilterTab(tab as 'all' | 'upcoming' | 'past')}
          />
          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'calendar' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Calendar View"
            >
              <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="List View"
            >
              <List className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </Card>

      {viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-2">
            <CalendarView
              appointments={appointments}
              onDateClick={setSelectedDate}
              onAppointmentClick={handleViewDetails}
              currentDate={selectedDate}
            />
          </div>
          <div className="lg:sticky lg:top-20">
            <DayAppointmentsSidebar
              date={selectedDate}
              appointments={getAppointmentsForSelectedDate()}
              onAppointmentClick={handleViewDetails}
            />
          </div>
        </div>
      ) : (
        <Card>
          <Table
            data={filteredAppointments as unknown as Record<string, unknown>[]}
            columns={columns as any}
            isLoading={isLoading}
            emptyMessage={`No ${filterTab === 'all' ? '' : filterTab} appointments found.`}
          />
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingAppointment ? 'Edit Appointment' : 'Schedule New Appointment'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Alert in Modal */}
          {modalError && (
            <Alert type="error" message={modalError} onClose={() => setModalError('')} />
          )}

          {/* Patient Autocomplete */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Patient <span className="text-red-500">*</span>
            </label>
            <PatientAutocomplete
              value={selectedPatient}
              onChange={(patient: Patient | null) => {
                setSelectedPatient(patient);
                setFormData({ ...formData, patient_ID: patient?.patient_ID.toString() || '' });
              }}
            />
            
            {/* Selected Patient Info */}
            {selectedPatient && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {selectedPatient.first} {selectedPatient.middle} {selectedPatient.last} 
                      <span className="text-sm text-gray-600 ml-2">
                        ({selectedPatient.gender.charAt(0)}, {calculateAge(selectedPatient.dob)} yrs)
                      </span>
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {selectedPatient.phone}
                    </p>
                    {(() => {
                      const lastVisit = getLastVisit(selectedPatient.patient_ID);
                      return lastVisit ? (
                        <p className="text-xs text-gray-500 mt-1">
                          Last visit: {formatDateForDisplay(lastVisit.date)}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">First visit</p>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Date & Time - 2 Column Layout */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Time <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="w-full appearance-none px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
                <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Appointment Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Appointment Type <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full appearance-none px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white cursor-pointer"
                required
              >
                <option value="">Select type...</option>
                <option value="Checkup">Checkup</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Root Canal">Root Canal</option>
                <option value="Filling">Filling</option>
                <option value="Extraction">Extraction</option>
                <option value="Crown">Crown</option>
                <option value="Whitening">Whitening</option>
                <option value="Emergency">Emergency</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Options: Checkup, Cleaning, Root Canal, Filling, Extraction, Crown, Whitening, Emergency
            </p>
          </div>

          {/* Doctor & Nurse - 2 Column Layout */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Doctor <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="doctor_ID"
                  value={formData.doctor_ID}
                  onChange={handleChange}
                  className="w-full appearance-none px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white cursor-pointer"
                  required
                >
                  <option value="">Select doctor...</option>
                  {doctors.length > 0 ? (
                    doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        Dr. {doctor.name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No doctors available</option>
                  )}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nurse <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="nurse_ID"
                  value={formData.nurse_ID}
                  onChange={handleChange}
                  className="w-full appearance-none px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white cursor-pointer"
                  required
                >
                  <option value="">Select nurse...</option>
                  {nurses.length > 0 ? (
                    nurses.map((nurse) => (
                      <option key={nurse.nursE_ID} value={nurse.nursE_ID}>
                        {nurse.name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No nurses available</option>
                  )}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Reference Number (Auto-generated) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Reference Number (auto-generated)
            </label>
            <input
              type="text"
              value={editingAppointment?.ref_Num || generateRefNumber()}
              readOnly
              className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
            />
          </div>

          {/* Conflict Warning */}
          {checkConflict && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900">Scheduling Conflict</p>
                <p className="text-sm text-amber-700 mt-1">{checkConflict}</p>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={handleCloseModal} size="lg">
              Cancel
            </Button>
            <Button type="submit" size="lg">
              {editingAppointment ? 'Update' : 'Schedule'} Appointment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Appointment Details Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        title="Appointment Details"
        size="xl"
      >
        {selectedAppointment && (
          <div className="space-y-6">
            {/* Appointment Info */}
            <Card title="Appointment Information" noPadding>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Reference</p>
                    <p className="font-semibold text-gray-900">{selectedAppointment.ref_Num}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> Date
                    </p>
                    <p className="font-semibold text-gray-900">{formatDateForDisplay(selectedAppointment.date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Clock className="w-4 h-4" /> Time
                    </p>
                    <p className="font-semibold text-gray-900">{formatTimeForDisplay(selectedAppointment.time)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <Badge variant="info">{selectedAppointment.type}</Badge>
                  </div>
                </div>
              </div>
            </Card>

            {/* Patient Information */}
            {selectedAppointment.patient && (
              <Card title="Patient Information" noPadding>
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {selectedAppointment.patient.first} {selectedAppointment.patient.middle} {selectedAppointment.patient.last}
                      </h3>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">Gender</p>
                          <p className="font-medium text-gray-900">{selectedAppointment.patient.gender}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Date of Birth</p>
                          <p className="font-medium text-gray-900">{formatDateForDisplay(selectedAppointment.patient.dob)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 flex items-center gap-1">
                            <Phone className="w-4 h-4" /> Phone
                          </p>
                          <p className="font-medium text-gray-900">{selectedAppointment.patient.phone}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Staff Information */}
            <Card title="Staff Assigned" noPadding>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedAppointment.doctor && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">Doctor</p>
                      <p className="font-semibold text-gray-900">Dr. {selectedAppointment.doctor.name}</p>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3" /> {selectedAppointment.doctor.phone}
                      </p>
                    </div>
                  )}
                  {selectedAppointment.nurse && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">Nurse</p>
                      <p className="font-semibold text-gray-900">{selectedAppointment.nurse.name}</p>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3" /> {selectedAppointment.nurse.phone}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* EHR Records */}
            {patientEHR.length > 0 && (
              <Card title={`Electronic Health Records (${patientEHR.length})`} noPadding>
                <div className="p-6">
                  <div className="space-y-4">
                    {patientEHR.slice(0, 3).map((ehr, index) => (
                      <div key={ehr.ehr_ID || index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="info">EHR #{ehr.ehr_ID}</Badge>
                          <p className="text-xs text-gray-500">{ehr.updatedAt ? new Date(ehr.updatedAt).toLocaleString() : 'N/A'}</p>
                        </div>
                        {ehr.diagnosis && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-gray-700">Diagnosis</p>
                            <p className="text-sm text-gray-900">{ehr.diagnosis}</p>
                          </div>
                        )}
                        {ehr.allergies && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-gray-700">Allergies</p>
                            <p className="text-sm text-red-600">{ehr.allergies}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {patientEHR.length > 3 && (
                    <p className="text-sm text-center text-gray-500 mt-4">
                      + {patientEHR.length - 3} more records
                    </p>
                  )}
                </div>
              </Card>
            )}

            <div className="flex justify-end">
              <Button variant="secondary" onClick={handleCloseDetailModal}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Doctor Details Modal */}
      <DoctorDetailsModal
        isOpen={isDoctorDetailsModalOpen}
        doctor={selectedDoctor}
        onClose={handleCloseDoctorDetailsModal}
      />

      {/* Nurse Details Modal */}
      <NurseDetailsModal
        isOpen={isNurseDetailsModalOpen}
        nurse={selectedNurse}
        onClose={handleCloseNurseDetailsModal}
      />
    </div>
  );
}
