export interface AuthResponse {
  token: string;
  doctorId?: number;
  nurseId?: number;
  name: string;
  email: string;
  phone: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterDoctorRequest {
  name: string;
  phone: string;
  email: string;
  password: string;
}

export interface RegisterNurseRequest {
  name: string;
  phone: string;
  email: string;
  password: string;
  registrationKey?: string;
}

export interface Patient {
  patient_ID: number;
  first: string;
  middle?: string | null;
  last: string;
  gender: string;
  dob: string;
  phone?: string | null;
}

export interface PatientCreateRequest {
  first: string;
  middle?: string | null;
  last: string;
  gender: string;
  dob: string; 
  phone?: string | null;
}

export interface PatientUpdateRequest {
  patient_ID: number;
  first: string;
  middle?: string | null;
  last: string;
  gender: string;
  dob: string; 
  phone?: string | null;
}

export interface Doctor {
  id: number;
  name: string;
  phone: string;
  email: string;
}

export interface Nurse {
  nursE_ID: number;
  nurse_ID?: number; 
  name: string;
  phone: string;
  email: string;
}

export const getNurseId = (nurse: Nurse): number => nurse.nursE_ID || nurse.nurse_ID || 0;

export interface Appointment {
  appointment_ID: number;
  date: string;
  time: string;
  ref_Num: string;
  type: string;
  status?: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  patient_ID: number;
  doctor_ID: number;
  nurse_ID: number;
  patient?: Patient;
  doctor?: Doctor;
  nurse?: Nurse;
}

export interface CreateAppointmentRequest {
  date: string;
  time: string; 
  type: string;
  patient_ID: number;
  doctor_ID: number;
  nurse_ID: number;
}

export interface UpdateAppointmentRequest {
  appointment_ID: number;
  date: string;
  time: string; 
  type: string;
  patient_ID: number;
  doctor_ID: number;
  nurse_ID: number;
}

export interface Medication {
  medication_ID?: number;
  Medication_ID?: number;
  name?: string;
  Name?: string;
  dosage?: string;
  Dosage?: string;
  frequency?: string;
  Frequency?: string;
  route?: string;
  Route?: string;
  startDate?: string;
  StartDate?: string;
  endDate?: string;
  EndDate?: string;
  notes?: string;
  Notes?: string;
}

export interface Procedure {
  procedure_ID?: number;
  Procedure_ID?: number;
  code?: string;
  Code?: string;
  description?: string;
  Description?: string;
  performedAt?: string;
  PerformedAt?: string;
  toothNumber?: number;
  ToothNumber?: number;
  toothName?: string;
  ToothName?: string;
  status?: string;
  Status?: string;
  notes?: string;
  Notes?: string;
}

export interface ToothRecord {
  ToothRecord_ID?: number;
  toothRecord_ID?: number; 
  toothNumber?: number;
  ToothNumber?: number;
  toothName?: string;
  ToothName?: string;
  condition?: string;
  Condition?: string;
  treatmentPlanned?: string;
  TreatmentPlanned?: string;
  treatmentCompleted?: string;
  TreatmentCompleted?: string;
  surfaces?: string;
  Surfaces?: string;
  notes?: string;
  Notes?: string;
  lastUpdated?: string;
  LastUpdated?: string;
}

export interface XRay {
  xRay_ID?: number;
  XRay_ID?: number;
  type?: string;
  Type?: string;
  findings?: string;
  Findings?: string;
  imagePath?: string;
  ImagePath?: string;
  hasImage?: boolean;
  HasImage?: boolean;
  takenAt?: string;
  TakenAt?: string;
  takenBy?: string;
  TakenBy?: string;
  notes?: string;
  Notes?: string;
}

export interface ChangeLog {
  changeLog_ID: number;
  fieldName: string;
  oldValue?: string;
  newValue?: string;
  changeType: string;
  changedAt: string;
  changedByDoctorId: number;
  changedByDoctorName: string;
  appointmentId: number;
  ehr_ID: number;
}

export interface MedicationRecordDto {
  name: string;
  dosage?: string;
  frequency?: string;
  route?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

export interface ProcedureRecordDto {
  code: string;
  description: string;
  performedAt: string;
  toothNumber?: number;
  toothName?: string;
  status?: string;
  notes?: string;
}

export interface ToothRecordDto {
  toothNumber: number;
  toothName?: string;
  condition?: string;
  treatmentPlanned?: string;
  treatmentCompleted?: string;
  surfaces?: string;
  notes?: string;
}

export interface XRayRecordDto {
  type: string;
  findings?: string;
  imagePath?: string;
  takenAt: string;
  takenBy?: string;
  notes?: string;
}

export interface EHRCreateRequest {
  patient_ID: number;
  appointmentId: number;
  allergies?: string;
  medicalAlerts?: string;
  diagnosis?: string;
  xRayFindings?: string;
  periodontalStatus?: string;
  clinicalNotes?: string;
  recommendations?: string;
  history?: string;
  treatments?: string;
  medications?: MedicationRecordDto[];
  procedures?: ProcedureRecordDto[];
  teeth?: ToothRecordDto[];
  xRays?: XRayRecordDto[];
}

export interface EHRUpdateRequest extends EHRCreateRequest {
  ehr_ID: number;
}

export interface EHR {
  ehr_ID?: number;
  EHR_ID?: number; 
  allergies?: string;
  Allergies?: string;
  medicalAlerts?: string;
  MedicalAlerts?: string;
  diagnosis?: string;
  Diagnosis?: string;
  xRayFindings?: string;
  XRayFindings?: string;
  periodontalStatus?: string;
  PeriodontalStatus?: string;
  clinicalNotes?: string;
  ClinicalNotes?: string;
  recommendations?: string;
  Recommendations?: string;
  history?: string;
  History?: string;
  treatments?: string;
  Treatments?: string;
  updatedAt?: string;
  UpdatedAt?: string;
  updatedBy?: string;
  UpdatedBy?: string;
  patient_ID?: number;
  Patient_ID?: number;
  appointmentId?: number;
  AppointmentId?: number;
  patient?: Patient;
  Patient?: Patient;
  appointment?: Appointment;
  Appointment?: Appointment;
  medications?: Medication[];
  Medications?: Medication[];
  procedures?: Procedure[];
  Procedures?: Procedure[];
  teeth?: ToothRecord[];
  Teeth?: ToothRecord[];
  toothRecords?: ToothRecord[];
  ToothRecords?: ToothRecord[];
  xRays?: XRay[];
  XRays?: XRay[];
  changeLogs?: ChangeLog[];
  ChangeLogs?: ChangeLog[];
}

export const getEhrId = (ehr: EHR): number => ehr.ehr_ID || ehr.EHR_ID || 0;

export interface DoctorBasicInfo {
  id: number;
  name: string;
  phone: string;
  email: string;
}

export interface SupplyBasicInfo {
  supply_ID: number;
  supply_Name: string;
  category: string;
  unit: string;
  quantity: number;
  description?: string;
}

export interface Supply {
  supply_ID: number;
  supply_Name: string;
  category: string;
  unit: string;
  quantity: number;
  description?: string;
  stockTransactions?: StockTransactionBasicInfo[];
}

export interface StockTransactionBasicInfo {
  t_ID: number;
  date: string;
  time: string;
  quantity: number;
  doctor_ID: number;
  doctorName?: string;
}

export interface StockTransactionCreateRequest {
  date: string;
  time: string;
  quantity: number;
  doctor_ID: number; 
  supply_ID: number; 
}

export interface StockTransactionUpdateRequest {
  t_ID: number;
  date?: string;
  time?: string;
  quantity?: number;
  doctor_ID?: number;
  supply_ID?: number;
}

export interface StockTransaction {
  t_ID: number;
  date: string;
  time: string;
  quantity: number;
  doctor_ID: number;
  supply_ID: number;
  doctor?: DoctorBasicInfo;
  supply?: SupplyBasicInfo;
}

export interface ApiError {
  error: string;
  details?: string[];
  hint?: string;
}

export interface AIAutoCompleteRequest {
  partialText: string;
  context?: string;
}

export interface AIAutoCompleteResponse {
  suggestions: string[];
}

export interface AITerminologyRequest {
  partialTerm: string;
}

export interface AITerminologyResponse {
  suggestions: string[];
}

export interface AIGenerateNotesRequest {
  bulletPoints: string;
  patientContext?: string;
}

export interface AIGenerateNotesResponse {
  generatedNotes: string;
}

export interface AISuggestTreatmentsRequest {
  diagnosis: string;
  patientHistory?: string;
}

export interface AISuggestTreatmentsResponse {
  treatments: string[];
}

export interface AIExtractClinicalDataRequest {
  freeText: string;
}

export interface AIExtractClinicalDataResponse {
  diagnosis?: string;
  symptoms?: string[];
  treatments?: string[];
  periodontalStatus?: string;
  medications?: string[];
  affectedTeeth?: number[];
  allergies?: string;
  medicalAlerts?: string;
  medicalHistory?: string;
  xRayFindings?: string;
  clinicalNotes?: string;
  recommendations?: string;
}
