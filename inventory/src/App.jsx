import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import Tickets from './pages/Tickets';
import ActivityLogs from './pages/ActivityLogs';
import './App.css';

function App() {
  const [darkMode, setDarkMode] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('theme');
      return saved === 'dark';
    }
    return false;
  });

  React.useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      window.localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      window.localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <Router>
      <div className={`min-h-screen bg-[radial-gradient(circle_at_top,_#e6efff,_#f5f7ff)] transition-colors duration-500 ${darkMode ? 'bg-[radial-gradient(circle_at_top,_#0f172a,_#0b1122)] text-slate-100' : ''}`}>
        <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
        <main className="ml-64 p-6 space-y-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/devices" element={<Devices />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/activities" element={<ActivityLogs />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
