'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
import AppointmentSearchAutocomplete from '@/components/AppointmentSearchAutocomplete';
import { appointmentService, patientService, doctorService, nurseService, ehrService } from '@/services';
import { Appointment, Patient, Doctor, Nurse, EHR, ApiError, getNurseId } from '@/types/api.types';
import { dateAPIToInput, timeAPIToInput, timeInputToAPI, formatDateForDisplay, formatTimeForDisplay } from '@/utils/date.utils';
import { getEhrId } from '@/utils/ehr.utils';
import { Calendar, User, FileText, Clock, Phone, Mail, List, CalendarDays, AlertCircle, ChevronDown, Edit3, Trash2 } from 'lucide-react';

export default function AppointmentsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDetailModalLoading, setIsDetailModalLoading] = useState(false);
  const [isDoctorDetailsModalOpen, setIsDoctorDetailsModalOpen] = useState(false);
  const [isNurseDetailsModalOpen, setIsNurseDetailsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedNurse, setSelectedNurse] = useState<Nurse | null>(null);
  const [patientEHR, setPatientEHR] = useState<EHR[]>([]);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [staffPanel, setStaffPanel] = useState<{ type: 'doctor' | 'nurse'; data: Doctor | Nurse | null } | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [modalError, setModalError] = useState<string>('');
  const [filterTab, setFilterTab] = useState<'all' | 'upcoming' | 'past'>('all');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    type: '',
    customType: '',
    patient_ID: '',
    doctor_ID: '',
    nurse_ID: '',
  });
  const [refFilter, setRefFilter] = useState('');
  const [patientFilterId, setPatientFilterId] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'id-asc' | 'id-desc'>('date-desc');

  useEffect(() => {
    fetchData();
    
    const action = searchParams.get('action');
    if (action === 'add') {
      setIsModalOpen(true);
    }
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, filterTab, viewMode, refFilter, patientFilterId, dateFilter, sortBy]);

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

    if (viewMode === 'list') {
      
      if (refFilter && refFilter.trim() !== '') {
        const q = refFilter.trim().toLowerCase();
        filtered = filtered.filter(a => {
          const rawRef = (a.ref_Num || '').toString().toLowerCase();
          const genRef = formatRef(a).toLowerCase();
          const idStr = a.appointment_ID?.toString() || '';
          
          if (rawRef.includes(q) || genRef.includes(q) || idStr.includes(q)) return true;
          
          if (/[a-zA-Z]/.test(q) && patients && patients.length > 0) {
            const patient = patients.find(p => p.patient_ID === a.patient_ID);
            if (patient) {
              const fullName = `${patient.first || ''} ${patient.middle || ''} ${patient.last || ''}`.toLowerCase();
              if (fullName.includes(q)) return true;
            }
          }
          return false;
        });
      }

      if (patientFilterId) {
        filtered = filtered.filter(a => a.patient_ID?.toString() === patientFilterId.toString());
      }

      if (dateFilter) {
        filtered = filtered.filter(a => {
          try {
            const aptDateStr = new Date(a.date).toISOString().split('T')[0];
            return aptDateStr === dateFilter;
          } catch (e) {
            return false;
          }
        });
      }
    }

    filtered.sort((a, b) => {
      const toDateOnly = (d: string) => {
        try {
          return new Date(d).toISOString().split('T')[0];
        } catch (e) {
          return d;
        }
      };

      if (sortBy === 'id-asc' || sortBy === 'id-desc') {
        const dir = sortBy === 'id-asc' ? 1 : -1;
        return dir * ((a.appointment_ID || 0) - (b.appointment_ID || 0));
      }

      const aDate = toDateOnly(a.date);
      const bDate = toDateOnly(b.date);
      const dateCompare = aDate.localeCompare(bDate);

      if (dateCompare !== 0) {
        return sortBy === 'date-asc' ? dateCompare : -dateCompare;
      }

      return sortBy === 'date-asc' ? a.time.localeCompare(b.time) : b.time.localeCompare(a.time);
    });

    setFilteredAppointments(filtered);
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      const results = await Promise.allSettled([
        appointmentService.getAllAppointments() as Promise<Appointment[]>,
        patientService.getAllPatients() as Promise<Patient[]>,
        doctorService.getAllDoctors() as Promise<Doctor[]>,
        nurseService.getAllNurses() as Promise<Nurse[]>,
      ]);

      const [appointmentsResult, patientsResult, doctorsResult, nursesResult] = results;

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
    if (type === 'success') {
      setTimeout(() => setAlert(null), 8000);
    }
  };

  const handleOpenModal = (appointment?: Appointment) => {
    setModalError('');
    if (appointment) {
      setEditingAppointment(appointment);
      const predefinedTypes = ['Checkup', 'Cleaning', 'Root Canal', 'Filling', 'Extraction', 'Crown', 'Whitening', 'Emergency'];
      const isCustomType = !predefinedTypes.includes(appointment.type);
      setFormData({
        date: dateAPIToInput(appointment.date),
        time: timeAPIToInput(appointment.time),
        type: isCustomType ? 'Other' : appointment.type,
        customType: isCustomType ? appointment.type : '',
        patient_ID: appointment.patient_ID.toString(),
        doctor_ID: appointment.doctor_ID.toString(),
        nurse_ID: appointment.nurse_ID.toString(),
      });
      const patient = patients.find(p => p.patient_ID === appointment.patient_ID);
      setSelectedPatient(patient || null);
    } else {
      setEditingAppointment(null);
      setSelectedPatient(null);
      setFormData({
        date: '',
        time: '',
        type: '',
        customType: '',
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
    setIsDetailModalLoading(true);

    if (appointment.patient_ID) {
      try {
        const [ehrData, patientData] = await Promise.all([
          ehrService.getByPatient(appointment.patient_ID) as Promise<EHR[]>,
          patientService.getPatientById(appointment.patient_ID) as Promise<Patient>
        ]);
        setPatientEHR(ehrData);
        setSelectedAppointment(prev => prev ? ({ ...prev, patient: patientData } as Appointment) : appointment);
      } catch (error) {
        console.error('Error fetching EHR or patient:', error);
        setPatientEHR([]);
      } finally {
        setIsDetailModalLoading(false);
      }
    } else {
      setIsDetailModalLoading(false);
    }
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setIsDetailModalLoading(false);
    setSelectedAppointment(null);
    setPatientEHR([]);
    setStaffPanel(null);
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
    const nurse = nurses.find(n => getNurseId(n) === nurseId);
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
    const selectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    
    return appointments.filter((apt) => {
      const appointmentDateStr = apt.date.split('T')[0];
      return appointmentDateStr === selectedDateStr;
    });
  };

  const generateRefNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    return `APT-${year}-${random}`;
  };

  const formatRef = (apt: Appointment | null | undefined) => {
    if (!apt) return '';
    if (apt.ref_Num && apt.ref_Num.trim()) return apt.ref_Num;
    if (apt.appointment_ID) return `APT-${String(apt.appointment_ID).padStart(3, '0')}`;
    return generateRefNumber();
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

  const getLastVisit = (patientId: number) => {
    const patientApts = appointments.filter(apt => 
      apt.patient_ID === patientId && 
      new Date(apt.date) < new Date()
    );
    if (patientApts.length === 0) return null;
    const sorted = patientApts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return sorted[0];
  };

  const checkConflict = useMemo(() => {
    if (!formData.date || !formData.time || !formData.doctor_ID) return null;

    const toDateOnly = (d: string) => {
      try {
        return new Date(d).toISOString().split('T')[0];
      } catch (e) {
        return d;
      }
    };

    const conflictingApt = appointments.find(apt => 
      toDateOnly(apt.date) === formData.date &&
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
    if (formData.type === 'Other' && !formData.customType.trim()) {
      setModalError('Please enter a custom appointment type');
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
          type: formData.type === 'Other' ? formData.customType.trim() : formData.type,
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

        const createData = {
          date: formData.date,
          time: timeInputToAPI(formData.time),
          type: formData.type === 'Other' ? formData.customType.trim() : formData.type,
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
      const appointment = appointments.find(apt => apt.appointment_ID === id);
      if (appointment) {
        const ehrRecords = await ehrService.getByPatient(appointment.patient_ID);
        const appointmentEHRs = ehrRecords.filter(
          ehr => ehr.appointmentId === id
        );
        
        if (appointmentEHRs.length > 0) {
          showAlert('error', `Cannot delete appointment. ${appointmentEHRs.length} EHR record(s) are linked to this appointment.`);
          return;
        }
      }
      
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
              onClick={() => handleViewNurse(apt.nurse_ID || getNurseId(apt.nurse!))}
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
            title="View appointment details"
          >
            <span className="hidden sm:inline">View</span>
          </Button>
          <Button 
            size="sm" 
            variant="secondary" 
            onClick={() => handleOpenModal(apt)}
            title="Edit appointment"
          >
            <span className="hidden sm:inline">Edit</span>
            <span className="sm:hidden"><Edit3 className="w-4 h-4" /></span>
          </Button>
          <Button 
            size="sm" 
            variant="danger" 
            onClick={() => handleDelete(apt.appointment_ID)}
            title="Delete appointment"
          >
            <span className="hidden sm:inline">Delete</span>
            <span className="sm:hidden"><Trash2 className="w-4 h-4" /></span>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-full overflow-hidden">
      {}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Appointments</h1>
            <p className="text-sm sm:text-base text-gray-600">Manage and schedule clinic appointments</p>
          </div>
          <Button 
            onClick={() => handleOpenModal()}
            icon={<Calendar className="w-5 h-5" />}
            className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-shadow"
            size="lg"
          >
            Schedule Appointment
          </Button>
        </div>
        
        {}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-blue-700 font-medium">Total</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-900 mt-1">{appointments.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-green-700 font-medium">Upcoming</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-900 mt-1">
                  {appointments.filter(a => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const aptDate = new Date(a.date);
                    aptDate.setHours(0, 0, 0, 0);
                    return aptDate >= today;
                  }).length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-purple-700 font-medium">Today</p>
                <p className="text-2xl sm:text-3xl font-bold text-purple-900 mt-1">
                  {appointments.filter(a => {
                    const today = new Date();
                    const aptDate = new Date(a.date);
                    return aptDate.toDateString() === today.toDateString();
                  }).length}
                </p>
              </div>
              <CalendarDays className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-amber-700 font-medium">Past</p>
                <p className="text-2xl sm:text-3xl font-bold text-amber-900 mt-1">
                  {appointments.filter(a => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const aptDate = new Date(a.date);
                    aptDate.setHours(0, 0, 0, 0);
                    return aptDate < today;
                  }).length}
                </p>
              </div>
              <FileText className="w-8 h-8 text-amber-400" />
            </div>
          </div>
        </div>
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

      <Card className="mb-4 sm:mb-6 shadow-md">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <Tabs
            tabs={[
              { id: 'all', label: 'All', count: appointments.length },
              { id: 'upcoming', label: 'Upcoming', count: appointments.filter(a => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const aptDate = new Date(a.date);
                aptDate.setHours(0, 0, 0, 0);
                return aptDate >= today;
              }).length },
              { id: 'past', label: 'Past', count: appointments.filter(a => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const aptDate = new Date(a.date);
                aptDate.setHours(0, 0, 0, 0);
                return aptDate < today;
              }).length },
            ]}
            activeTab={filterTab}
            onChange={(tab) => setFilterTab(tab as 'all' | 'upcoming' | 'past')}
          />
          <div className="flex items-center gap-2 self-end sm:self-auto bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-md transition-all flex items-center gap-2 font-medium ${
                viewMode === 'calendar' 
                  ? 'bg-white text-primary-700 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Calendar View"
              aria-label="Switch to calendar view"
            >
              <CalendarDays className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">Calendar</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-md transition-all flex items-center gap-2 font-medium ${
                viewMode === 'list' 
                  ? 'bg-white text-primary-700 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="List View"
              aria-label="Switch to list view"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">List</span>
            </button>
          </div>
        </div>
      </Card>

      {}
      {viewMode === 'list' && (
        <Card className="mb-6 shadow-md">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-1 w-8 bg-primary-500 rounded-full"></div>
              <h3 className="text-sm font-semibold text-gray-700">Filter & Sort</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3">
              {}
              <div className="lg:col-span-4">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Search</label>
                <AppointmentSearchAutocomplete
                  appointments={appointments}
                  patients={patients}
                  value={refFilter}
                  onChange={setRefFilter}
                  placeholder="Search by Ref, ID, or Patient"
                />
              </div>

              {}
              <div className="lg:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Sort By</label>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as any)} 
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow appearance-none bg-white cursor-pointer"
                >
                  <option value="date-desc">Date (Newest)</option>
                  <option value="date-asc">Date (Oldest)</option>
                  <option value="id-desc">ID (High-Low)</option>
                  <option value="id-asc">ID (Low-High)</option>
                </select>
              </div>

              {}
              <div className="lg:col-span-3">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Patient</label>
                <PatientAutocomplete
                  value={patients.find(p => p.patient_ID.toString() === patientFilterId) || null}
                  onChange={(p) => setPatientFilterId(p ? p.patient_ID.toString() : '')}
                  placeholder="Filter by patient"
                />
              </div>

              {}
              <div className="lg:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Date</label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                />
              </div>

              {}
              <div className="lg:col-span-1 flex items-end">
                <button
                  onClick={() => { setRefFilter(''); setPatientFilterId(''); setDateFilter(''); }}
                  className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors flex items-center justify-center gap-2"
                  title="Clear all filters"
                >
                  <span className="hidden xl:inline text-sm">Clear</span>
                  <span className="xl:hidden text-sm">✕</span>
                </button>
              </div>
            </div>
            
            {}
            {(refFilter || patientFilterId || dateFilter) && (
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500">Active filters:</span>
                <div className="flex flex-wrap gap-2">
                  {refFilter && (
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full flex items-center gap-1">
                      Search: {refFilter}
                    </span>
                  )}
                  {patientFilterId && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                      Patient ID: {patientFilterId}
                    </span>
                  )}
                  {dateFilter && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
                      Date: {dateFilter}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

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
          {}
          {modalError && (
            <Alert type="error" message={modalError} onClose={() => setModalError('')} autoClose={false} />
          )}

          {}
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
            
            {}
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

          {}
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

          {}
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
                <option value="Other">Other (Custom)</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
            </div>
            
            {}
            {formData.type === 'Other' && (
              <div className="mt-3 animate-fadeIn">
                <input
                  type="text"
                  name="customType"
                  value={formData.customType}
                  onChange={handleChange}
                  placeholder="Enter custom appointment type..."
                  className="w-full px-4 py-3 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-primary-50"
                  maxLength={50}
                  required
                />
                <p className="mt-1 text-xs text-primary-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Enter a custom appointment type (e.g., Consultation, X-Ray, Follow-up)
                </p>
              </div>
            )}
            
            {formData.type !== 'Other' && (
              <p className="mt-1 text-xs text-gray-500">
                Common types available, or select &quot;Other&quot; for custom type
              </p>
            )}
          </div>

          {}
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
                    nurses.map((nurse) => {
                      const id = getNurseId(nurse);
                      return (
                        <option key={id} value={id}>
                          {nurse.name}
                        </option>
                      );
                    })
                  ) : (
                    <option value="" disabled>No nurses available</option>
                  )}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {}
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

          {}
          {checkConflict && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900">Scheduling Conflict</p>
                <p className="text-sm text-amber-700 mt-1">{checkConflict}</p>
              </div>
            </div>
          )}

          {}
          <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={handleCloseModal} size="lg">
              Cancel
            </Button>
            <Button type="submit" size="lg" disabled={!!checkConflict}>
              {editingAppointment ? 'Update' : 'Schedule'} Appointment
            </Button>
          </div>
        </form>
      </Modal>

      {}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        title="Appointment Details"
        size="xl"
      >
        {isDetailModalLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <p className="mt-4 text-gray-600">Loading appointment details...</p>
            </div>
          </div>
        ) : selectedAppointment && (
          <div className="space-y-6">
            {}
            <Card title="Appointment Information" noPadding>
              <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Reference</p>
                    <p className="font-semibold text-gray-900">{formatRef(selectedAppointment)}</p>
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

            {}
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

            {}
            <Card title="Staff Assigned" noPadding>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedAppointment.doctor && (
                    <div className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-gray-600">Doctor</p>
                          <p className="font-semibold text-gray-900">Dr. {selectedAppointment.doctor.name}</p>
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" /> {selectedAppointment.doctor.phone}
                          </p>
                          {selectedAppointment.doctor.email && (
                            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                              <Mail className="w-3 h-3" /> {selectedAppointment.doctor.email}
                            </p>
                          )}
                        </div>
                        <Button size="sm" variant="outline" onClick={() => handleViewDoctor(selectedAppointment.doctor_ID)} title="View doctor schedule and details">
                          View Details
                        </Button>
                      </div>
                    </div>
                  )}
                  {selectedAppointment.nurse && (
                    <div className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-gray-600">Nurse</p>
                          <p className="font-semibold text-gray-900">{selectedAppointment.nurse.name}</p>
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" /> {selectedAppointment.nurse.phone}
                          </p>
                          {selectedAppointment.nurse.email && (
                            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                              <Mail className="w-3 h-3" /> {selectedAppointment.nurse.email}
                            </p>
                          )}
                        </div>
                        <Button size="sm" variant="outline" onClick={() => handleViewNurse(selectedAppointment.nurse_ID || getNurseId(selectedAppointment.nurse!))} title="View nurse assignments and details">
                          View Details
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {}
            {patientEHR.length > 0 && (() => {
              const sorted = [...patientEHR].sort((a, b) => {
                const aDate = new Date(a.updatedAt || a.UpdatedAt || 0).getTime();
                const bDate = new Date(b.updatedAt || b.UpdatedAt || 0).getTime();
                return bDate - aDate;
              });
              const latest = sorted[0];
              const latestId = getEhrId(latest);
              const latestDate = formatDateForDisplay(latest?.updatedAt || latest?.UpdatedAt || '');

              return (
                <Card title={`Electronic Health Records (${patientEHR.length})`} noPadding>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-gray-600">
                        Latest record{latestDate ? `: ${latestDate}` : ''}
                      </p>
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={!latestId}
                        onClick={() => latestId && router.push(`/dashboard/ehr/${latestId}`)}
                      >
                        View Patient EHR
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {sorted.slice(0, 3).map((ehr, index) => (
                        <div key={getEhrId(ehr) || index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <Badge variant="info">EHR #{getEhrId(ehr)}</Badge>
                            <p className="text-xs text-gray-500">
                              {formatDateForDisplay(ehr.updatedAt || ehr.UpdatedAt || '')}
                            </p>
                          </div>
                          {(ehr.diagnosis || ehr.Diagnosis) && (
                            <div className="mt-2">
                              <p className="text-sm font-medium text-gray-700">Diagnosis</p>
                              <p className="text-sm text-gray-900">{ehr.diagnosis || ehr.Diagnosis}</p>
                            </div>
                          )}
                          {(ehr.allergies || ehr.Allergies) && (
                            <div className="mt-2">
                              <p className="text-sm font-medium text-gray-700">Allergies</p>
                              <p className="text-sm text-red-600">{ehr.allergies || ehr.Allergies}</p>
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
              );
            })()}

            <div className="flex justify-end">
              <Button variant="secondary" onClick={handleCloseDetailModal}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {}
      <DoctorDetailsModal
        isOpen={isDoctorDetailsModalOpen}
        doctor={selectedDoctor}
        onClose={handleCloseDoctorDetailsModal}
      />

      {}
      <NurseDetailsModal
        isOpen={isNurseDetailsModalOpen}
        nurse={selectedNurse}
        onClose={handleCloseNurseDetailsModal}
      />
    </div>
  );
}
