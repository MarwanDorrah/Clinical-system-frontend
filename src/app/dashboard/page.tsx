'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { patientService, appointmentService, supplyService } from '@/services';
import { Appointment, Supply } from '@/types/api.types';
import { formatDateForDisplay, formatTimeForDisplay } from '@/utils/date.utils';
import { Users, Calendar, Clock, Package, AlertTriangle, TrendingUp, ChevronRight, CheckCircle } from 'lucide-react';

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
  const [lowStockSupplies, setLowStockSupplies] = useState<Supply[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

      // Fetch low stock supplies (if doctor)
      let lowStock: Supply[] = [];
      if (isDoctor()) {
        lowStock = await supplyService.getLowStock(10) as Supply[];
      }
      
      setTodayAppointments(sortedTodayAppts);
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
      {/* Welcome Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Welcome back, {userName}!
        </h1>
        <p className="text-gray-600 mt-2">{getCurrentDate()}</p>
      </div>

      {/* Low Stock Alert Banner (Doctor only) */}
      {isDoctor() && stats.lowStockItems > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-yellow-900">
                Low Stock Alert
              </h3>
              <p className="text-sm text-yellow-800 mt-1">
                {stats.lowStockItems} {stats.lowStockItems === 1 ? 'supply item is' : 'supply items are'} running low on stock.
              </p>
              {lowStockSupplies.length > 0 && (
                <div className="mt-2 space-y-1">
                  {lowStockSupplies.map(supply => (
                    <p key={supply.supply_ID} className="text-xs text-yellow-700">
                      • {supply.supply_Name}: {supply.quantity} {supply.unit} remaining
                    </p>
                  ))}
                </div>
              )}
              <Button
                size="sm"
                variant="secondary"
                className="mt-3"
                onClick={() => router.push('/dashboard/supplies')}
              >
                View Supplies
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Today's Appointments */}
        <Card hoverable>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Today's Appointments</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.todayAppointments}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.completedToday} completed
              </p>
            </div>
            <div className="bg-primary-100 p-3 rounded-lg">
              <Calendar className="w-8 h-8 text-primary-600" />
            </div>
          </div>
        </Card>

        {/* Total Patients */}
        <Card hoverable>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Patients</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalPatients}</p>
              <p className="text-xs text-success-600 mt-1 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                Active records
              </p>
            </div>
            <div className="bg-success-100 p-3 rounded-lg">
              <Users className="w-8 h-8 text-success-600" />
            </div>
          </div>
        </Card>

        {/* Total Appointments */}
        <Card hoverable>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Appointments</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalAppointments}</p>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </div>
            <div className="bg-info-100 p-3 rounded-lg">
              <Clock className="w-8 h-8 text-info-600" />
            </div>
          </div>
        </Card>

        {/* Low Stock Alert (Doctor only) */}
        {isDoctor() && (
          <Card hoverable>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Low Stock Items</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.lowStockItems}</p>
                {stats.lowStockItems > 0 && (
                  <p className="text-xs text-warning-600 mt-1 flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Needs attention
                  </p>
                )}
              </div>
              <div className={`${stats.lowStockItems > 0 ? 'bg-warning-100' : 'bg-gray-100'} p-3 rounded-lg`}>
                <Package className={`w-8 h-8 ${stats.lowStockItems > 0 ? 'text-warning-600' : 'text-gray-600'}`} />
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Today's Schedule - Takes 2 columns */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-primary-600" />
                Today's Schedule
              </h2>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push('/dashboard/appointments')}
              >
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {todayAppointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No appointments scheduled for today</p>
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
              <div className="space-y-3">
                {todayAppointments.map((appointment) => {
                  const status = getAppointmentStatus(appointment);
                  return (
                    <div
                      key={appointment.appointment_ID}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => router.push('/dashboard/appointments')}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-900">
                            {appointment.time.substring(0, 5)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {status === 'completed' ? 'Done' : status === 'in-progress' ? 'Now' : 'Upcoming'}
                          </p>
                        </div>
                        <div className="h-12 w-px bg-gray-300"></div>
                        <div>
                          <p className="font-semibold text-gray-900">{appointment.type}</p>
                          <p className="text-sm text-gray-600">Ref: {appointment.ref_Num}</p>
                        </div>
                      </div>
                      <div>
                        {status === 'completed' && (
                          <Badge variant="success" size="sm">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                        {status === 'in-progress' && (
                          <Badge variant="warning" size="sm">
                            <Clock className="w-3 h-3 mr-1" />
                            In Progress
                          </Badge>
                        )}
                        {status === 'upcoming' && (
                          <Badge variant="info" size="sm">
                            Upcoming
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar - Takes 1 column */}
        <div className="space-y-6">
          {/* Low Stock Alerts (Doctor only) */}
          {isDoctor() && lowStockSupplies.length > 0 && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-warning-600" />
                  Low Stock Alerts
                </h2>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push('/dashboard/supplies')}
                >
                  View All
                </Button>
              </div>
              <div className="space-y-2">
                {lowStockSupplies.map((supply) => (
                  <div
                    key={supply.supply_ID}
                    className="flex items-center justify-between p-3 bg-warning-50 rounded-lg border border-warning-200"
                  >
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{supply.supply_Name}</p>
                      <p className="text-xs text-gray-600">{supply.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-warning-700">{supply.quantity}</p>
                      <p className="text-xs text-gray-600">{supply.unit}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Button
                variant="primary"
                className="w-full justify-start"
                onClick={() => router.push('/dashboard/appointments')}
              >
                <Calendar className="w-4 h-4 mr-2" />
                New Appointment
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={() => router.push('/dashboard/patients')}
              >
                <Users className="w-4 h-4 mr-2" />
                Add Patient
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={() => router.push('/dashboard/ehr')}
              >
                <Package className="w-4 h-4 mr-2" />
                Create EHR
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
