import { apiService } from './api.service';
import {
  AuthResponse,
  LoginRequest,
  RegisterDoctorRequest,
  RegisterNurseRequest,
  Patient,
  Doctor,
  Nurse,
  Appointment,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  EHR,
  EHRCreateRequest,
  EHRUpdateRequest,
  Supply,
  StockTransaction,
  StockTransactionCreateRequest,
  StockTransactionUpdateRequest,
} from '@/types/api.types';

export const authService = {
  doctorLogin: (data: LoginRequest) =>
    apiService.post<AuthResponse>('/api/DoctorAuth/Login', data, false),

  doctorRegister: (data: RegisterDoctorRequest) =>
    apiService.post<AuthResponse>('/api/DoctorAuth/Register', data, false),

  nurseLogin: (data: LoginRequest) =>
    apiService.post<AuthResponse>('/api/NurseAuth/Login', data, false),

  nurseRegister: (data: RegisterNurseRequest) =>
    apiService.post<AuthResponse>('/api/NurseAuth/Register', data, false),
};

export const patientService = {
  getAllPatients: (): Promise<Patient[]> => apiService.get('/Patient'),
  getPatientById: (id: string | number): Promise<Patient> => apiService.get(`/Patient/${id}`),
  createPatient: (data: { first: string; middle?: string | null; last: string; gender: string; dob: string; phone?: string | null }): Promise<Patient> => 
    apiService.post('/Patient', data),
  updatePatient: (id: string | number, data: { first: string; middle?: string | null; last: string; gender: string; dob: string; phone?: string | null }): Promise<{ message: string; patient: Patient }> => 
    apiService.put(`/Patient/${id}`, { ...data, patient_ID: Number(id) }),
  deletePatient: (id: string | number): Promise<void> => apiService.delete(`/Patient/${id}`),
  searchPatients: (query: string): Promise<Patient[]> => apiService.get(`/Patient?search=${encodeURIComponent(query)}`),
};

export const doctorService = {
  getAllDoctors: (): Promise<Doctor[]> => apiService.get('/Doctor'),
  getDoctorById: (id: string | number): Promise<Doctor> => apiService.get(`/Doctor/${id}`),
  createDoctor: (data: Partial<Doctor>): Promise<Doctor> => apiService.post('/Doctor', data),
  updateDoctor: (id: string | number, data: Partial<Doctor>): Promise<{ message: string; doctor: Doctor }> => 
    apiService.put(`/Doctor/${id}`, { ...data, id: Number(id) }),

};

export const nurseService = {
  getAllNurses: (): Promise<Nurse[]> => apiService.get('/Nurse'),
  getNurseById: (id: string | number): Promise<Nurse> => apiService.get(`/Nurse/${id}`),
  createNurse: (data: Partial<Nurse>): Promise<Nurse> => apiService.post('/Nurse', data),
  updateNurse: (id: string | number, data: Partial<Nurse>): Promise<{ message: string; nurse: Nurse }> => 
    apiService.put(`/Nurse/${id}`, data),
  deleteNurse: (id: string | number): Promise<{ message: string; nurse_ID: number }> => 
    apiService.delete(`/Nurse/${id}`),
};

export const appointmentService = {
  getAllAppointments: (): Promise<Appointment[]> => apiService.get('/Appointment'),
  getAppointmentById: (id: string | number): Promise<Appointment> => apiService.get(`/Appointment/${id}`),
  getAppointmentsByPatient: async (patientId: string | number): Promise<Appointment[]> => {
    try {
      return await apiService.get(`/Appointment/patient/${patientId}`);
    } catch (error: any) {
      if (error?.status === 404 || error?.error?.includes('404') || error?.error?.includes('Not Found')) {
        console.warn('Patient-specific appointment endpoint not available, using fallback');
        const allAppointments = await apiService.get('/Appointment') as Appointment[];
        return allAppointments.filter(apt => apt.patient_ID === Number(patientId));
      }
      throw error;
    }
  },
  createAppointment: (data: CreateAppointmentRequest): Promise<Appointment> => apiService.post('/Appointment', data),
  updateAppointment: (id: string | number, data: UpdateAppointmentRequest): Promise<Appointment> => apiService.put(`/Appointment/${id}`, data),
  deleteAppointment: (id: string | number): Promise<void> => apiService.delete(`/Appointment/${id}`),
};

