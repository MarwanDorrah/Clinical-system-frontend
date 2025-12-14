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
  const [notifications, setNotifications] = useState<Array<{id: number, type: string, message: string, time: string}>>([]);

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
      
      // For debugging: temporarily show all appointments if none match today
      const todayDate = new Date();
      const todayISO = todayDate.toISOString().split('T')[0];
      
      let todayAppts = appointments.filter((apt) => {
        if (!apt.date) return false;
        let aptDate = typeof apt.date === 'string' ? apt.date.split('T')[0].trim() : apt.date;
        return aptDate === todayISO;
      });
      
      // If no appointments for today, show next upcoming appointments
      if (todayAppts.length === 0 && appointments.length > 0) {
        // Get upcoming appointments (sorted by date and time)
        const upcoming = appointments
          .filter(apt => apt.date)
          .sort((a, b) => {
            const dateA = new Date(a.date + ' ' + a.time);
            const dateB = new Date(b.date + ' ' + b.time);
            return dateA.getTime() - dateB.getTime();
          })
          .slice(0, 6); // Show first 6 upcoming appointments
        todayAppts = upcoming;
      }
      
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
        weekAppts[dayName] = appointments.filter(apt => {
          if (!apt.date) return false;
          let aptDate = typeof apt.date === 'string' ? apt.date.split('T')[0].trim() : apt.date;
          return aptDate === dateStr;
        });
      }

      // Fetch recent EHRs
      let recentRecords: any[] = [];
      try {
        const allEHRs = await ehrService.getAllEHRs();
        recentRecords = Array.isArray(allEHRs) ? allEHRs.slice(0, 5) : [];
      } catch (error) {
        console.error('Error fetching EHRs:', error);
      }

      // Fetch low stock and out of stock supplies (if doctor)
      let lowStock: Supply[] = [];
      let outOfStock: Supply[] = [];
      if (isDoctor()) {
        try {
          // Fetch all supplies to check for out of stock
          const allSupplies = await supplyService.getAllSupplies() as Supply[];
          
          // Filter out of stock items (quantity = 0)
          outOfStock = allSupplies.filter(supply => supply.quantity <= 0);
          
          // Fetch low stock items (exclude out of stock items)
          const allLowStock = await supplyService.getLowStock(10) as Supply[];
          lowStock = allLowStock.filter(supply => supply.quantity > 0);
        } catch (error) {
          console.error('Error fetching supplies:', error);
        }
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

      // Generate notifications (only for stock-related items)
      const notifs: Array<{id: number, type: string, message: string, time: string}> = [];

      // Low stock alerts (only for doctors)
      if (isDoctor() && lowStock.length > 0) {
        notifs.push({
          id: 1,
          type: 'warning',
          message: `${lowStock.length} supply item${lowStock.length > 1 ? 's' : ''} running low on stock`,
          time: 'Now'
        });
      }

      // Out of stock alerts (only for doctors)
      if (isDoctor() && outOfStock.length > 0) {
        notifs.push({
          id: 2,
          type: 'error',
          message: `${outOfStock.length} supply item${outOfStock.length > 1 ? 's are' : ' is'} out of stock`,
          time: 'Urgent'
        });
      }

      setNotifications(notifs);
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
        </div>
      </div>

      {/* Notifications Section */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`flex items-center justify-between px-4 py-2 rounded-lg border ${
                notif.type === 'error'
                  ? 'bg-red-50 border-red-200'
                  : notif.type === 'warning'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-center gap-3">
                {notif.type === 'error' ? (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                ) : notif.type === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                ) : (
                  <Bell className="w-4 h-4 text-blue-600" />
                )}
                <span className="text-sm font-medium text-gray-900">{notif.message}</span>
              </div>
              <span className={`text-xs font-medium ${
                notif.type === 'error' ? 'text-red-600' : 'text-gray-500'
              }`}>
                {notif.time}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Calendar (Appointments) Section */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Calendar className="w-6 h-6 mr-3 text-blue-600" />
            {stats.todayAppointments > 0 ? "Today's Appointments" : "Upcoming Appointments"}
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
            <p className="text-gray-500 text-lg">No appointments found</p>
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
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDateForDisplay(appointment.date)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
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
                onClick={() => router.push('/dashboard/supplies?action=add')}
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
            onClick={() => router.push('/dashboard/ehr/new')}
            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl hover:shadow-lg transition-all flex flex-col items-center justify-center gap-3"
          >
            <Plus className="w-8 h-8" />
            <span className="font-semibold">Add Patient Record</span>
          </button>
          <button
            onClick={() => router.push('/dashboard/appointments?action=add')}
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
