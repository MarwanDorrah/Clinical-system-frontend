/**
 * Authentication Service and JWT Utilities
 * 
 * JWT Configuration (from ClinicalDentistSystem API):
 * - Issuer: ClinicalDentistSystem
 * - Audience: ClinicalDentistSystemUsers
 * - ExpirationMinutes: 1440 (24 hours)
 * 
 * Token Claims:
 * - sub: User ID (int)
 * - email: User email
 * - name: Display name
 * - UserType: "Doctor" | "Nurse"
 * - role: "Doctor" | "Nurse"
 * - jti: JWT ID
 * - exp: Expiration (unix timestamp seconds)
 * - iss: Issuer
 * - aud: Audience
 * 
 * Security Notes:
 * - Using localStorage for dev/demo (XSS risk)
 * - Production: migrate to httpOnly, Secure cookies
 * - Always use HTTPS in production
 * - Implement CSP and input sanitization
 */

interface TokenPayload {
  sub: string; // userId from JwtRegisteredClaimNames.Sub
  email: string;
  name: string;
  UserType: 'Doctor' | 'Nurse'; // Custom claim
  role: 'Doctor' | 'Nurse'; // ClaimTypes.Role
  jti: string;
  exp: number; // Unix timestamp in seconds
  iss: string; // Issuer
  aud: string; // Audience
}

/**
 * Enhanced JWT parsing with better error handling
 * Based on JWT Frontend Guide recommendations
 * @param token - JWT token string
 * @returns decoded payload or null if invalid
 */
export function parseJwt(token: string): TokenPayload | null {
  try {
    if (!token || token.split('.').length !== 3) {
      return null;
    }

    const payload = token.split('.')[1];
    // Handle base64url encoding (- and _ characters)
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to parse JWT:', error);
    return null;
  }
}

/**
 * Decodes JWT token from localStorage and returns payload
 * Automatically clears expired tokens
 * @returns token payload or null if invalid/expired
 */
function decodeToken(): TokenPayload | null {
  if (typeof window === 'undefined') return null;
  
  const token = localStorage.getItem('token');
  if (!token) return null;

  const payload = parseJwt(token);
  if (!payload) return null;

  // Check if token is expired
  if (payload.exp && payload.exp * 1000 < Date.now()) {
    // Token expired - clear storage
    console.warn('Token expired, clearing storage');
    clearAuthStorage();
    return null;
  }
  
  return payload;
}

/**
 * Clear all authentication data from storage
 */
function clearAuthStorage(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('token');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userName');
  localStorage.removeItem('userId');
  localStorage.removeItem('doctorId');
}

/**
 * Get time remaining until token expiration
 * @returns milliseconds until expiration, or 0 if expired/invalid
 */
export function getTokenTimeRemaining(): number {
  const payload = decodeToken();
  if (!payload?.exp) return 0;
  
  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();
  const remaining = expirationTime - currentTime;
  
  return remaining > 0 ? remaining : 0;
}

/**
 * Check if token will expire within specified minutes
 * @param minutes - number of minutes to check
 * @returns true if token expires within the timeframe
 */
export function isTokenExpiringSoon(minutes: number = 5): boolean {
  const remaining = getTokenTimeRemaining();
  return remaining > 0 && remaining < (minutes * 60 * 1000);
}

/**
 * Get formatted time remaining string
 * @returns human-readable time remaining (e.g., "23 hours", "45 minutes")
 */
export function getTokenTimeRemainingFormatted(): string {
  const ms = getTokenTimeRemaining();
  if (ms <= 0) return 'Expired';
  
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  return 'Less than a minute';
}

/**
 * Checks if the current user is a doctor
 * @returns true if user is a doctor, false otherwise
 */
export function isDoctor(): boolean {
  const payload = decodeToken();
  return payload?.role === 'Doctor' || payload?.UserType === 'Doctor';
}

/**
 * Checks if the current user is a nurse
 * @returns true if user is a nurse, false otherwise
 */
export function isNurse(): boolean {
  const payload = decodeToken();
  return payload?.role === 'Nurse' || payload?.UserType === 'Nurse';
}

/**
 * Gets the current user's ID (doctor or nurse)
 * @returns user ID or null if not authenticated
 */
export function getUserId(): number | null {
  const payload = decodeToken();
  if (!payload?.sub) return null;
  
  const userId = parseInt(payload.sub, 10);
  return isNaN(userId) ? null : userId;
}

/**
 * Gets the stored doctor ID from localStorage
 * This is a fallback for when the token doesn't contain the DoctorId claim
 * @returns doctor ID or null if not a doctor or not found
 */
export function getStoredDoctorId(): number | null {
  if (typeof window === 'undefined') return null;
  
  const doctorId = localStorage.getItem('doctorId');
  if (!doctorId) return null;
  
  const id = parseInt(doctorId, 10);
  return isNaN(id) ? null : id;
}

/**
 * Gets the current user's role
 * @returns 'doctor', 'nurse', or null if not authenticated
 */