export const ehrService = {
  getAllEHRs: (): Promise<EHR[]> => apiService.get('/EHR'),
  getEHRById: (id: string | number): Promise<EHR> => apiService.get(`/EHR/${id}`),
  getByPatient: async (patientId: number): Promise<EHR[]> => {
    try {
      return await apiService.get(`/EHR/patient/${patientId}`);
    } catch (error: any) {
      if (error?.status === 404 || error?.error?.includes('404') || error?.error?.includes('Not Found')) {
        console.warn('Patient-specific EHR endpoint not available, using fallback');
        const allEHRs = await apiService.get('/EHR') as EHR[];
        return allEHRs.filter(ehr => ehr.patient_ID === patientId);
      }
      throw error;
    }
  },
  getHistory: (id: string | number): Promise<any[]> => apiService.get(`/EHR/${id}/history`),
  createEHR: (data: EHRCreateRequest): Promise<{ message: string; ehr: EHR }> => apiService.post('/EHR', data),
  updateEHR: (id: string | number, data: EHRUpdateRequest): Promise<{ message: string; ehr: EHR }> => apiService.put(`/EHR/${id}`, data),
  deleteEHR: (id: string | number): Promise<{ message: string }> => apiService.delete(`/EHR/${id}`),
};

export const supplyService = {
  getAllSupplies: (): Promise<Supply[]> => apiService.get('/Supply'),
  getSupplyById: (id: string | number): Promise<Supply> => apiService.get(`/Supply/${id}`),
  getByCategory: (category: string): Promise<Supply[]> => apiService.get(`/Supply/Category/${category}`),
  getLowStock: (threshold: number): Promise<Supply[]> => apiService.get(`/Supply/LowStock/${threshold}`),
  createSupply: (data: Partial<Supply>): Promise<Supply> => apiService.post('/Supply', data),
  updateSupply: (id: string | number, data: Partial<Supply>): Promise<Supply> => apiService.put(`/Supply/${id}`, data),
  addStock: (id: string | number, quantity: number): Promise<{ message: string; supply_ID: number; added_quantity: number; new_total: number }> => 
    apiService.patch(`/Supply/${id}/AddStock`, { quantity }),
  deleteSupply: (id: string | number): Promise<void> => apiService.delete(`/Supply/${id}`),
};

export const stockTransactionService = {
  getAllTransactions: (): Promise<StockTransaction[]> => apiService.get('/StockTransaction'),
  getTransactionById: (id: string | number): Promise<StockTransaction> => apiService.get(`/StockTransaction/${id}`),
  getByDoctor: (doctorId: string | number): Promise<StockTransaction[]> => apiService.get(`/StockTransaction/Doctor/${doctorId}`),
  getBySupply: (supplyId: string | number): Promise<StockTransaction[]> => apiService.get(`/StockTransaction/Supply/${supplyId}`),
  createTransaction: (data: StockTransactionCreateRequest): Promise<StockTransaction> => apiService.post('/StockTransaction', data),
  updateTransaction: (id: string | number, data: StockTransactionUpdateRequest): Promise<{ message: string; transaction: StockTransaction }> => 
    apiService.put(`/StockTransaction/${id}`, data),
  deleteTransaction: (id: string | number): Promise<{ message: string; t_ID: number; transaction_ID?: number }> => 
    apiService.delete(`/StockTransaction/${id}`),
};

export { 
  isDoctor, 
  isNurse, 
  getUserRole, 
  getUserId, 
  getUserName, 
  getUserEmail, 
  isAuthenticated,
  parseJwt,
  getTokenTimeRemaining,
  getTokenTimeRemainingFormatted,
  isTokenExpiringSoon,
  validateToken,
  getTokenInfo,
  logout as authLogout,
} from './auth.service';