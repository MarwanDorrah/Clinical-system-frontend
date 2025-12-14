'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { patientService, appointmentService, supplyService, ehrService } from '@/services';
import { Appointment, Supply, Patient, EHR } from '@/types/api.types';
import { formatDateForDisplay, formatTimeForDisplay } from '@/utils/date.utils';
import { Users, Calendar, Clock, Package, AlertTriangle, TrendingUp, ChevronRight, CheckCircle, Bell, User, FileText, Plus, Eye } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { userName, isDoctor } = useAuth();
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalAppointments: 0,
    todayAppointments: 0,
    completedToday: 0,
    lowStockItems: 0,
  });
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [weekAppointments, setWeekAppointments] = useState<Record<string, Appointment[]>>({});
  const [recentEHRs, setRecentEHRs] = useState<any[]>([]);
  const [lowStockSupplies, setLowStockSupplies] = useState<Supply[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState(3);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch patients
      const patients = await patientService.getAllPatients();
      
      // Fetch appointments
      const appointments = await appointmentService.getAllAppointments() as Appointment[];
      const today = new Date().toISOString().split('T')[0];
      const todayAppts = appointments.filter((apt) => apt.date === today);
      
      // Sort today's appointments by time
      const sortedTodayAppts = todayAppts.sort((a, b) => {
        const timeA = parseInt(a.time.split(':')[0]) * 60 + parseInt(a.time.split(':')[1]);
        const timeB = parseInt(b.time.split(':')[0]) * 60 + parseInt(b.time.split(':')[1]);
        return timeA - timeB;
      });

      // Get week's appointments (next 7 days)
      const weekAppts: Record<string, Appointment[]> = {};
      const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const dayName = daysOfWeek[date.getDay() === 0 ? 6 : date.getDay() - 1];
        weekAppts[dayName] = appointments.filter(apt => apt.date === dateStr);
      }

      // Fetch recent EHRs
      let recentRecords: any[] = [];
      try {
        const allEHRs = await ehrService.getAllEHRs();
        recentRecords = Array.isArray(allEHRs) ? allEHRs.slice(0, 5) : [];
      } catch (error) {
        console.error('Error fetching EHRs:', error);
      }

      // Fetch low stock supplies (if doctor)
      let lowStock: Supply[] = [];
      if (isDoctor()) {
        lowStock = await supplyService.getLowStock(10) as Supply[];
      }
      
      setTodayAppointments(sortedTodayAppts);
      setWeekAppointments(weekAppts);
      setRecentEHRs(recentRecords);
      setLowStockSupplies(lowStock.slice(0, 5));

      // Calculate completed today (appointments before current time)
      const currentTime = new Date().getHours() * 60 + new Date().getMinutes();
      const completedToday = todayAppts.filter(apt => {
        const aptTime = parseInt(apt.time.split(':')[0]) * 60 + parseInt(apt.time.split(':')[1]);
        return aptTime < currentTime;
      }).length;

      setStats({
        totalPatients: Array.isArray(patients) ? patients.length : 0,
        totalAppointments: appointments.length,
        todayAppointments: todayAppts.length,
        completedToday,
        lowStockItems: lowStock.length,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentDate = () => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date().toLocaleDateString('en-US', options);
  };

  const getAppointmentStatus = (appointment: Appointment) => {
    const aptTime = parseInt(appointment.time.split(':')[0]) * 60 + parseInt(appointment.time.split(':')[1]);
    const currentTime = new Date().getHours() * 60 + new Date().getMinutes();
    
    if (aptTime < currentTime - 60) return 'completed';
    if (aptTime < currentTime + 15) return 'in-progress';
    return 'upcoming';
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header Section with Profile and Notifications */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center font-bold text-blue-600 text-2xl shadow-lg">
              {userName?.charAt(0).toUpperCase() || 'D'}
            </div>
            <div className="text-white">
              <h1 className="text-2xl font-bold">Dr. {userName}</h1>
              <p className="text-blue-100">{getCurrentDate()}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all">
              <Bell className="w-6 h-6 text-white" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Calendar (Appointments) Section */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Calendar className="w-6 h-6 mr-3 text-blue-600" />
            Today's Appointments
          </h2>
          <Button
            variant="primary"
            size="sm"
            onClick={() => router.push('/dashboard/appointments')}
          >
            View All
          </Button>
        </div>

        {todayAppointments.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-lg">No appointments scheduled for today</p>
            <Button
              variant="primary"
              size="sm"
              className="mt-4"
              onClick={() => router.push('/dashboard/appointments')}
            >
              Schedule Appointment
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayAppointments.map((appointment) => {
              const status = getAppointmentStatus(appointment);
              return (
                <div
                  key={appointment.appointment_ID}
                  className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl hover:shadow-md transition-all cursor-pointer border border-gray-200"
                  onClick={() => router.push('/dashboard/appointments')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold text-blue-600">
                      {appointment.time.substring(0, 5)}
                    </span>
                    {status === 'completed' && (
                      <Badge variant="success" size="sm">
                        <CheckCircle className="w-3 h-3" />
                      </Badge>
                    )}
                    {status === 'in-progress' && (
                      <Badge variant="warning" size="sm">
                        Now
                      </Badge>
                    )}
                    {status === 'upcoming' && (
                      <Badge variant="info" size="sm">
                        Upcoming
                      </Badge>
                    )}
                  </div>
                  <p className="font-semibold text-gray-900">{appointment.type}</p>
                  <p className="text-sm text-gray-600">Ref: {appointment.ref_Num}</p>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Week's Patients Section */}
      <Card>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Users className="w-6 h-6 mr-3 text-blue-600" />
          Week's Patients
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(weekAppointments).map(([day, appointments]) => (
            <div key={day} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h3 className="font-bold text-lg text-gray-900 mb-3">{day}</h3>
              {appointments.length === 0 ? (
                <p className="text-gray-400 text-sm italic">No appointments</p>
              ) : (
                <ul className="space-y-2">
                  {appointments.slice(0, 5).map((apt) => (
                    <li
                      key={apt.appointment_ID}
                      className="text-sm text-gray-700 flex items-center"
                    >
                      <Clock className="w-3 h-3 mr-2 text-gray-400" />
                      <span className="font-medium">{apt.time.substring(0, 5)}</span>
                      <span className="mx-1">-</span>
                      <span className="truncate">{apt.type}</span>
                    </li>
                  ))}
                  {appointments.length > 5 && (
                    <li className="text-xs text-gray-500 italic">
                      +{appointments.length - 5} more
                    </li>
                  )}
                </ul>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Recently Viewed EHRs Section */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <FileText className="w-6 h-6 mr-3 text-blue-600" />
            Recently Viewed EHRs
          </h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push('/dashboard/ehr')}
          >
            View All EHRs
          </Button>
        </div>

        {recentEHRs.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No recent EHR records</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentEHRs.map((ehr) => (
              <div
                key={ehr.EHR_ID}
                className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl hover:shadow-md transition-all cursor-pointer border border-blue-200"
                onClick={() => router.push(`/dashboard/ehr/${ehr.EHR_ID}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 mb-1">
                      Patient ID: {ehr.patient_ID}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatDateForDisplay(ehr.date)}
                    </p>
                    {ehr.diagnosis && (
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                        {ehr.diagnosis}
                      </p>
                    )}
                  </div>
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Quick Actions Section */}
      <Card>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isDoctor() && (
            <>
              <button
                onClick={() => router.push('/dashboard/supplies')}
                className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl hover:shadow-lg transition-all flex flex-col items-center justify-center gap-3"
              >
                <Package className="w-8 h-8" />
                <span className="font-semibold">New Supply Order</span>
              </button>
              <button
                onClick={() => router.push('/dashboard/supplies')}
                className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl hover:shadow-lg transition-all flex flex-col items-center justify-center gap-3"
              >
                <Package className="w-8 h-8" />
                <span className="font-semibold">Check Stock</span>
              </button>
            </>
          )}
          <button
            onClick={() => router.push('/dashboard/patients')}
            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl hover:shadow-lg transition-all flex flex-col items-center justify-center gap-3"
          >
            <Plus className="w-8 h-8" />
            <span className="font-semibold">Add Patient Record</span>
          </button>
          <button
            onClick={() => router.push('/dashboard/appointments')}
            className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white p-6 rounded-xl hover:shadow-lg transition-all flex flex-col items-center justify-center gap-3"
          >
            <Calendar className="w-8 h-8" />
            <span className="font-semibold">Schedule Follow-up</span>
          </button>
        </div>
      </Card>
    </div>
  );
}
