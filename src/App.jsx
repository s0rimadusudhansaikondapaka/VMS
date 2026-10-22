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
import ResetPassword from './pages/ResetPassword';
import ChangePasswordModal from './components/ChangePasswordModal';
import { getMe } from './services/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const passCodeFromUrl = params.get('pass') || (window.location.pathname.startsWith('/pass/') ? window.location.pathname.replace('/pass/', '') : null);
  const inviteParam = params.get('invite');
  const tokenParam = params.get('token');
  const hostIdParam = params.get('host_id');

  // Issue #40: Strict route matching - ?invite=false must NOT load the guest invite form
  const isInviteRoute = inviteParam === 'true' || (inviteParam !== 'false' && (window.location.pathname.startsWith('/invite') || (tokenParam && tokenParam.startsWith('inv')) || (hostIdParam && hostIdParam !== '1')));
  
  const resetTokenFromUrl = params.get('reset_token') || (inviteParam !== 'true' && tokenParam && !tokenParam.startsWith('inv') ? tokenParam : '');
  const isResetPasswordRoute = window.location.pathname.includes('/reset-password') || (inviteParam !== 'true' && (params.has('reset_token') || (params.has('token') && !tokenParam?.startsWith('inv'))));

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
        <Navbar user={null} onLogout={handleLogout} />
        <PublicPassView passCode={passCodeFromUrl} />
      </div>
    );
  }

  if (isInviteRoute) {
    return (
      <div>
        <Navbar user={null} onLogout={handleLogout} />
        <GuestInviteForm />
      </div>
    );
  }

  if (isResetPasswordRoute) {
    return (
      <div>
        <Navbar user={null} onLogout={handleLogout} />
        <ResetPassword
          initialToken={resetTokenFromUrl}
          onNavigateLogin={() => {
            window.location.href = '/';
          }}
        />
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
      <Navbar user={user} onLogout={handleLogout} onChangePassword={() => setIsChangePasswordOpen(true)} />
      {renderDashboardByRole()}
      <ChangePasswordModal isOpen={isChangePasswordOpen} onClose={() => setIsChangePasswordOpen(false)} />
    </div>
  );
}
