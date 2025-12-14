'use client';

import { useState } from 'react';
import { Appointment } from '@/types/api.types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Badge from './Badge';

interface CalendarViewProps {
  appointments: Appointment[];
  onDateClick: (date: Date) => void;
  onAppointmentClick: (appointment: Appointment) => void;
  currentDate?: Date;
}

export default function CalendarView({
  appointments,
  onDateClick,
  onAppointmentClick,
  currentDate = new Date(),
}: CalendarViewProps) {
  const [viewDate, setViewDate] = useState(currentDate);

  // Debug logging - log appointments when they change
  console.log('CalendarView received appointments:', appointments.length);
  if (appointments.length > 0) {
    console.log('Sample appointment:', appointments[0]);
    console.log('All appointment dates:', appointments.map(a => a.date));
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const getAppointmentsForDate = (day: number) => {
    const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayAppointments = appointments.filter((apt) => {
      // Handle both "2025-12-15" and "2025-12-15T00:00:00" formats
      const aptDate = apt.date.split('T')[0];
      return aptDate === dateStr;
    });
    
    // Debug logging (remove after testing)
    if (dayAppointments.length > 0) {
      console.log(`Found ${dayAppointments.length} appointments for ${dateStr}:`, dayAppointments.map(a => ({ type: a.type, time: a.time })));
    }
    
    return dayAppointments;
  };

  const getAppointmentColor = (type: string) => {
    const colors: Record<string, string> = {
      'Checkup': 'bg-blue-500',
      'Cleaning': 'bg-green-500',
      'Root Canal': 'bg-purple-500',
      'Filling': 'bg-yellow-500',
      'Emergency': 'bg-red-500',
      'Extraction': 'bg-orange-500',
      'Crown': 'bg-indigo-500',
      'Whitening': 'bg-pink-500',
      'Treatment': 'bg-teal-500',
    };
    return colors[type] || 'bg-gray-600';
  };

  const previousMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setViewDate(new Date());
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      viewDate.getMonth() === today.getMonth() &&
      viewDate.getFullYear() === today.getFullYear()
    );
  };

  const daysInMonth = getDaysInMonth(viewDate);
  const firstDayOfMonth = getFirstDayOfMonth(viewDate);
  const monthName = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Generate calendar days
  const calendarDays: (number | null)[] = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  
  // Add actual days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 md:p-5 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-blue-50">
        <button
          onClick={previousMonth}
          className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        
        <div className="flex items-center gap-3">
          <h2 className="text-lg md:text-xl font-bold text-gray-900">{monthName}</h2>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs md:text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            Today
          </button>
        </div>
        
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="p-3 md:p-4">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs md:text-sm font-semibold text-gray-600 py-2">
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.substring(0, 1)}</span>
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square"></div>;
            }

            const dayAppointments = getAppointmentsForDate(day);
            const today = isToday(day);

            return (
              <button
                key={day}
                onClick={() => {
                  const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
                  onDateClick(date);
                }}
                className={`
                  aspect-square p-1 md:p-2 rounded-lg border-2 transition-all hover:border-primary-500 hover:shadow-md
                  ${today ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white hover:bg-gray-50'}
                  ${dayAppointments.length > 0 ? 'font-semibold' : ''}
                `}
              >
                <div className="flex flex-col h-full justify-between">
                  <span className={`text-xs md:text-sm ${today ? 'text-primary-700' : 'text-gray-700'}`}>
                    {day}
                  </span>
                  
                  {/* Appointment indicators */}
                  {dayAppointments.length > 0 && (
                    <div className="flex flex-col items-center gap-0.5 mt-1">
                      {dayAppointments.slice(0, 3).map((apt, idx) => (
                        <div
                          key={apt.appointment_ID}
                          className={`w-full h-0.5 md:h-1 rounded-full ${getAppointmentColor(apt.type)}`}
                          title={`${apt.time} - ${apt.type}`}
                        ></div>
                      ))}
                      {dayAppointments.length > 3 && (
                        <span className="text-[9px] md:text-[10px] text-gray-500 font-normal mt-0.5">
                          +{dayAppointments.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-3 md:px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
        <div className="flex flex-wrap gap-2 md:gap-3 justify-center">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-xs text-gray-600">Checkup</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs text-gray-600">Cleaning</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-xs text-gray-600">Root Canal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-xs text-gray-600">Filling</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-xs text-gray-600">Extraction</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
            <span className="text-xs text-gray-600">Crown</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-pink-500"></div>
            <span className="text-xs text-gray-600">Whitening</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-xs text-gray-600">Emergency</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-gray-600"></div>
            <span className="text-xs text-gray-600">Other</span>
          </div>
        </div>
      </div>
    </div>
  );
}
