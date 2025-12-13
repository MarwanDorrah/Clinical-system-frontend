import { API_CONFIG, STORAGE_KEYS } from '@/config/api.config';
import { ApiError } from '@/types/api.types';

class ApiService {
  private baseURL: string;
  private unauthorizedCount: number = 0;
  private readonly MAX_UNAUTHORIZED_ATTEMPTS = 2;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
  }

  /**
   * Check if token is expired before making requests
   */
  private isTokenExpired(): boolean {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) return true;

    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return true;
      
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const payload = JSON.parse(jsonPayload);
      
      // Check expiration with 5 minute buffer
      if (payload.exp) {
        const expirationTime = payload.exp * 1000;
        const currentTime = Date.now();
        const bufferTime = 5 * 60 * 1000; // 5 minutes
        
        return (expirationTime - bufferTime) < currentTime;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to parse token:', error);
      return true;
    }
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      // Handle 401 Unauthorized - Token expired or invalid
      if (response.status === 401) {
        this.unauthorizedCount++;
        
        // Parse error message first to determine the type of auth error
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Authentication failed. Please try again.';
        let errorDetails: any = null;
        
        if (contentType && contentType.includes('application/json')) {
          try {
            errorDetails = await response.json();
            if (errorDetails.error) {
              errorMessage = errorDetails.error;
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
        
        // Log detailed error info for debugging backend authorization issues
        console.error('401 Unauthorized:', {
          url: response.url,
          error: errorMessage,
          details: errorDetails,
          attemptCount: this.unauthorizedCount
        });
        
        // Check if this is a backend authorization issue (not token expiration)
        const isAuthorizationIssue = errorMessage.toLowerCase().includes('unable to retrieve') ||
                                     errorMessage.toLowerCase().includes('doctor information');
        
        if (isAuthorizationIssue) {
          // Log token payload for debugging (REMOVE IN PRODUCTION)
          const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
          if (token) {
            try {
              const payload = JSON.parse(atob(token.split('.')[1]));
              console.error('Token payload for debugging:', {
                sub: payload.sub,
                role: payload.role,
                UserType: payload.UserType,
                name: payload.name,
                email: payload.email,
                exp: new Date(payload.exp * 1000).toISOString()
              });
            } catch (e) {
              console.error('Failed to decode token for debugging');
            }
          }
          
          // Throw error without incrementing unauthorized count or redirecting
          // This is a backend authorization issue, not a token validity issue
          throw { 
            error: `${errorMessage}. This appears to be a backend authorization configuration issue. Please contact system administrator.`,
            status: 401,
            isBackendAuthIssue: true
          };
        }
        
        // Only redirect after multiple 401s to avoid false positives
        if (this.unauthorizedCount >= this.MAX_UNAUTHORIZED_ATTEMPTS) {
          if (typeof window !== 'undefined') {
            console.warn('Multiple 401 errors detected, redirecting to login');
            // Clear storage and redirect to login
            localStorage.removeItem(STORAGE_KEYS.TOKEN);
            localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
            localStorage.removeItem(STORAGE_KEYS.USER_NAME);
            localStorage.removeItem(STORAGE_KEYS.USER_ID);
            
            // Add small delay to allow any pending operations to complete
            setTimeout(() => {
              window.location.href = '/auth/login?reason=session_expired';
            }, 100);
          }
        }
        
        throw { error: errorMessage, status: 401 };
      }

      const contentType = response.headers.get('content-type');
      let error: ApiError;
      
      if (contentType && contentType.includes('application/json')) {
        error = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`,
        }));
      } else {
        const text = await response.text();
        error = { error: text || `HTTP ${response.status}: ${response.statusText}` };
      }
      
      console.error('API Error:', { status: response.status, url: response.url, error });
      throw error;
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    
    // For non-JSON responses (like 204 No Content), return empty object
    return {} as T;
  }

  async get<T>(endpoint: string, requiresAuth = true): Promise<T> {
    // Check token expiration before making request
    if (requiresAuth && this.isTokenExpired()) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        window.location.href = '/auth/login?reason=token_expired';
      }
      throw { error: 'Token expired. Please login again.' };
    }

    const headers = requiresAuth ? this.getAuthHeaders() : { 'Content-Type': 'application/json' };

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers,
    });
    
    // Reset counter on successful response
    if (response.ok) {
      this.unauthorizedCount = 0;
    }
    
    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data: unknown, requiresAuth = true): Promise<T> {
    // Check token expiration before making request
    if (requiresAuth && this.isTokenExpired()) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        window.location.href = '/auth/login?reason=token_expired';
      }
      throw { error: 'Token expired. Please login again.' };
    }

    const headers = requiresAuth ? this.getAuthHeaders() : { 'Content-Type': 'application/json' };
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    
    // Reset counter on successful response
    if (response.ok) {
      this.unauthorizedCount = 0;
    }
    
    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data: unknown, requiresAuth = true): Promise<T> {
    // Check token expiration before making request
    if (requiresAuth && this.isTokenExpired()) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        window.location.href = '/auth/login?reason=token_expired';
      }
      throw { error: 'Token expired. Please login again.' };
    }

    const headers = requiresAuth ? this.getAuthHeaders() : { 'Content-Type': 'application/json' };
    
    // Debug: Log the request details for EHR updates
    if (endpoint.includes('/EHR/')) {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      const authHeaders = requiresAuth ? this.getAuthHeaders() : {};
      const hasAuthHeader = 'Authorization' in authHeaders;
      console.log('🔧 EHR PUT Request Debug:', {
        endpoint,
        hasToken: !!token,
        tokenLength: token?.length || 0,
        authHeader: hasAuthHeader ? 'Present' : 'Missing',
        headers: headers
      });
      
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('🔍 Token Claims Being Sent:', {
            sub: payload.sub || 'MISSING',
            name: payload.name || 'MISSING',
            UserType: payload.UserType || 'MISSING',
            email: payload.email || 'MISSING'
          });
        } catch (e) {
          console.error('❌ Failed to decode token');
        }
      }
    }
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    
    // Reset counter on successful response
    if (response.ok) {
      this.unauthorizedCount = 0;
    }
    
    return this.handleResponse<T>(response);
  }

  async patch<T>(endpoint: string, data: unknown, requiresAuth = true): Promise<T> {
    // Check token expiration before making request
    if (requiresAuth && this.isTokenExpired()) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        window.location.href = '/auth/login?reason=token_expired';
      }
      throw { error: 'Token expired. Please login again.' };
    }

    const headers = requiresAuth ? this.getAuthHeaders() : { 'Content-Type': 'application/json' };
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
    
    // Reset counter on successful response
    if (response.ok) {
      this.unauthorizedCount = 0;
    }
    
    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string, requiresAuth = true): Promise<T> {
    // Check token expiration before making request
    if (requiresAuth && this.isTokenExpired()) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        window.location.href = '/auth/login?reason=token_expired';
      }
      throw { error: 'Token expired. Please login again.' };
    }

    const headers = requiresAuth ? this.getAuthHeaders() : { 'Content-Type': 'application/json' };
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers,
    });
    
    // Reset counter on successful response
    if (response.ok) {
      this.unauthorizedCount = 0;
    }
    
    return this.handleResponse<T>(response);
  }
}

export const apiService = new ApiService();
