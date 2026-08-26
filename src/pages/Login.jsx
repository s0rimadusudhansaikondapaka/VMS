import React, { useState } from 'react';
import { loginUser, sendOtp as sendOtpApi, verifyOtp as verifyOtpApi, registerUser } from '../services/api';
import { Phone, Mail, UserPlus, KeyRound, Shield } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState('email');
  
  // Email login state
  const [email, setEmail] = useState('resident1@ashram.org');
  const [password, setPassword] = useState('password123');
  
  // Phone/OTP login state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState('');
  
  // Register state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError(''); setMsg('');
    setLoading(true);
    try {
      const data = await loginUser(email, password);
      if (data.success) {
        localStorage.setItem('vms_token', data.token);
        onLoginSuccess(data.user);
      } else {
        setError(data.message || 'Login failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError(''); setMsg('');
    if (!phone.trim()) { setError('Phone number is required.'); return; }
    setLoading(true);
    try {
      const data = await sendOtpApi(phone);
      if (data.success) {
        setOtpSent(true);
        if (data.dev_otp) setDevOtp(data.dev_otp);
        if (!data.user_exists) {
          setMsg('Phone not registered. Please register first.');
          setActiveTab('register');
          setRegPhone(phone);
        } else {
          setMsg('OTP sent to your phone. Check console for dev OTP.');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(''); setMsg('');
    setLoading(true);
    try {
      const data = await verifyOtpApi(phone, otp);
      if (data.success) {
        localStorage.setItem('vms_token', data.token);
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); setMsg('');
    setLoading(true);
    try {
      const data = await registerUser({ full_name: regName, phone: regPhone, email: regEmail });
      if (data.success) {
        setMsg('Registration submitted! Pending admin approval. You will be notified once approved.');
        setActiveTab('email');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const selectQuickPersona = (userEmail) => {
    setEmail(userEmail);
    setPassword('password123');
    setActiveTab('email');
  };

  return (
    <main className="container" style={{ maxWidth: '560px', marginTop: '2.5rem', marginBottom: '3rem' }}>
      <article
        className="card"
        style={{
          borderTop: '6px solid #d97706',
          borderRadius: '16px',
          boxShadow: '0 10px 25px -5px rgba(217, 119, 6, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
          padding: '2rem 1.8rem',
          background: 'linear-gradient(180deg, #ffffff 0%, #fffbf0 100%)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '0.8rem' }}>
            <img
              src="/madhu_sudhan_sai.jpg"
              alt="Sadguru Sri Madhusudan Sai"
              style={{
                width: '110px', height: '110px', borderRadius: '50%',
                border: '4px solid #f59e0b', objectFit: 'cover', margin: '0 auto', display: 'block',
                boxShadow: '0 0 22px rgba(245, 158, 11, 0.45), 0 4px 12px rgba(0, 0, 0, 0.12)'
              }}
            />
            <span style={{
              position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%)',
              background: '#d97706', color: '#ffffff', fontSize: '0.65rem', fontWeight: 'bold',
              padding: '0.15rem 0.6rem', borderRadius: '9999px', whiteSpace: 'nowrap',
              letterSpacing: '0.04em', boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
            }}>
              DIVINE GUIDANCE
            </span>
          </div>
          <h2 style={{ color: '#1e293b', marginBottom: '0.2rem', fontSize: '1.6rem', fontWeight: '800' }}>
            Sathya Sai Grama VMS
          </h2>
          <p style={{ color: '#d97706', fontSize: '0.88rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.4rem 0' }}>
            Sadguru Sri Madhusudan Sai Ashram • Muddenahalli
          </p>
          <div style={{ display: 'inline-block', background: '#fef3c7', color: '#b45309', padding: '0.2rem 0.8rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: '600', fontStyle: 'italic', marginBottom: '0.8rem' }}>
            "Love All, Serve All • Help Ever, Hurt Never"
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '1.2rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <button type="button" onClick={() => setActiveTab('email')}
            style={{ flex: 1, padding: '0.6rem', fontSize: '0.82rem', fontWeight: '700', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
              background: activeTab === 'email' ? '#d97706' : '#f8fafc', color: activeTab === 'email' ? 'white' : '#64748b' }}>
            <Mail size={15} /> Email Login
          </button>
          <button type="button" onClick={() => { setActiveTab('phone'); setOtpSent(false); setOtp(''); setDevOtp(''); }}
            style={{ flex: 1, padding: '0.6rem', fontSize: '0.82rem', fontWeight: '700', border: 'none', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
              background: activeTab === 'phone' ? '#d97706' : '#f8fafc', color: activeTab === 'phone' ? 'white' : '#64748b' }}>
            <Phone size={15} /> Phone OTP
          </button>
          <button type="button" onClick={() => setActiveTab('register')}
            style={{ flex: 1, padding: '0.6rem', fontSize: '0.82rem', fontWeight: '700', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
              background: activeTab === 'register' ? '#d97706' : '#f8fafc', color: activeTab === 'register' ? 'white' : '#64748b' }}>
            <UserPlus size={15} /> Register
          </button>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', borderLeft: '4px solid #dc2626', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}
        {msg && (
          <div style={{ background: '#def7ec', color: '#03543f', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', borderLeft: '4px solid #057a55', fontSize: '0.85rem' }}>
            {msg}
          </div>
        )}

        {/* Email Login Tab */}
        {activeTab === 'email' && (
          <>
            <form onSubmit={handleEmailLogin}>
              <label style={{ fontWeight: '600', color: '#334155' }}>
                Email Address
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="e.g. resident1@ashram.org" />
              </label>
              <label style={{ fontWeight: '600', color: '#334155', marginTop: '0.5rem' }}>
                Password
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </label>
              <button type="submit" disabled={loading}
                style={{ width: '100%', marginTop: '1.2rem', background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', borderColor: '#d97706', fontWeight: '700', fontSize: '1rem', padding: '0.6rem', boxShadow: '0 4px 10px rgba(217, 119, 6, 0.3)' }}>
                {loading ? 'Signing In...' : 'Sign In to Portal'}
              </button>
            </form>
            <hr style={{ margin: '1.5rem 0', borderColor: '#fef3c7' }} />
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.8rem' }}>Select Demo Role Persona:</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button type="button" className="secondary outline" onClick={() => selectQuickPersona('resident1@ashram.org')} style={{ fontSize: '0.78rem', padding: '0.45rem' }}>🏠 Resident (Host L1)</button>
                <button type="button" className="secondary outline" onClick={() => selectQuickPersona('guard1@ashram.org')} style={{ fontSize: '0.78rem', padding: '0.45rem' }}>🛡️ Security Guard (Gate)</button>
                <button type="button" className="secondary outline" onClick={() => selectQuickPersona('supervisor1@ashram.org')} style={{ fontSize: '0.78rem', padding: '0.45rem' }}>📋 Supervisor (SO)</button>
                <button type="button" className="secondary outline" onClick={() => selectQuickPersona('securityhead@ashram.org')} style={{ fontSize: '0.78rem', padding: '0.45rem' }}>👔 Security Head</button>
              </div>
              <button type="button" onClick={() => selectQuickPersona('admin@ashram.org')}
                style={{ width: '100%', marginTop: '0.6rem', background: '#7e22ce', borderColor: '#7e22ce', color: 'white', fontSize: '0.78rem', padding: '0.45rem', fontWeight: 'bold' }}>
                ⚡ Super Admin (Master Controls)
              </button>
            </div>
          </>
        )}

        {/* Phone OTP Login Tab */}
        {activeTab === 'phone' && (
          <>
            {!otpSent ? (
              <form onSubmit={handleSendOtp}>
                <label style={{ fontWeight: '600', color: '#334155' }}>
                  WhatsApp / Mobile Number
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required
                    placeholder="+91 9876543210" style={{ fontSize: '1.1rem' }} />
                </label>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.3rem 0 1rem 0' }}>
                  We'll send a one-time verification code to this number.
                </p>
                <button type="submit" disabled={loading}
                  style={{ width: '100%', background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', borderColor: '#d97706', fontWeight: '700', fontSize: '1rem', padding: '0.6rem' }}>
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp}>
                <div style={{ background: '#eff6ff', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', color: '#1e40af' }}>
                  <strong>OTP sent to {phone}</strong>
                  {devOtp && <span style={{ marginLeft: '0.5rem', background: '#fef3c7', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold', color: '#b45309' }}>Dev OTP: {devOtp}</span>}
                </div>
                <label style={{ fontWeight: '600', color: '#334155' }}>
                  Enter 6-Digit OTP
                  <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required
                    placeholder="123456" maxLength="6" style={{ fontSize: '1.4rem', textAlign: 'center', letterSpacing: '0.5rem' }} />
                </label>
                <button type="submit" disabled={loading}
                  style={{ width: '100%', marginTop: '0.8rem', background: '#057a55', borderColor: '#057a55', fontWeight: '700', fontSize: '1rem', padding: '0.6rem' }}>
                  {loading ? 'Verifying...' : 'Verify OTP & Login'}
                </button>
                <button type="button" onClick={() => { setOtpSent(false); setOtp(''); setDevOtp(''); }} className="secondary outline" style={{ width: '100%', marginTop: '0.5rem' }}>
                  Change Phone Number
                </button>
              </form>
            )}
          </>
        )}

        {/* Register Tab */}
        {activeTab === 'register' && (
          <>
            <div style={{ background: '#fef3c7', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', color: '#92400e' }}>
              <strong>First Time?</strong> Register below. Your account will be reviewed and approved by the Accommodation/Admin office.
            </div>
            <form onSubmit={handleRegister}>
              <label style={{ fontWeight: '600', color: '#334155' }}>
                Full Name *
                <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)} required placeholder="Enter your full name" />
              </label>
              <label style={{ fontWeight: '600', color: '#334155', marginTop: '0.5rem' }}>
                WhatsApp / Mobile Number *
                <input type="tel" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} required placeholder="+91 9876549999" />
              </label>
              <label style={{ fontWeight: '600', color: '#334155', marginTop: '0.5rem' }}>
                Email Address (Optional)
                <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="your.email@example.com" />
              </label>
              <button type="submit" disabled={loading}
                style={{ width: '100%', marginTop: '1.2rem', background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', borderColor: '#2563eb', fontWeight: '700', fontSize: '1rem', padding: '0.6rem' }}>
                {loading ? 'Submitting...' : 'Submit Registration for Approval'}
              </button>
            </form>
          </>
        )}
      </article>
    </main>
  );
}
