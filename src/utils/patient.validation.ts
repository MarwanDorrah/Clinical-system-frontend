/**
 * Patient Module Validation Utilities
 * Aligned with backend API specification
 */

export interface PatientFormData {
  first: string;
  middle?: string;
  last: string;
  gender: string;
  dob: string;
  phone?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validates complete patient form data matching backend PatientCreateRequest/PatientUpdateRequest
 */
export const validatePatientForm = (data: PatientFormData): ValidationResult => {
  const errors: Record<string, string> = {};

  // First Name Validation (required, max 100)
  if (!data.first || data.first.trim().length === 0) {
    errors.first = 'First name is required';
  } else if (data.first.trim().length > 100) {
    errors.first = 'First name must not exceed 100 characters';
  }

  // Middle Name Validation (optional, max 100)
  if (data.middle && data.middle.trim().length > 100) {
    errors.middle = 'Middle name must not exceed 100 characters';
  }

  // Last Name Validation (required, max 100)
  if (!data.last || data.last.trim().length === 0) {
    errors.last = 'Last name is required';
  } else if (data.last.trim().length > 100) {
    errors.last = 'Last name must not exceed 100 characters';
  }

  // Gender Validation (required, max 50)
  if (!data.gender || data.gender.trim().length === 0) {
    errors.gender = 'Gender is required';
  } else if (data.gender.length > 50) {
    errors.gender = 'Gender must not exceed 50 characters';
  }

  // Date of Birth Validation (required, format YYYY-MM-DD)
  if (!data.dob) {
    errors.dob = 'Date of birth is required';
  } else {
    const dobDate = new Date(data.dob);
    const today = new Date();
    const minDate = new Date('1900-01-01');

    if (isNaN(dobDate.getTime())) {
      errors.dob = 'Invalid date format (use YYYY-MM-DD)';
    } else if (dobDate > today) {
      errors.dob = 'Date of birth cannot be in the future';
    } else if (dobDate < minDate) {
      errors.dob = 'Date of birth must be after 1900';
    }
  }

  // Phone Validation (optional, max 20)
  if (data.phone && data.phone.trim().length > 20) {
    errors.phone = 'Phone number must not exceed 20 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validates a single field
 */
export const validatePatientField = (fieldName: keyof PatientFormData, value: string, allData?: PatientFormData): string | null => {
  const tempData: PatientFormData = allData || {
    first: '',
    last: '',
    gender: 'Male',
    dob: '',
  };
  
  tempData[fieldName] = value as any;
  
  const result = validatePatientForm(tempData);
  return result.errors[fieldName] || null;
};

/**
 * Calculates age from date of birth
 */
export const calculateAge = (dob: string): number => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

/**
 * Formats patient name for display
 */
export const formatPatientName = (first: string, middle: string | null | undefined, last: string): string => {
  return middle ? `${first} ${middle} ${last}` : `${first} ${last}`;
};

/**
 * Sanitizes patient data before submission (matching backend expectations)
 */
export const sanitizePatientData = (data: PatientFormData): PatientFormData => {
  return {
    first: data.first.trim(),
    middle: data.middle?.trim() || undefined,
    last: data.last.trim(),
    gender: data.gender,
    dob: data.dob, // Already in YYYY-MM-DD format
    phone: data.phone?.trim() || undefined,
  };
};
