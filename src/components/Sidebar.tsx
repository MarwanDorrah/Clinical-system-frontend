'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';
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
  ChevronRight,
  History
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { logout, isDoctor, userName, userRole } = useAuth();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const autoHideTimerRef = useRef<NodeJS.Timeout | null>(null);

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
      name: 'Transaction History',
      href: '/dashboard/history',
      icon: History,
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

  useEffect(() => {
    const handleMouseEnter = () => {
      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current);
      }
      if (!isOpen) {
        onToggle();
      }
    };

    const handleMouseLeave = () => {
      autoHideTimerRef.current = setTimeout(() => {
        if (isOpen) {
          onToggle();
        }
      }, 300);
    };

    const sidebar = sidebarRef.current;
    if (sidebar) {
      sidebar.addEventListener('mouseenter', handleMouseEnter);
      sidebar.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (sidebar) {
        sidebar.removeEventListener('mouseenter', handleMouseEnter);
        sidebar.removeEventListener('mouseleave', handleMouseLeave);
      }
      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current);
      }
    };
  }, [isOpen, onToggle]);

  return (
    <>
      <aside
        ref={sidebarRef}
        className={`fixed left-0 top-0 h-screen bg-white text-gray-800 transition-all duration-300 z-40 shadow-sm ${
          isOpen ? 'w-64' : 'w-0 md:w-20'
        }`}
      >
        <div className="flex flex-col h-full w-full overflow-hidden">
          <div className="flex items-center justify-center py-6 flex-shrink-0">
            <div className="relative group">
              <Link
                href="/dashboard"
                className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${
                  isActive('/dashboard') && pathname === '/dashboard'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <LayoutDashboard className="w-6 h-6" />
              </Link>
              {!isOpen && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap pointer-events-none z-50 shadow-lg">
                  Dashboard
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                </div>
              )}
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-2">
            <ul className="space-y-3">
              {filteredItems.slice(1).map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <li key={item.name}>
                    <div className="relative group">
                      <Link
                        href={item.href}
                        className={`flex items-center gap-4 transition-all duration-200 ${
                          isOpen ? 'justify-start' : 'justify-center'
                        }`}
                      >
                        <div
                          className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 flex-shrink-0 ${
                            active
                              ? 'bg-gray-900 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                        {isOpen && (
                          <span
                            className={`font-medium text-sm whitespace-nowrap transition-colors ${
                              active ? 'text-gray-900' : 'text-gray-600 group-hover:text-gray-900'
                            }`}
                          >
                            {item.name}
                          </span>
                        )}
                      </Link>
                      {!isOpen && (
                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap pointer-events-none z-50 shadow-lg">
                          {item.name}
                          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="px-4 py-3 flex-shrink-0">
            <div className={`flex items-center gap-4 relative group ${isOpen ? 'justify-start' : 'justify-center'}`}>
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center font-semibold text-gray-700 flex-shrink-0">
                {userName?.charAt(0).toUpperCase() || 'U'}
              </div>
              {isOpen && (
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {userName || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {userRole || 'Role'}
                  </p>
                </div>
              )}
              {!isOpen && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap pointer-events-none z-50 shadow-lg">
                  {userName || 'User'}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                </div>
              )}
            </div>
          </div>

          <div className="px-4 pb-6 pt-2">
            <div className="relative group">
              <button
                onClick={handleLogout}
                className={`flex items-center gap-4 transition-all duration-200 w-full ${
                  isOpen ? 'justify-start' : 'justify-center'
                }`}
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200 flex-shrink-0">
                  <LogOut className="w-6 h-6" />
                </div>
                {isOpen && (
                  <span className="font-medium text-sm text-gray-600 group-hover:text-red-600 whitespace-nowrap">
                    Logout
                  </span>
                )}
              </button>
              {!isOpen && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap pointer-events-none z-50 shadow-lg">
                  Logout
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

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
