import { apiService } from './api.service';

export interface AutoCompleteRequest {
  partialText: string;
  context?: string;
  completionType?: 'word' | 'sentence';
}

export interface AutoCompleteResponse {
  suggestions: string[];
}

export interface TerminologyRequest {
  partialTerm: string;
}

export interface TerminologyResponse {
  suggestions: string[];
}

export interface GenerateNotesRequest {
  bulletPoints: string;
  patientContext?: string;
}

export interface GenerateNotesResponse {
  generatedNotes: string;
}

export interface SuggestTreatmentsRequest {
  diagnosis: string;
  patientHistory?: string;
}

export interface SuggestTreatmentsResponse {
  treatments: string[];
}

export interface ExtractClinicalDataRequest {
  freeText: string;
}

export interface ExtractClinicalDataResponse {
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

export interface ParseEHRRequest {
  largeText: string;
  patientContext?: string;
}

export interface ParseEHRMedication {
  name: string | null;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
}

export interface ParseEHRProcedure {
  name: string | null;
  description: string | null;
  date: string | null;
}

export interface ParseEHRAffectedTooth {
  toothNumber: number;
  condition: string | null;
  treatment: string | null;
}

export interface ParseEHRXRay {
  type: string | null;
  findings: string | null;
  date: string | null;
}

export interface ParseEHRExtractedFields {
  allergies: string | null;
  medicalAlerts: string | null;
  diagnosis: string | null;
  xRayFindings: string | null;
  periodontalStatus: string | null;
  clinicalNotes: string | null;
  recommendations: string | null;
  history: string | null;
  treatments: string | null;
  medications: ParseEHRMedication[];
  procedures: ParseEHRProcedure[];
  affectedTeeth: ParseEHRAffectedTooth[];
  xRays: ParseEHRXRay[];
}

export interface ParseEHRResponse {
  success: boolean;
  message: string;
  extractedFields: ParseEHRExtractedFields;
}

class AIService {
  private basePath = '/api/ai';

  async autocomplete(request: AutoCompleteRequest): Promise<AutoCompleteResponse> {
    try {
      const response = await apiService.post<AutoCompleteResponse>(
        `${this.basePath}/autocomplete`,
        request
      );
      return response;
    } catch (error) {
      console.error('AI autocomplete error:', error);
      throw error;
    }
  }

  async terminology(request: TerminologyRequest): Promise<TerminologyResponse> {
    try {
      const response = await apiService.post<TerminologyResponse>(
        `${this.basePath}/terminology`,
        request
      );
      return response;
    } catch (error) {
      console.error('AI terminology error:', error);
      throw error;
    }
  }

  async generateNotes(request: GenerateNotesRequest): Promise<GenerateNotesResponse> {
    try {
      const response = await apiService.post<GenerateNotesResponse>(
        `${this.basePath}/generate-notes`,
        request
      );
      return response;
    } catch (error) {
      console.error('AI generate notes error:', error);
      throw error;
    }
  }

  async suggestTreatments(request: SuggestTreatmentsRequest): Promise<SuggestTreatmentsResponse> {
    try {
      const response = await apiService.post<SuggestTreatmentsResponse>(
        `${this.basePath}/suggest-treatments`,
        request
      );
      return response;
    } catch (error) {
      console.error('AI suggest treatments error:', error);
      throw error;
    }
  }

  async extractClinicalData(request: ExtractClinicalDataRequest): Promise<ExtractClinicalDataResponse> {
    try {
      const response = await apiService.post<ExtractClinicalDataResponse>(
        `${this.basePath}/extract-clinical-data`,
        request
      );
      return response;
    } catch (error) {
      console.error('AI extract clinical data error:', error);
      throw error;
    }
  }

  async parseEHR(request: ParseEHRRequest): Promise<ParseEHRResponse> {
    try {
      const response = await apiService.post<ParseEHRResponse>(
        `${this.basePath}/parse-to-ehr`,
        request
      );
      return response;
    } catch (error: any) {
      console.error('AI parse EHR error - Full error:', error);
      console.error('Error response:', error?.response);
      console.error('Error data:', error?.response?.data);

      let errorMessage = 'Failed to parse EHR. Please check the clinical text and try again.';
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.title) {
        errorMessage = error.response.data.title;
      } else if (error?.response?.data) {
        errorMessage = typeof error.response.data === 'string' 
          ? error.response.data 
          : JSON.stringify(error.response.data);
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }
}

export const aiService = new AIService();
