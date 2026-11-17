import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Users,
  BarChart3,
  Settings,
  Shield,
  Bell,
  Archive,
  LogOut,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  isMobile?: boolean;
  isMobileOpen?: boolean;
  onNavigate?: () => void;
}

const menuItems = [
  { title: 'Dashboard', icon: BarChart3, href: '/dashboard', permission: 'dashboard.view' },
  { title: 'Traders', icon: Users, href: '/traders', permission: 'traders.read' },
  // { title: 'Finance', icon: BarChart3, href: '/finance', permission: 'payments.read' },
  // { title: 'Inspections', icon: Shield, href: '/inspections', permission: 'inspections.read' },
  // { title: 'Complaints', icon: MessageSquare, href: '/complaints', permission: 'complaints.read' },
  { title: 'Digital Archive', icon: Archive, href: '/archive', permission: 'documents.read' },
  { title: 'Reports', icon: BarChart3, href: '/reports', permission: 'reports.read' },
  { title: 'Notifications', icon: Bell, href: '/notifications', permission: 'dashboard.view' },
];

const adminItems = [
  {
    title: 'User Management',
    icon: Shield,
    href: '/admin/users',
    permission: 'users.read',
  },
  {
    title: 'System Settings',
    icon: Settings,
    href: '/admin/settings',
    permission: 'settings.read',
  },
];

const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  isMobile = false,
  isMobileOpen = false,
  onNavigate,
}) => {
  const { user, logout, hasPermission } = useAuth();
  const showLabels = isMobile || !isCollapsed;

  const filteredMenuItems = menuItems.filter(
    (item) =>
      hasPermission(item.permission) ||
      (item.href === '/finance' && hasPermission('finance.read')) ||
      (item.href === '/admin/users' && hasPermission('roles.read')),
  );

  const filteredAdminItems = adminItems.filter(
    (item) =>
      hasPermission(item.permission) ||
      (item.href === '/finance' && hasPermission('finance.read')) ||
      (item.href === '/admin/users' && hasPermission('roles.read')),
  );

  return (
    <aside
      className={[
        'bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out flex flex-col',
        isMobile
          ? `fixed inset-y-0 left-0 z-50 w-64 max-w-[85vw] ${
              isMobileOpen ? 'translate-x-0' : '-translate-x-full'
            }`
          : `${isCollapsed ? 'w-16' : 'w-64'} relative h-full shrink-0`,
      ].join(' ')}
      aria-hidden={isMobile ? !isMobileOpen : false}
    >
      {/* Logo */}
      <div className="border-b border-gray-200 p-4">
        <div
          className={`flex items-center ${
            showLabels ? 'space-x-3' : 'justify-center'
          }`}
        >
          <img
            src="/logo-chiro-192.png"
            alt="Chiro City Administration"
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
          {showLabels && (
            <div>
              <h1 className="text-lg font-bold text-gray-900">Chiro City</h1>
              <p className="text-xs text-gray-500">Trade & Business Mngt</p>
            </div>
          )}
        </div>
      </div>

      {/* User Info */}
      {showLabels && user && (
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-cyan-500">
              <span className="text-sm font-medium text-white">
                {user.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">
                {user.name}
              </p>
              <p className="truncate text-xs text-gray-500">{user.email}</p>
              <span className="mt-1 inline-flex items-center rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                {user.role.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-r-2 border-blue-700 bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${showLabels ? '' : 'justify-center'}`
                }
              >
                <Icon className={`h-5 w-5 ${showLabels ? 'mr-3' : ''}`} />
                {showLabels && (
                  <>
                    {item.title}
                    <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                  </>
                )}
              </NavLink>
            );
          })}

          {filteredAdminItems.length > 0 && (
            <>
              <Separator className="my-3" />
              <div
                className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 ${
                  showLabels ? '' : 'text-center'
                }`}
              >
                {showLabels ? 'Admin' : 'A'}
              </div>
              {filteredAdminItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'border-r-2 border-red-700 bg-red-50 text-red-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } ${showLabels ? '' : 'justify-center'}`
                    }
                  >
                    <Icon className={`h-5 w-5 ${showLabels ? 'mr-3' : ''}`} />
                    {showLabels && (
                      <>
                        {item.title}
                        <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                      </>
                    )}
                  </NavLink>
                );
              })}
            </>
          )}
        </nav>
      </ScrollArea>

      {/* Logout Button */}
      <div className="border-t border-gray-200 p-3">
        <Button
          variant="ghost"
          className={`w-full text-red-600 hover:bg-red-50 hover:text-red-700 ${
            showLabels ? 'justify-start' : 'px-2'
          }`}
          onClick={() => {
            onNavigate?.();
            logout();
          }}
        >
          <LogOut className={`h-5 w-5 ${showLabels ? 'mr-3' : ''}`} />
          {showLabels && 'Logout'}
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
