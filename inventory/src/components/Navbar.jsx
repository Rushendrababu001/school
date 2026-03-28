import React from 'react';
import { NavLink } from 'react-router-dom';

const menuItems = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/devices', label: 'Devices', icon: '🖥️' },
  { to: '/tickets', label: 'Tickets', icon: '🎫' },
  { to: '/activities', label: 'Activity Logs', icon: '📝' },
];

export default function Navbar({ darkMode, setDarkMode }) {
  return (
    <aside className="w-64 h-screen fixed bg-white/90 dark:bg-slate-900/90 backdrop-blur border-r border-slate-200 dark:border-slate-700 shadow-sm z-10">
      <div className="px-5 py-5 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-2xl font-black text-blue-600 dark:text-cyan-300">📦 IT Inventory</h2>
        <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">School tracking panel</p>
      </div>

      <nav className="mt-6 px-2 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium ${
                isActive
                  ? 'bg-blue-100 text-blue-700 dark:bg-cyan-800 dark:text-cyan-100'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="absolute bottom-0 w-full px-5 py-4 border-t border-slate-200 dark:border-slate-700">
        <button
          className="w-full btn-secondary text-sm"
          onClick={() => setDarkMode(!darkMode)}
          aria-label="Toggle theme"
        >
          {darkMode ? '☀️ Light mode' : '🌙 Dark mode'}
        </button>
      </div>
    </aside>
  );
}
