// Validation utilities for forms

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  // Support multiple phone formats:
  // - International: +XX XXX XXX XXXX or +XXXXXXXXXXXX
  // - National: XXX-XXX-XXXX or (XXX) XXX-XXXX
  // - Simple: XXXXXXXXXX (10+ digits)
  const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Check if it starts with + (international) or is at least 7 digits
  if (cleanedPhone.startsWith('+')) {
    return /^\+\d{7,15}$/.test(cleanedPhone);
  }
  
  return /^\d{7,15}$/.test(cleanedPhone);
};

export const validatePhoneStrict = (phone: string): boolean => {
  // Strict US format validation
  const phoneRegex = /^\d{3}-?\d{3}-?\d{4}$/;
  return phoneRegex.test(phone);
};

export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  if (password.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('One number');
  return { valid: errors.length === 0, errors };
};

export const validateRequired = (value: string, fieldName: string): string | null => {
  if (!value || value.trim().length === 0) {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateMinLength = (value: string, minLength: number, fieldName: string): string | null => {
  if (value.trim().length < minLength) {
    return `${fieldName} must be at least ${minLength} characters`;
  }
  return null;
};

export const validateAppointmentTime = (date: string, time: string): string | null => {
  const appointmentDateTime = new Date(`${date}T${time}`);
  const now = new Date();
  
  // Check if in the past
  if (appointmentDateTime < now) {
    return "Cannot create appointments in the past";
  }
  
  // Check business hours (8 AM - 6 PM)
  const hour = appointmentDateTime.getHours();
  if (hour < 8 || hour >= 18) {
    return "Appointments must be between 8 AM and 6 PM";
  }
  
  return null;
};

export const APPOINTMENT_TYPES = [
  'Checkup',
  'Cleaning',
  'Filling',
  'Root Canal',
  'Extraction',
  'Emergency',
  'Consultation',
  'Follow-up',
] as const;

export const MEDICATION_FREQUENCIES = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Four times daily',
  'Every 4 hours',
  'Every 6 hours',
  'Every 8 hours',
  'Every 12 hours',
  'As needed',
  'Before meals',
  'After meals',
  'At bedtime',
] as const;

export const MEDICATION_ROUTES = [
  'Oral',
  'Topical',
  'Sublingual',
  'Intravenous',
  'Intramuscular',
  'Subcutaneous',
  'Inhalation',
  'Rectal',
] as const;

export const PROCEDURE_STATUSES = [
  'Planned',
  'In Progress',
  'Completed',
  'Cancelled',
  'Postponed',
] as const;

export const TOOTH_CONDITIONS = [
  'Healthy',
  'Cavity',
  'Filled',
  'Crown',
  'Root Canal',
  'Extracted',
  'Missing',
  'Fractured',
  'Decayed',
  'Impacted',
] as const;

export const XRAY_TYPES = [
  'Bitewing',
  'Periapical',
  'Panoramic',
  'Cephalometric',
  'Occlusal',
  'CBCT',
] as const;

export const SUPPLY_UNITS = [
  'Piece',
  'Box',
  'Pack',
  'Bottle',
  'Tube',
  'ml',
  'L',
  'g',
  'kg',
] as const;
