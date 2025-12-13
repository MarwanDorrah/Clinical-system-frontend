/**
 * Date/Time Utility Functions
 * Formats dates and times according to API requirements
 */

/**
 * Format date for API requests
 * @param date - Date object or date string
 * @returns Formatted date string "YYYY-MM-DD"
 */
export const formatDateForAPI = (date: Date | string): string => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format time for API requests
 * @param date - Date object or time string
 * @returns Formatted time string "HH:mm:ss"
 */
export const formatTimeForAPI = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(`2000-01-01T${date}`) : new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

/**
 * Format datetime for API requests
 * @param date - Date object or datetime string
 * @returns Formatted datetime string "YYYY-MM-DDTHH:mm:ss"
 */
export const formatDateTimeForAPI = (date: Date | string): string => {
  const d = new Date(date);
  return d.toISOString().slice(0, 19);
};

/**
 * Format date for display (locale-specific)
 * @param date - Date string from API
 * @returns Formatted date string for display
 */
export const formatDateForDisplay = (date: string): string => {
  const d = new Date(date);
  return d.toLocaleDateString();
};

/**
 * Format time for display (locale-specific)
 * @param time - Time string from API (HH:mm:ss)
 * @returns Formatted time string for display
 */
export const formatTimeForDisplay = (time: string): string => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const d = new Date();
  d.setHours(parseInt(hours), parseInt(minutes));
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Format datetime for display (locale-specific)
 * @param datetime - DateTime string from API
 * @returns Formatted datetime string for display
 */
export const formatDateTimeForDisplay = (datetime: string): string => {
  const d = new Date(datetime);
  return d.toLocaleString();
};

/**
 * Convert HTML input date value to API format
 * @param value - Value from input[type="date"]
 * @returns Formatted date string "YYYY-MM-DD"
 */
export const dateInputToAPI = (value: string): string => {
  return value; // HTML date input already returns YYYY-MM-DD
};

/**
 * Convert HTML input time value to API format
 * @param value - Value from input[type="time"]
 * @returns Formatted time string "HH:mm:ss"
 */
export const timeInputToAPI = (value: string): string => {
  return value.length === 5 ? `${value}:00` : value; // Add seconds if missing
};

/**
 * Convert API date to HTML input value
 * @param date - Date string from API
 * @returns Value for input[type="date"]
 */
export const dateAPIToInput = (date: string): string => {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
};

/**
 * Convert API time to HTML input value
 * @param time - Time string from API (HH:mm:ss)
 * @returns Value for input[type="time"]
 */
export const timeAPIToInput = (time: string): string => {
  if (!time) return '';
  return time.substring(0, 5); // Return HH:mm only
};

/**
 * Get current date in API format
 * @returns Current date as "YYYY-MM-DD"
 */
export const getCurrentDateForAPI = (): string => {
  return formatDateForAPI(new Date());
};

/**
 * Get current time in API format
 * @returns Current time as "HH:mm:ss"
 */
export const getCurrentTimeForAPI = (): string => {
  return formatTimeForAPI(new Date());
};

/**
 * Validate date string format (YYYY-MM-DD)
 * @param date - Date string to validate
 * @returns True if valid format
 */
export const isValidDateFormat = (date: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  return regex.test(date);
};

/**
 * Validate time string format (HH:mm:ss)
 * @param time - Time string to validate
 * @returns True if valid format
 */
export const isValidTimeFormat = (time: string): boolean => {
  const regex = /^\d{2}:\d{2}:\d{2}$/;
  return regex.test(time);
};

/**
 * Calculate age from date of birth
 * @param dob - Date of birth string
 * @returns Age in years
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
