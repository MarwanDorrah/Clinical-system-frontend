// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://localhost:7000',
  ENDPOINTS: {
    // Authentication
    DOCTOR_REGISTER: '/api/DoctorAuth/Register',
    DOCTOR_LOGIN: '/api/DoctorAuth/Login',
    NURSE_REGISTER: '/api/NurseAuth/Register',
    NURSE_LOGIN: '/api/NurseAuth/Login',
    
    // Patients
    PATIENTS: '/Patient',
    PATIENT_BY_ID: (id: number) => `/Patient/${id}`,
    
    // Doctors
    DOCTORS: '/Doctor',
    DOCTOR_BY_ID: (id: number) => `/Doctor/${id}`,
    
    // Nurses
    NURSES: '/Nurse',
    NURSE_BY_ID: (id: number) => `/Nurse/${id}`,
    
    // Appointments
    APPOINTMENTS: '/Appointment',
    APPOINTMENT_BY_ID: (id: number) => `/Appointment/${id}`,
    APPOINTMENT_BY_PATIENT: (patientId: number) => `/Appointment/patient/${patientId}`,
    
    // EHR
    EHR: '/EHR',
    EHR_BY_ID: (id: number) => `/EHR/${id}`,
    EHR_BY_PATIENT: (patientId: number) => `/EHR/patient/${patientId}`,
    EHR_HISTORY: (id: number) => `/EHR/${id}/history`,
    
    // Supplies
    SUPPLIES: '/Supply',
    SUPPLY_BY_ID: (id: number) => `/Supply/${id}`,
    SUPPLY_BY_CATEGORY: (category: string) => `/Supply/Category/${category}`,
    SUPPLY_LOW_STOCK: (threshold: number) => `/Supply/LowStock/${threshold}`,
    SUPPLY_ADD_STOCK: (id: number) => `/Supply/${id}/AddStock`,
    
    // Stock Transactions
    STOCK_TRANSACTIONS: '/StockTransaction',
    STOCK_TRANSACTION_BY_ID: (id: number) => `/StockTransaction/${id}`,
    STOCK_TRANSACTION_BY_DOCTOR: (doctorId: number) => `/StockTransaction/Doctor/${doctorId}`,
    STOCK_TRANSACTION_BY_SUPPLY: (supplyId: number) => `/StockTransaction/Supply/${supplyId}`,
  }
};

export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER_ROLE: 'userRole',
  USER_NAME: 'userName',
  USER_ID: 'userId',
  DOCTOR_ID: 'doctorId', // Store doctor ID separately for API calls
};

export const USER_ROLES = {
  DOCTOR: 'Doctor',
  NURSE: 'Nurse',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
