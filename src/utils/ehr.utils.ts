import { EHR } from '@/types/api.types';

export const getEhrId = (ehr: EHR | null | undefined): number => {
  if (!ehr) return 0;
  return ehr.ehr_ID || (ehr as any).ehR_ID || 0;
};

export const hasValidEhrId = (ehr: EHR | null | undefined): boolean => {
  return getEhrId(ehr) > 0;
};
