'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Package,
  UserCog,
  Stethoscope,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { logout, isDoctor, userName, userRole } = useAuth();

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['Doctor', 'Nurse']
    },
    {
      name: 'Patients',
      href: '/dashboard/patients',
      icon: Users,
      roles: ['Doctor', 'Nurse']
    },
    {
      name: 'Appointments',
      href: '/dashboard/appointments',
      icon: Calendar,
      roles: ['Doctor', 'Nurse']
    },
    {
      name: 'EHR Records',
      href: '/dashboard/ehr',
      icon: FileText,
      roles: ['Doctor', 'Nurse']
    },
    {
      name: 'Stock & Inventory',
      href: '/dashboard/supplies',
      icon: Package,
      roles: ['Doctor']
    },
    {
      name: 'Nurses',
      href: '/dashboard/nurses',
      icon: UserCog,
      roles: ['Doctor']
    },
    {
      name: 'Doctors',
      href: '/dashboard/doctors',
      icon: Stethoscope,
      roles: ['Doctor']
    }
  ];

  // Filter navigation items based on user role
  const filteredItems = navigationItems.filter(item => 
    item.roles.includes(userRole || '')
  );

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white transition-all duration-300 z-40 border-r border-slate-700 shadow-2xl ${
          isOpen ? 'w-64' : 'w-0 md:w-20'
        }`}
      >
        {/* Toggle Button */}
        <button
          onClick={onToggle}
          className="hidden md:block absolute -right-3 top-6 bg-slate-700 hover:bg-slate-600 rounded-full p-1.5 shadow-lg transition-all duration-200 border border-slate-600 z-50"
          aria-label="Toggle Sidebar"
        >
          {isOpen ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-6 border-b border-slate-700 bg-slate-900/50 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-white text-xl font-bold">∴</span>
              </div>
              {isOpen && (
                <div className="min-w-0">
                  <h1 className="text-lg font-bold text-white truncate">
                    Dental Clinic
                  </h1>
                  <p className="text-xs text-slate-400 truncate">
                    Management System
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* User Info */}
          {isOpen && (
            <div className="px-6 py-4 bg-slate-800/30 border-b border-slate-700 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 flex items-center justify-center font-semibold text-slate-900 flex-shrink-0">
                  {userName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">
                    {userName || 'User'}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {userRole || 'Role'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-3 scrollbar-thin">
            <ul className="space-y-1">
              {filteredItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                        active
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/50'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                      title={!isOpen ? item.name : undefined}
                    >
                      <Icon
                        className={`w-5 h-5 flex-shrink-0 ${
                          active ? 'text-white' : 'text-slate-400 group-hover:text-white'
                        }`}
                      />
                      {isOpen && (
                        <span className="font-medium whitespace-nowrap">
                          {item.name}
                        </span>
                      )}
                      {active && isOpen && (
                        <div className="ml-auto w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Divider */}
          <div className="border-t border-slate-700 mx-3"></div>

          {/* Logout */}
          <div className="p-3 pb-6">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-300 hover:bg-red-900/30 hover:text-red-400 transition-all duration-200 w-full group"
              title={!isOpen ? 'Logout' : undefined}
            >
              <LogOut className="w-5 h-5 flex-shrink-0 text-slate-400 group-hover:text-red-400" />
              {isOpen && (
                <span className="font-medium whitespace-nowrap">Logout</span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile - improved touch handling */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={onToggle}
          aria-label="Close sidebar"
        />
      )}
    </>
  );
}
