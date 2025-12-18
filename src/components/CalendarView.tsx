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
      
      const aptDate = apt.date.split('T')[0];
      return aptDate === dateStr;
    });

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
    return colors[type] || 'bg-teal-500';
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

  const calendarDays: (number | null)[] = [];

  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      {}
      <div className="flex items-center justify-between p-4 md:p-6 border-b-2 border-gray-100 bg-gradient-to-r from-primary-50 via-blue-50 to-purple-50">
        <button
          onClick={previousMonth}
          className="p-2.5 hover:bg-white/80 rounded-xl transition-all hover:scale-105 shadow-sm"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        
        <div className="flex items-center gap-3">
          <h2 className="text-lg md:text-2xl font-bold text-gray-900 tracking-tight">{monthName}</h2>
          <button
            onClick={goToToday}
            className="px-4 py-2 text-xs md:text-sm bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
          >
            Today
          </button>
        </div>
        
        <button
          onClick={nextMonth}
          className="p-2.5 hover:bg-white/80 rounded-xl transition-all hover:scale-105 shadow-sm"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {}
      <div className="p-3 md:p-4">
        {}
        <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs md:text-sm font-semibold text-gray-600 py-2">
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.substring(0, 1)}</span>
            </div>
          ))}
        </div>

        {}
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
                  aspect-square p-1.5 md:p-3 rounded-xl border-2 transition-all duration-200
                  ${today 
                    ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-blue-50 shadow-md' 
                    : 'border-gray-200 bg-white hover:border-primary-400'}
                  ${dayAppointments.length > 0 
                    ? 'hover:shadow-lg hover:scale-105 ring-2 ring-transparent hover:ring-primary-200' 
                    : 'hover:shadow-md hover:scale-102'}
                  hover:-translate-y-0.5 transform
                `}
              >
                <div className="flex flex-col h-full justify-between">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs md:text-base font-semibold ${
                      today ? 'text-primary-700' : dayAppointments.length > 0 ? 'text-gray-900' : 'text-gray-600'
                    }`}>
                      {day}
                    </span>
                    {dayAppointments.length > 0 && (
                      <span className="text-[9px] md:text-xs px-1.5 py-0.5 bg-primary-600 text-white rounded-full font-bold">
                        {dayAppointments.length}
                      </span>
                    )}
                  </div>
                  
                  {}
                  {dayAppointments.length > 0 && (
                    <div className="flex flex-col items-center gap-1 mt-1">
                      {dayAppointments.slice(0, 2).map((apt, idx) => (
                        <div
                          key={apt.appointment_ID}
                          className={`w-full h-1 md:h-1.5 rounded-full ${getAppointmentColor(apt.type)} shadow-sm`}
                          title={`${apt.time} - ${apt.type}`}
                        ></div>
                      ))}
                      {dayAppointments.length > 2 && (
                        <div className="flex gap-0.5 mt-0.5">
                          {dayAppointments.slice(2, 5).map((apt, idx) => (
                            <div
                              key={apt.appointment_ID}
                              className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full ${getAppointmentColor(apt.type)}`}
                              title={`${apt.time} - ${apt.type}`}
                            ></div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {}
      <div className="px-4 md:px-6 py-4 border-t-2 border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100 rounded-b-xl">
        <div className="mb-2">
          <p className="text-xs font-semibold text-gray-700 text-center">Appointment Types</p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-4 justify-center">
          <div className="flex items-center gap-2 px-2 py-1 bg-white rounded-lg shadow-sm">
            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm"></div>
            <span className="text-xs font-medium text-gray-700">Checkup</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1 bg-white rounded-lg shadow-sm">
            <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
            <span className="text-xs font-medium text-gray-700">Cleaning</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1 bg-white rounded-lg shadow-sm">
            <div className="w-3 h-3 rounded-full bg-purple-500 shadow-sm"></div>
            <span className="text-xs font-medium text-gray-700">Root Canal</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1 bg-white rounded-lg shadow-sm">
            <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm"></div>
            <span className="text-xs font-medium text-gray-700">Filling</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1 bg-white rounded-lg shadow-sm">
            <div className="w-3 h-3 rounded-full bg-orange-500 shadow-sm"></div>
            <span className="text-xs font-medium text-gray-700">Extraction</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1 bg-white rounded-lg shadow-sm">
            <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-sm"></div>
            <span className="text-xs font-medium text-gray-700">Crown</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1 bg-white rounded-lg shadow-sm">
            <div className="w-3 h-3 rounded-full bg-pink-500 shadow-sm"></div>
            <span className="text-xs font-medium text-gray-700">Whitening</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1 bg-white rounded-lg shadow-sm">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
            <span className="text-xs font-medium text-gray-700">Emergency</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1 bg-white rounded-lg shadow-sm">
            <div className="w-3 h-3 rounded-full bg-teal-500 shadow-sm"></div>
            <span className="text-xs font-medium text-gray-700">Other/Custom</span>
          </div>
        </div>
      </div>
    </div>
  );
}
