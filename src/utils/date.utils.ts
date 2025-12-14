
export const formatDateForAPI = (date: Date | string): string => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatTimeForAPI = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(`2000-01-01T${date}`) : new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

export const formatDateTimeForAPI = (date: Date | string): string => {
  const d = new Date(date);
  return d.toISOString().slice(0, 19);
};

export const formatDateForDisplay = (date: string): string => {
  const d = new Date(date);
  return d.toLocaleDateString();
};

export const formatTimeForDisplay = (time: string): string => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const d = new Date();
  d.setHours(parseInt(hours), parseInt(minutes));
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const formatDateTimeForDisplay = (datetime: string): string => {
  const d = new Date(datetime);
  return d.toLocaleString();
};

export const dateInputToAPI = (value: string): string => {
  return value;
};

export const timeInputToAPI = (value: string): string => {
  return value.length === 5 ? `${value}:00` : value;
};

export const dateAPIToInput = (date: string): string => {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
};

export const timeAPIToInput = (time: string): string => {
  if (!time) return '';
  return time.substring(0, 5);
};

export const getCurrentDateForAPI = (): string => {
  return formatDateForAPI(new Date());
};

export const getCurrentTimeForAPI = (): string => {
  return formatTimeForAPI(new Date());
};

export const isValidDateFormat = (date: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  return regex.test(date);
};

export const isValidTimeFormat = (time: string): boolean => {
  const regex = /^\d{2}:\d{2}:\d{2}$/;
  return regex.test(time);
};

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