export function getUserRole(): 'doctor' | 'nurse' | null {
  const payload = decodeToken();
  if (!payload) return null;
  
  const role = payload.role || payload.UserType;
  if (role === 'Doctor') return 'doctor';
  if (role === 'Nurse') return 'nurse';
  return null;
}

/**
 * Gets the current user's name from token
 * @returns user name or null if not authenticated
 */
export function getUserName(): string | null {
  const payload = decodeToken();
  return payload?.name || null;
}

/**
 * Gets the current user's email from token
 * @returns user email or null if not authenticated
 */
export function getUserEmail(): string | null {
  const payload = decodeToken();
  return payload?.email || null;
}

/**
 * Checks if user is authenticated (has valid token)
 * @returns true if authenticated, false otherwise
 */
export function isAuthenticated(): boolean {
  const payload = decodeToken();
  return payload !== null;
}

/**
 * Logout and clear all authentication data
 * @param redirect - whether to redirect to login page
 */
export function logout(redirect: boolean = true): void {
  clearAuthStorage();
  
  if (redirect && typeof window !== 'undefined') {
    window.location.href = '/auth/login?reason=logout';
  }
}

/**
 * Validate token structure and claims
 * @returns object with isValid flag and error message if invalid
 */
export function validateToken(): { isValid: boolean; error?: string } {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  if (!token) {
    return { isValid: false, error: 'No token found' };
  }

  const payload = parseJwt(token);
  
  if (!payload) {
    return { isValid: false, error: 'Invalid token format' };
  }

  // Check expiration
  if (payload.exp && payload.exp * 1000 < Date.now()) {
    return { isValid: false, error: 'Token expired' };
  }

  // Validate required claims - check for sub (user ID) and either role or UserType
  if (!payload.sub) {
    return { isValid: false, error: 'Missing user ID claim' };
  }

  // Check if at least one role claim exists (role or UserType)
  if (!payload.role && !payload.UserType) {
    return { isValid: false, error: 'Missing role claim' };
  }

  // Validate issuer and audience (from API config) - make optional as some tokens might not include these
  if (payload.iss && payload.iss !== 'ClinicalDentistSystem') {
    console.warn('Token issuer mismatch:', payload.iss);
  }

  if (payload.aud && payload.aud !== 'ClinicalDentistSystemUsers') {
    console.warn('Token audience mismatch:', payload.aud);
  }

  return { isValid: true };
}

/**
 * Get all token information for debugging
 * WARNING: Do not expose sensitive data in production
 */
export function getTokenInfo(): {
  payload: TokenPayload | null;
  expiresAt: Date | null;
  expiresIn: string;
  isExpired: boolean;
  isExpiringSoon: boolean;
} {
  const payload = decodeToken();
  
  if (!payload) {
    return {
      payload: null,
      expiresAt: null,
      expiresIn: 'N/A',
      isExpired: true,
      isExpiringSoon: false,
    };
  }

  const expiresAt = payload.exp ? new Date(payload.exp * 1000) : null;
  const remaining = getTokenTimeRemaining();
  
  return {
    payload: payload,
    expiresAt: expiresAt,
    expiresIn: getTokenTimeRemainingFormatted(),
    isExpired: remaining <= 0,
    isExpiringSoon: isTokenExpiringSoon(5),
  };
}

/**
 * Diagnostic function to check if token has doctor claim
 * The backend might be looking for a specific doctor ID claim
 * @returns object with diagnostic information
 */
export function getDoctorClaimDiagnostics(): {
  hasDoctorClaim: boolean;
  doctorId: number | null;
  userType: string | null;
  role: string | null;
  userId: number | null;
  missingClaims: string[];
  recommendation: string;
} {
  const payload = decodeToken();
  
  if (!payload) {
    return {
      hasDoctorClaim: false,
      doctorId: null,
      userType: null,
      role: null,
      userId: null,
      missingClaims: ['Token not found or invalid'],
      recommendation: 'Please login again'
    };
  }

  const missingClaims: string[] = [];
  const userId = parseInt(payload.sub, 10);
  const isDoctorRole = payload.role === 'Doctor' || payload.UserType === 'Doctor';
  
  // Check for standard doctor ID claim (might not exist in current token structure)
  const hasDoctorIdClaim = 'DoctorId' in payload || 'doctorId' in payload;
  
  if (!hasDoctorIdClaim) {
    missingClaims.push('DoctorId claim not found in token');
  }
  
  if (!isDoctorRole) {
    missingClaims.push('User is not a Doctor');
  }
  
  let recommendation = '';
  if (missingClaims.length > 0) {
    recommendation = 'The backend expects a DoctorId claim in the JWT token, but your token only contains userId (sub claim). ' +
                    'The backend needs to be updated to use the sub claim as the doctor ID, or the login endpoint needs to add a DoctorId claim to the token.';
  } else {
    recommendation = 'Token appears valid for doctor operations';
  }
  
  return {
    hasDoctorClaim: hasDoctorIdClaim,
    doctorId: hasDoctorIdClaim ? (payload as any).DoctorId || (payload as any).doctorId : null,
    userType: payload.UserType || null,
    role: payload.role || null,
    userId: isNaN(userId) ? null : userId,
    missingClaims,
    recommendation
  };
}
