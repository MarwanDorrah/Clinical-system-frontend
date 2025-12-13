import { EHR } from '@/types/api.types';

/**
 * Get EHR ID from EHR object
 * Standardized to use ehr_ID (lowercase)
 */
export const getEhrId = (ehr: EHR | null | undefined): number => {
  if (!ehr) return 0;
  // Support old naming for backward compatibility with existing backend data
  return ehr.ehr_ID || (ehr as any).ehR_ID || 0;
};

/**
 * Check if EHR has a valid ID
 */
export const hasValidEhrId = (ehr: EHR | null | undefined): boolean => {
  return getEhrId(ehr) > 0;
};
