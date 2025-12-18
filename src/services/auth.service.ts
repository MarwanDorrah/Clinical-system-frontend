interface TokenPayload {
  sub: string;
  email: string;
  name: string;
  UserType: 'Doctor' | 'Nurse';
  role: 'Doctor' | 'Nurse';
  jti: string;
  exp: number;
  iss: string;
  aud: string;
}

export function parseJwt(token: string): TokenPayload | null {
  try {
    if (!token || token.split('.').length !== 3) {
      return null;
    }

    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to parse JWT:', error);
    return null;
  }
}

function decodeToken(): TokenPayload | null {
  if (typeof window === 'undefined') return null;
  
  const token = localStorage.getItem('token');
  if (!token) return null;

  const payload = parseJwt(token);
  if (!payload) return null;

  if (payload.exp && payload.exp * 1000 < Date.now()) {
    console.warn('Token expired, clearing storage');
    clearAuthStorage();
    return null;
  }
  
  return payload;
}

function clearAuthStorage(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('token');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userName');
  localStorage.removeItem('userId');
  localStorage.removeItem('doctorId');
}

export function getTokenTimeRemaining(): number {
  const payload = decodeToken();
  if (!payload?.exp) return 0;
  
  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();
  const remaining = expirationTime - currentTime;
  
  return remaining > 0 ? remaining : 0;
}

export function isTokenExpiringSoon(minutes: number = 5): boolean {
  const remaining = getTokenTimeRemaining();
  return remaining > 0 && remaining < (minutes * 60 * 1000);
}

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

export function isDoctor(): boolean {
  const payload = decodeToken();
  return payload?.role === 'Doctor' || payload?.UserType === 'Doctor';
}

export function isNurse(): boolean {
  const payload = decodeToken();
  return payload?.role === 'Nurse' || payload?.UserType === 'Nurse';
}

export function getUserId(): number | null {
  const payload = decodeToken();
  if (!payload?.sub) return null;
  
  const userId = parseInt(payload.sub, 10);
  return isNaN(userId) ? null : userId;
}

export function getStoredDoctorId(): number | null {
  if (typeof window === 'undefined') return null;
  
  const doctorId = localStorage.getItem('doctorId');
  if (!doctorId) return null;
  
  const id = parseInt(doctorId, 10);
  return isNaN(id) ? null : id;
}

export function getUserRole(): 'doctor' | 'nurse' | null {
  const payload = decodeToken();
  if (!payload) return null;
  
  const role = payload.role || payload.UserType;
  if (role === 'Doctor') return 'doctor';
  if (role === 'Nurse') return 'nurse';
  return null;
}

export function getUserName(): string | null {
  const payload = decodeToken();
  return payload?.name || null;
}

export function getUserEmail(): string | null {
  const payload = decodeToken();
  return payload?.email || null;
}

export function isAuthenticated(): boolean {
  const payload = decodeToken();
  return payload !== null;
}

export function logout(redirect: boolean = true): void {
  clearAuthStorage();
  
  if (redirect && typeof window !== 'undefined') {
    window.location.href = '/auth/login?reason=logout';
  }
}

export function validateToken(): { isValid: boolean; error?: string } {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  if (!token) {
    return { isValid: false, error: 'No token found' };
  }

  const payload = parseJwt(token);
  
  if (!payload) {
    return { isValid: false, error: 'Invalid token format' };
  }

  if (payload.exp && payload.exp * 1000 < Date.now()) {
    return { isValid: false, error: 'Token expired' };
  }

  if (!payload.sub) {
    return { isValid: false, error: 'Missing user ID claim' };
  }

  if (!payload.role && !payload.UserType) {
    return { isValid: false, error: 'Missing role claim' };
  }

  if (payload.iss && payload.iss !== 'ClinicalDentistSystem') {
    console.warn('Token issuer mismatch:', payload.iss);
  }

  if (payload.aud && payload.aud !== 'ClinicalDentistSystemUsers') {
    console.warn('Token audience mismatch:', payload.aud);
  }

  return { isValid: true };
}

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
