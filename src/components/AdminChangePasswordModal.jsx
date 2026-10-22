import React, { useState } from 'react';
import { adminChangePassword, adminSendResetLink } from '../services/api';
import { KeyRound, Mail, Copy, Check, X, AlertCircle, CheckCircle2, RefreshCw, Send, ShieldAlert } from 'lucide-react';

export default function AdminChangePasswordModal({ isOpen, user: targetUser, onClose, onSuccess }) {
  const [activeTab, setActiveTab] = useState('direct'); // 'direct' | 'reset_link'
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generatedResetUrl, setGeneratedResetUrl] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !targetUser) return null;

  const handleGenerateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
  };

  const handleDirectChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await adminChangePassword(targetUser.id, newPassword);
      if (res.success) {
        setSuccess(`Password for ${targetUser.name} successfully updated!`);
        if (onSuccess) onSuccess();
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setError(res.message || 'Failed to update user password.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server error updating password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetLink = async () => {
    setError('');
    setSuccess('');
    setGeneratedResetUrl('');
    setLoading(true);

    try {
      const res = await adminSendResetLink(targetUser.id);
      if (res.success) {
        setSuccess(res.message || 'Password reset link generated and dispatched successfully!');
        if (res.reset_url) {
          setGeneratedResetUrl(res.reset_url);
        }
        if (onSuccess) onSuccess();
      } else {
        setError(res.message || 'Failed to generate reset link.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server error generating reset link.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!generatedResetUrl) return;
    navigator.clipboard.writeText(generatedResetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleClose = () => {
    setError('');
    setSuccess('');
    setNewPassword('');
    setGeneratedResetUrl('');
    setCopied(false);
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
        maxWidth: '520px',
        width: '100%',
        boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: '#4e081d',
          color: '#ffffff',
          padding: '1.1rem 1.4rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '3px solid #df6f06'
        }}>
          <div>
            <h4 style={{ margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 'bold' }}>
              <KeyRound size={20} color="#fcb900" /> Admin Password Control
            </h4>
            <div style={{ fontSize: '0.78rem', color: '#fcb900', marginTop: '0.2rem' }}>
              User: <strong>{targetUser.name}</strong> ({targetUser.email || targetUser.phone || `ID #${targetUser.id}`})
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '0.2rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab selection */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <button
            type="button"
            onClick={() => setActiveTab('direct')}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: 'none',
              background: activeTab === 'direct' ? '#ffffff' : 'transparent',
              borderBottom: activeTab === 'direct' ? '3px solid #4e081d' : '3px solid transparent',
              color: activeTab === 'direct' ? '#4e081d' : '#64748b',
              fontWeight: 'bold',
              fontSize: '0.86rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem'
            }}
          >
            <KeyRound size={16} /> Set Password Directly
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reset_link')}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: 'none',
              background: activeTab === 'reset_link' ? '#ffffff' : 'transparent',
              borderBottom: activeTab === 'reset_link' ? '3px solid #4e081d' : '3px solid transparent',
              color: activeTab === 'reset_link' ? '#4e081d' : '#64748b',
              fontWeight: 'bold',
              fontSize: '0.86rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem'
            }}
          >
            <Send size={16} /> Send Reset Link Email
          </button>
        </div>

        <div style={{ padding: '1.4rem' }}>
          {error && (
            <div style={{ background: '#fee2e2', border: '1px solid #f87171', color: '#991b1b', padding: '0.7rem 0.9rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div>{error}</div>
            </div>
          )}

          {success && (
            <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '0.7rem 0.9rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <div>{success}</div>
            </div>
          )}

          {activeTab === 'direct' ? (
            <form onSubmit={handleDirectChange}>
              <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '0 0 1rem 0', lineHeight: 1.4 }}>
                As System Administrator, you can override and immediately set a new password for <strong>{targetUser.name}</strong> without requiring their current password.
              </p>

              <label style={{ marginBottom: '1.2rem', display: 'block' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <span style={{ fontWeight: '600', fontSize: '0.85rem', color: '#334155' }}>New Password (min 6 chars) *</span>
                  <button
                    type="button"
                    onClick={handleGenerateRandomPassword}
                    style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.76rem', fontWeight: 'bold', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                  >
                    <RefreshCw size={12} /> Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter or generate new password"
                  required
                  minLength={6}
                />
              </label>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
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
                  {loading ? 'Updating Password...' : 'Save New Password'}
                </button>
              </div>
            </form>
          ) : (
            <div>
              <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '0 0 1rem 0', lineHeight: 1.4 }}>
                Dispatch a secure 1-hour password reset link to <strong>{targetUser.email || 'the user'}</strong>. The user can click the link in their email to create a new password.
              </p>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', marginBottom: '1.2rem' }}>
                <div style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '0.3rem' }}>
                  <strong>Recipient Email:</strong> {targetUser.email || <span style={{ color: '#dc2626' }}>No email registered</span>}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                  <strong>User Role & Type:</strong> {targetUser.role} ({targetUser.user_type || 'RESIDENT'})
                </div>
              </div>

              {generatedResetUrl && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '1rem', marginBottom: '1.2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#92400e' }}>Generated Password Reset Link:</span>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      style={{
                        background: copied ? '#15803d' : '#2563eb',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '0.74rem',
                        fontWeight: 'bold',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy Link</>}
                    </button>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={generatedResetUrl}
                    style={{ fontSize: '0.78rem', background: '#ffffff', color: '#1e293b', marginBottom: 0 }}
                  />
                  <small style={{ color: '#78716c', fontSize: '0.72rem', display: 'block', marginTop: '0.3rem' }}>
                    You can copy this link and share it directly via WhatsApp, SMS, or Slack.
                  </small>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={handleClose}
                  className="secondary outline"
                  style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSendResetLink}
                  disabled={loading}
                  style={{
                    background: '#df6f06',
                    borderColor: '#df6f06',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    padding: '0.5rem 1.2rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Mail size={15} />
                  {loading ? 'Dispatching Link...' : 'Dispatch Reset Link Email'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
