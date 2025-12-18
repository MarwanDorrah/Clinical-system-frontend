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
    
    if (aptTime < now) return 'warning'; 
    return 'info'; 
  };

  const getStatusLabel = (apt: Appointment) => {
    const aptTime = new Date(`${apt.date}T${apt.time}`);
    const now = new Date();
    
    if (aptTime < now) return 'Past';
    return 'Scheduled';
  };

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg flex flex-col h-full max-h-[700px] hover:shadow-xl transition-shadow">
      {}
      <div className="p-5 border-b-2 border-gray-100 bg-gradient-to-br from-primary-50 via-blue-50 to-purple-50 flex-shrink-0 rounded-t-xl">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-gray-900">Appointments</h3>
          <div className="px-3 py-1.5 bg-white rounded-full shadow-sm">
            <span className="text-lg font-bold text-primary-700">{sortedAppointments.length}</span>
          </div>
        </div>
        <p className="text-sm text-gray-700 font-medium">{formattedDate}</p>
        <div className="mt-3 flex items-center gap-2">
          <div className="h-1 flex-1 bg-primary-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary-500 to-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((sortedAppointments.length / 10) * 100, 100)}%` }}
            ></div>
          </div>
          <span className="text-xs font-semibold text-gray-600">
            {sortedAppointments.length === 0 ? 'Free' : sortedAppointments.length <= 5 ? 'Light' : sortedAppointments.length <= 8 ? 'Busy' : 'Full'}
          </span>
        </div>
      </div>

      {}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 custom-scrollbar">
        {sortedAppointments.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center shadow-inner">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium text-lg">No appointments</p>
            <p className="text-sm text-gray-500 mt-2">This day is completely free</p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Available
            </div>
          </div>
        ) : (
          sortedAppointments.map((apt, index) => (
            <button
              key={apt.appointment_ID}
              onClick={() => onAppointmentClick(apt)}
              className="w-full text-left p-4 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:shadow-lg transition-all bg-white hover:bg-gradient-to-br hover:from-white hover:to-primary-50 transform hover:-translate-y-1 duration-200"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                  <Clock className="w-4 h-4 text-primary-600" />
                  <span className="font-bold text-gray-900">{apt.time}</span>
                </div>
                <Badge variant={getStatusBadgeVariant(apt)}>
                  {getStatusLabel(apt)}
                </Badge>
              </div>

              {}
              <div className="flex items-center space-x-2 mb-3 bg-blue-50 px-3 py-2 rounded-lg">
                <User className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-800">
                  Patient ID: <span className="font-bold text-blue-700">{apt.patient_ID}</span>
                </span>
              </div>

              {}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-sm font-bold text-primary-700 bg-primary-50 px-3 py-1 rounded-lg">
                  {apt.type}
                </span>
                <span className="text-xs text-gray-500 font-medium">
                  #{apt.ref_Num}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
