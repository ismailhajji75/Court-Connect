import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboardIcon,
  CalendarIcon,
  ClockIcon,
  LogOutIcon
} from 'lucide-react';

import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboardIcon },
  { id: 'evening', label: 'Evening Bookings', icon: ClockIcon },
  { id: 'availability', label: 'Manage Availability', icon: CalendarIcon }
];

// Format email to readable name
const formatUserName = (email?: string) => {
  if (!email) return 'Admin';

  const [first, last] = email.split('@')[0].split('.');
  if (!first || !last) return email;

  return `${first.charAt(0).toUpperCase()}. ${last.charAt(0).toUpperCase() + last.slice(1)}`;
};

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  // 🚫 Prevent non-admins from ever seeing the sidebar
  if (user?.role !== "ADMIN" && user?.role !== "SUPERADMIN") return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="w-64 bg-white/90 backdrop-blur border-r border-emerald-50 flex flex-col h-full shadow-lg">
      
      {/* Logo */}
      <div className="p-6 border-b border-emerald-50">
        <img src="/cc.jpg" alt="CourtConnect" className="w-full h-auto rounded-lg shadow-sm" />
      </div>

      {/* Navigation Tabs */}
      <nav className="flex-1 p-4 space-y-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors relative overflow-hidden
                ${isActive ? 'text-emerald-900' : 'text-gray-700 hover:bg-emerald-50'}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-emerald-100 rounded-lg border border-emerald-200"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}

              <Icon className="w-5 h-5 relative z-10" />
              <span className="font-medium relative z-10">{tab.label}</span>
            </motion.button>
          );
        })}
      </nav>

      {/* User Info + Logout */}
      <div className="p-4 border-t border-emerald-50">
        <div className="mb-3 px-4">
          <p className="text-sm font-medium text-[#063830]">
            {formatUserName(user?.email)}
          </p>
          <p className="text-xs text-gray-500">{user?.email}</p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOutIcon className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
