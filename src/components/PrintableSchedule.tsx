'use client';

import { Appointment, Patient } from '@/types/api.types';
import { formatDateForDisplay, formatTimeForDisplay } from '@/utils/date.utils';

interface PrintableScheduleProps {
  appointments: Appointment[];
  date?: Date;
  viewType?: 'daily' | 'weekly';
}

export default function PrintableSchedule({
  appointments,
  date = new Date(),
  viewType = 'daily',
}: PrintableScheduleProps) {
  const printDate = new Date().toLocaleDateString('default', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formatScheduleDate = (date: Date) => {
    return date.toLocaleDateString('default', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getWeekDates = (date: Date) => {
    const week: Date[] = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const weekDate = new Date(startOfWeek);
      weekDate.setDate(startOfWeek.getDate() + i);
      week.push(weekDate);
    }
    return week;
  };

  const filterAppointmentsByDate = (targetDate: Date) => {
    const dateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
    return appointments.filter((apt) => apt.date === dateStr).sort((a, b) => a.time.localeCompare(b.time));
  };

  const dailyAppointments = filterAppointmentsByDate(date);
  const weekDates = viewType === 'weekly' ? getWeekDates(date) : [];

  return (
    <div className="print-container bg-white p-8 max-w-[297mm] mx-auto">
      <style jsx>{`
        @media print {
          .print-container {
            padding: 0;
            max-width: 100%;
          }
          .no-print {
            display: none !important;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      <div className="border-b-2 border-gray-800 pb-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {viewType === 'daily' ? 'Daily Appointment Schedule' : 'Weekly Appointment Schedule'}
        </h1>
        <div className="mt-2 text-sm text-gray-600">
          <p>Printed: {printDate}</p>
          <p>
            Schedule for: {viewType === 'daily' ? formatScheduleDate(date) : `Week of ${formatScheduleDate(weekDates[0])}`}
          </p>
        </div>
      </div>

      {viewType === 'daily' && (
        <div>
          <div className="mb-4 bg-gray-100 p-3 rounded">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">{formatScheduleDate(date)}</h2>
              <span className="text-sm font-semibold text-gray-700">
                Total Appointments: {dailyAppointments.length}
              </span>
            </div>
          </div>

          {dailyAppointments.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded border-2 border-dashed border-gray-300">
              <p className="text-gray-500 text-lg">No appointments scheduled for this day</p>
            </div>
          ) : (
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th className="border border-gray-300 px-3 py-2 text-left w-20">Time</th>
                  <th className="border border-gray-300 px-3 py-2 text-left w-24">Ref #</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Patient ID</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Type</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Doctor ID</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Nurse ID</th>
                  <th className="border border-gray-300 px-3 py-2 text-left w-32">Notes</th>
                </tr>
              </thead>
              <tbody>
                {dailyAppointments.map((apt, index) => (
                  <tr key={apt.appointment_ID} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-300 px-3 py-2 font-semibold">
                      {formatTimeForDisplay(apt.time)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 font-mono text-xs">
                      {apt.ref_Num}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      {apt.patient_ID}
                      {apt.patient && (
                        <div className="text-xs text-gray-600 mt-1">
                          {apt.patient.first} {apt.patient.last}
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {apt.type}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      {apt.doctor_ID}
                      {apt.doctor && <div className="text-xs text-gray-600 mt-1">Dr. {apt.doctor.name}</div>}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      {apt.nurse_ID}
                      {apt.nurse && <div className="text-xs text-gray-600 mt-1">{apt.nurse.name}</div>}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-xs">
                      <div className="h-8"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {viewType === 'weekly' && (
        <div>
          {weekDates.map((weekDate, dayIndex) => {
            const dayAppointments = filterAppointmentsByDate(weekDate);
            const isWeekend = weekDate.getDay() === 0 || weekDate.getDay() === 6;

            return (
              <div key={dayIndex} className={`mb-6 ${dayIndex > 0 ? 'page-break' : ''}`}>
                <div className={`mb-3 p-3 rounded ${isWeekend ? 'bg-gray-100' : 'bg-blue-50'}`}>
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900">
                      {weekDate.toLocaleDateString('default', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </h2>
                    <span className="text-sm font-semibold text-gray-700">
                      {dayAppointments.length} appointment{dayAppointments.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {dayAppointments.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded border border-dashed border-gray-300">
                    <p className="text-gray-400 text-sm">No appointments</p>
                  </div>
                ) : (
                  <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                      <tr className="bg-gray-700 text-white">
                        <th className="border border-gray-300 px-2 py-1 text-left w-16">Time</th>
                        <th className="border border-gray-300 px-2 py-1 text-left w-20">Ref #</th>
                        <th className="border border-gray-300 px-2 py-1 text-left">Patient</th>
                        <th className="border border-gray-300 px-2 py-1 text-left">Type</th>
                        <th className="border border-gray-300 px-2 py-1 text-left">Staff</th>
                        <th className="border border-gray-300 px-2 py-1 text-left w-24">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dayAppointments.map((apt, index) => (
                        <tr
                          key={apt.appointment_ID}
                          className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                        >
                          <td className="border border-gray-300 px-2 py-1 font-semibold">
                            {formatTimeForDisplay(apt.time)}
                          </td>
                          <td className="border border-gray-300 px-2 py-1 font-mono text-xs">
                            {apt.ref_Num}
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            <div className="font-medium">ID: {apt.patient_ID}</div>
                            {apt.patient && (
                              <div className="text-xs text-gray-600">
                                {apt.patient.first} {apt.patient.last}
                              </div>
                            )}
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                              {apt.type}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-xs">
                            <div>Dr: {apt.doctor_ID}</div>
                            <div>RN: {apt.nurse_ID}</div>
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            <div className="flex items-center space-x-1 text-xs">
                              <span>☐</span>
                              <span className="text-gray-600">Done</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 pt-4 border-t-2 border-gray-300">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="border border-gray-300 p-3 rounded bg-gray-50">
            <p className="font-semibold text-gray-700">Total Appointments</p>
            <p className="text-2xl font-bold text-primary-600">
              {viewType === 'daily'
                ? dailyAppointments.length
                : weekDates.reduce((sum, d) => sum + filterAppointmentsByDate(d).length, 0)}
            </p>
          </div>
          <div className="border border-gray-300 p-3 rounded bg-gray-50">
            <p className="font-semibold text-gray-700">Appointment Types</p>
            <p className="text-xs text-gray-600 mt-1">
              {Array.from(new Set(appointments.map((a) => a.type))).join(', ')}
            </p>
          </div>
          <div className="border border-gray-300 p-3 rounded bg-gray-50">
            <p className="font-semibold text-gray-700">Staff Required</p>
            <p className="text-xs text-gray-600 mt-1">
              {Array.from(new Set([...appointments.map((a) => a.doctor_ID), ...appointments.map((a) => a.nurse_ID)])).length} staff members
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 border border-gray-300 rounded p-4">
        <h3 className="font-bold text-gray-900 mb-2">Additional Notes:</h3>
        <div className="space-y-2">
          <div className="border-b border-gray-200 pb-2"></div>
          <div className="border-b border-gray-200 pb-2"></div>
          <div className="border-b border-gray-200 pb-2"></div>
        </div>
      </div>

      <div className="mt-6 text-center no-print">
        <button
          onClick={() => window.print()}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
        >
          Print Schedule
        </button>
      </div>

      <style jsx>{`
        @media print {
          .page-break {
            page-break-before: always;
          }
        }
      `}</style>
    </div>
  );
}
