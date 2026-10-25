import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  CalendarDays,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getTodayDateString } from '../../utils/dateUtils';
import { getEffectiveStatus } from '../../utils/taskUtils';

export function MobileNavigation() {
  const { tasks } = useApp();

  const todayStr = getTodayDateString();
  const todayTasks = tasks.filter((t) => t.date === todayStr);
  const pendingCount = todayTasks.filter((t) => getEffectiveStatus(t) !== 'completed').length;

  const items = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Today', path: '/today', icon: CheckSquare, badge: pendingCount > 0 ? pendingCount : null },
    { name: 'Monthly', path: '/monthly', icon: CalendarDays },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={20} />
              {item.badge && (
                <span className="mobile-nav-badge">{item.badge}</span>
              )}
            </div>
            <span className="mobile-nav-label">{item.name}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
