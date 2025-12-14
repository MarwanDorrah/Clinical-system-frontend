'use client';

import { Appointment } from '@/types/api.types';
import { Clock, User, Phone, FileText } from 'lucide-react';
import Badge from './Badge';

interface DayAppointmentsSidebarProps {
  date: Date;
  appointments: Appointment[];
  onAppointmentClick: (appointment: Appointment) => void;
}

export default function DayAppointmentsSidebar({
  date,
  appointments,
  onAppointmentClick,
}: DayAppointmentsSidebarProps) {
  const formattedDate = date.toLocaleDateString('default', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const sortedAppointments = [...appointments].sort((a, b) => {
    return a.time.localeCompare(b.time);
  });

  const getStatusBadgeVariant = (apt: Appointment) => {
    const aptTime = new Date(`${apt.date}T${apt.time}`);
    const now = new Date();
    
    if (aptTime < now) return 'warning'; // Past appointment
    return 'info'; // Upcoming
  };

  const getStatusLabel = (apt: Appointment) => {
    const aptTime = new Date(`${apt.date}T${apt.time}`);
    const now = new Date();
    
    if (aptTime < now) return 'Past';
    return 'Scheduled';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-md h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-primary-50">
        <h3 className="text-lg font-bold text-gray-900">Appointments</h3>
        <p className="text-sm text-gray-600 mt-1">{formattedDate}</p>
        <div className="mt-2">
          <span className="text-xs text-gray-500">
            {sortedAppointments.length} {sortedAppointments.length === 1 ? 'appointment' : 'appointments'}
          </span>
        </div>
      </div>

      {/* Appointments List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sortedAppointments.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">No appointments scheduled</p>
            <p className="text-sm text-gray-400 mt-1">This day is free</p>
          </div>
        ) : (
          sortedAppointments.map((apt) => (
            <button
              key={apt.appointment_ID}
              onClick={() => onAppointmentClick(apt)}
              className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all bg-white"
            >
              {/* Time and Status */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold text-gray-900">{apt.time}</span>
                </div>
                <Badge variant={getStatusBadgeVariant(apt)}>
                  {getStatusLabel(apt)}
                </Badge>
              </div>

              {/* Patient Info */}
              <div className="flex items-center space-x-2 mb-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">
                  Patient ID: {apt.patient_ID}
                </span>
              </div>

              {/* Appointment Type */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-primary-700">
                  {apt.type}
                </span>
                <span className="text-xs text-gray-500">
                  Ref: {apt.ref_Num}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
