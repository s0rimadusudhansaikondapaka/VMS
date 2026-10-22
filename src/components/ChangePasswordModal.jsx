import React, { useState } from 'react';
import { changePassword } from '../services/api';
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, X, Lock } from 'lucide-react';

export default function ChangePasswordModal({ isOpen, onClose }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword) {
      setError('Current password is required.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      if (res.success) {
        setSuccess('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          onClose();
          setSuccess('');
        }, 1800);
      } else {
        setError(res.message || 'Failed to update password.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server error updating password.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setSuccess('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '1rem',
      backdropFilter: 'blur(3px)'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '14px',
        maxWidth: '460px',
        width: '100%',
        boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
        overflow: 'hidden'
      }}>
        <div style={{
          background: '#4e081d',
          color: '#ffffff',
          padding: '1rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '3px solid #df6f06'
        }}>
          <h4 style={{ margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem', fontWeight: 'bold' }}>
            <KeyRound size={20} color="#fcb900" /> Change My Password
          </h4>
          <button
            onClick={handleClose}
            style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '0.2rem' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          {error && (
            <div style={{ background: '#fee2e2', border: '1px solid #f87171', color: '#991b1b', padding: '0.65rem 0.9rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={17} style={{ flexShrink: 0 }} />
              <div>{error}</div>
            </div>
          )}

          {success && (
            <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '0.65rem 0.9rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={17} style={{ flexShrink: 0 }} />
              <div>{success}</div>
            </div>
          )}

          <label style={{ marginBottom: '1rem', display: 'block' }}>
            <span style={{ fontWeight: '600', fontSize: '0.85rem', color: '#334155' }}>Current Password *</span>
            <div style={{ position: 'relative', marginTop: '0.3rem' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                required
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#64748b' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <label style={{ marginBottom: '1rem', display: 'block' }}>
            <span style={{ fontWeight: '600', fontSize: '0.85rem', color: '#334155' }}>New Password (min 6 chars) *</span>
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
            </div>
          </label>

          <label style={{ marginBottom: '1.4rem', display: 'block' }}>
            <span style={{ fontWeight: '600', fontSize: '0.85rem', color: '#334155' }}>Confirm New Password *</span>
            <div style={{ position: 'relative', marginTop: '0.3rem' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
                minLength={6}
                style={{ paddingRight: '2.5rem' }}
              />
            </div>
          </label>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleClose}
              className="secondary outline"
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: '#4e081d',
                borderColor: '#4e081d',
                color: '#fcb900',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                padding: '0.5rem 1.2rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              <KeyRound size={15} />
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
