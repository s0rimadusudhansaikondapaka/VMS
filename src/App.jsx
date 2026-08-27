import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import HostDashboard from './pages/HostDashboard';
import GuardGateTerminal from './pages/GuardGateTerminal';
import SupervisorConsole from './pages/SupervisorConsole';
import SecurityHeadDashboard from './pages/SecurityHeadDashboard';
import AdminDashboard from './pages/AdminDashboard';
import GuestInviteForm from './pages/GuestInviteForm';
import PublicPassView from './pages/PublicPassView';
import { getMe } from './services/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const params = new URLSearchParams(window.location.search);
  const passCodeFromUrl = params.get('pass') || (window.location.pathname.startsWith('/pass/') ? window.location.pathname.replace('/pass/', '') : null);
  const isInviteRoute = window.location.search.includes('invite') || window.location.search.includes('host_id') || window.location.pathname.includes('/invite');

  useEffect(() => {
    const token = localStorage.getItem('vms_token');
    if (token) {
      getMe()
        .then((res) => {
          if (res.success) setUser(res.user);
        })
        .catch(() => {
          localStorage.removeItem('vms_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('vms_token');
    setUser(null);
  };

  if (passCodeFromUrl) {
    return (
      <div>
        <Navbar user={user} onLogout={handleLogout} />
        <PublicPassView passCode={passCodeFromUrl} />
      </div>
    );
  }

  if (isInviteRoute) {
    return (
      <div>
        <Navbar user={user} onLogout={handleLogout} />
        <GuestInviteForm />
      </div>
    );
  }

  if (loading) {
    return <div className="container" style={{ marginTop: '5rem', textAlign: 'center' }}>Loading VMS Application...</div>;
  }

  if (!user) {
    return <Login onLoginSuccess={(userData) => setUser(userData)} />;
  }

  const renderDashboardByRole = () => {
    switch (user.role) {
      case 'ADMIN':
        return <AdminDashboard user={user} />;
      case 'GUARD':
        return <GuardGateTerminal user={user} />;
      case 'SUPERVISOR':
        return <SupervisorConsole user={user} />;
      case 'SECURITY_HEAD':
        return <SecurityHeadDashboard user={user} />;
      case 'RESIDENT':
      case 'EMPLOYEE':
      case 'HOD':
      default:
        return <HostDashboard user={user} />;
    }
  };

  return (
    <div>
      <Navbar user={user} onLogout={handleLogout} />
      {renderDashboardByRole()}
    </div>
  );
}
