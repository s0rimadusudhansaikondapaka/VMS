import React, { useState, useEffect } from 'react';
import { verifyResetToken, resetPassword } from '../services/api';
import { KeyRound, CheckCircle2, AlertCircle, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';
import OneWorldOneFamilyLogo from '../components/OneWorldOneFamilyLogo';

export default function ResetPassword({ initialToken, onNavigateLogin }) {
  const [token, setToken] = useState(initialToken || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(!!initialToken);
  const [tokenValid, setTokenValid] = useState(!initialToken);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (initialToken) {
      setVerifying(true);
      verifyResetToken(initialToken)
        .then((res) => {
          if (res.success) {
            setTokenValid(true);
            setUserEmail(res.user?.email || '');
            setUserName(res.user?.name || '');
          } else {
            setError(res.message || 'Reset link is invalid or expired.');
          }
        })
        .catch((err) => {
          setError(err.response?.data?.message || 'Invalid or expired password reset link.');
        })
        .finally(() => setVerifying(false));
    }
  }, [initialToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token.trim()) {
      setError('Password reset token is required.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword(token.trim(), newPassword);
      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.message || 'Failed to reset password.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoLogin = () => {
    if (onNavigateLogin) {
      onNavigateLogin();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="container" style={{ maxWidth: '520px', marginTop: '2.5rem', marginBottom: '3rem' }}>
      <div className="card" style={{ padding: '2rem', borderRadius: '14px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
        
        {/* Ashram Branding Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.8rem' }}>
            <OneWorldOneFamilyLogo size={75} showText={false} />
          </div>
          <h2 style={{ color: '#4e081d', margin: '0 0 0.3rem 0', fontWeight: '800' }}>
            Set New Password
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
            Sathya Sai Grama Visitor Management System
          </p>
          {userName && (
            <div style={{ marginTop: '0.6rem', display: 'inline-block', background: '#fef3c7', color: '#92400e', padding: '0.25rem 0.8rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 'bold' }}>
              Account: {userName} ({userEmail})
            </div>
          )}
        </div>

        {verifying && (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
            <p>Verifying secure reset token...</p>
          </div>
        )}

        {success ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ width: '60px', height: '60px', background: '#dcfce7', color: '#16a34a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ color: '#15803d', marginBottom: '0.5rem' }}>Password Reset Successful!</h3>
            <p style={{ color: '#475569', fontSize: '0.92rem', marginBottom: '1.5rem' }}>
              Your account password has been updated securely. You can now log in to the VMS portal with your new password.
            </p>
            <button
              type="button"
              onClick={handleGoLogin}
              style={{ background: '#4e081d', borderColor: '#4e081d', color: '#fcb900', fontWeight: 'bold', width: '100%', padding: '0.8rem' }}
            >
              Sign In Now <ArrowRight size={18} style={{ verticalAlign: 'middle', marginLeft: '6px' }} />
            </button>
          </div>
        ) : (
          !verifying && (
            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{ background: '#fee2e2', border: '1px solid #f87171', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.2rem', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <div>{error}</div>
                </div>
              )}

              {!initialToken && (
                <label style={{ marginBottom: '1rem', display: 'block' }}>
                  <span style={{ fontWeight: '600', fontSize: '0.88rem', color: '#334155' }}>Reset Token / Code *</span>
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Paste reset token from email"
                    required
                    style={{ marginTop: '0.3rem' }}
                  />
                </label>
              )}

              <label style={{ marginBottom: '1rem', display: 'block' }}>
                <span style={{ fontWeight: '600', fontSize: '0.88rem', color: '#334155' }}>New Password (min. 6 characters) *</span>
                <div style={{ position: 'relative', marginTop: '0.3rem' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    minLength={6}
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#64748b' }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              <label style={{ marginBottom: '1.5rem', display: 'block' }}>
                <span style={{ fontWeight: '600', fontSize: '0.88rem', color: '#334155' }}>Confirm New Password *</span>
                <div style={{ position: 'relative', marginTop: '0.3rem' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    required
                    minLength={6}
                    style={{ paddingRight: '2.5rem' }}
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                style={{
                  background: '#4e081d',
                  borderColor: '#4e081d',
                  color: '#fcb900',
                  fontWeight: 'bold',
                  width: '100%',
                  padding: '0.8rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '0.95rem'
                }}
              >
                <KeyRound size={18} />
                {loading ? 'Updating Password...' : 'Save New Password'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '1.2rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  onClick={handleGoLogin}
                  className="secondary outline"
                  style={{ fontSize: '0.82rem', padding: '0.35rem 1rem', border: 'none', background: 'none', color: '#64748b', cursor: 'pointer' }}
                >
                  Return to Sign In
                </button>
              </div>
            </form>
          )
        )}
      </div>
    </div>
  );
}
