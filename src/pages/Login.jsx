import React, { useState } from 'react';
import { loginUser, sendOtp as sendOtpApi, verifyOtp as verifyOtpApi, registerUser } from '../services/api';
import { Phone, Mail, UserPlus, KeyRound, Shield, Building, Home, Star, Users, CheckCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import OneWorldOneFamilyLogo from '../components/OneWorldOneFamilyLogo';

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
  const [showHostGuide, setShowHostGuide] = useState(true);

  const handleEmailLogin = async (e) => {
    if (e) e.preventDefault();
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
    <main className="container" style={{ maxWidth: '960px', marginTop: '1.5rem', marginBottom: '3rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 530px) minmax(0, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Column: Login Card & Sample Persona Selectors */}
        <article
          className="card"
          style={{
            borderTop: '6px solid #d97706',
            borderRadius: '16px',
            boxShadow: '0 10px 25px -5px rgba(217, 119, 6, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
            padding: '1.8rem 1.6rem',
            background: 'linear-gradient(180deg, #ffffff 0%, #fffbf0 100%)'
          }}
        >
          {/* One World One Family 360° Emblem Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.8rem' }}>
              <div>
                <OneWorldOneFamilyLogo size={92} showText={false} variant="hero" speed="normal" />
              </div>
            </div>

            <h2 style={{ color: '#1e293b', marginBottom: '0.15rem', fontSize: '1.55rem', fontWeight: '900', letterSpacing: '-0.5px' }}>
              ONE WORLD ONE FAMILY
            </h2>
            <div style={{ color: '#d97706', fontSize: '0.9rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
              SRI SATHYA SAI GRAMAM
            </div>
            <div style={{ display: 'inline-block', background: '#fef3c7', color: '#b45309', padding: '0.2rem 0.85rem', borderRadius: '12px', fontSize: '0.76rem', fontWeight: '700', letterSpacing: '0.5px', border: '1px solid #fde68a' }}>
              "VASUDHAIVA KUTUMBAKAM"
            </div>
          </div>

          {/* Tab Switcher */}
          <div style={{ display: 'flex', gap: '0', marginBottom: '1rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <button type="button" onClick={() => setActiveTab('email')}
              style={{ flex: 1, padding: '0.55rem', fontSize: '0.8rem', fontWeight: '700', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                background: activeTab === 'email' ? '#d97706' : '#f8fafc', color: activeTab === 'email' ? 'white' : '#64748b' }}>
              <Mail size={14} /> Email Login
            </button>
            <button type="button" onClick={() => { setActiveTab('phone'); setOtpSent(false); setOtp(''); setDevOtp(''); }}
              style={{ flex: 1, padding: '0.55rem', fontSize: '0.8rem', fontWeight: '700', border: 'none', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                background: activeTab === 'phone' ? '#d97706' : '#f8fafc', color: activeTab === 'phone' ? 'white' : '#64748b' }}>
              <Phone size={14} /> Phone OTP
            </button>
            <button type="button" onClick={() => setActiveTab('register')}
              style={{ flex: 1, padding: '0.55rem', fontSize: '0.8rem', fontWeight: '700', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                background: activeTab === 'register' ? '#d97706' : '#f8fafc', color: activeTab === 'register' ? 'white' : '#64748b' }}>
              <UserPlus size={14} /> Register
            </button>
          </div>

          {error && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.65rem 0.8rem', borderRadius: '8px', marginBottom: '0.8rem', borderLeft: '4px solid #dc2626', fontSize: '0.82rem' }}>
              {error}
            </div>
          )}
          {msg && (
            <div style={{ background: '#def7ec', color: '#03543f', padding: '0.65rem 0.8rem', borderRadius: '8px', marginBottom: '0.8rem', borderLeft: '4px solid #057a55', fontSize: '0.82rem' }}>
              {msg}
            </div>
          )}

          {/* Email Login Tab */}
          {activeTab === 'email' && (
            <>
              <form onSubmit={handleEmailLogin}>
                <label style={{ fontWeight: '600', color: '#334155', fontSize: '0.85rem' }}>
                  Email Address
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="e.g. resident1@ashram.org" style={{ fontSize: '0.9rem', padding: '0.45rem 0.75rem' }} />
                </label>
                <label style={{ fontWeight: '600', color: '#334155', marginTop: '0.4rem', fontSize: '0.85rem' }}>
                  Password
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ fontSize: '0.9rem', padding: '0.45rem 0.75rem' }} />
                </label>
                <button type="submit" disabled={loading}
                  style={{ width: '100%', marginTop: '1rem', background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', borderColor: '#d97706', fontWeight: '700', fontSize: '0.95rem', padding: '0.55rem', boxShadow: '0 4px 10px rgba(217, 119, 6, 0.3)' }}>
                  {loading ? 'Signing In...' : 'Sign In to Portal'}
                </button>
              </form>

              <hr style={{ margin: '1.2rem 0 1rem 0', borderColor: '#fef3c7' }} />

              {/* Sample Login Personas */}
              <div>
                <h4 style={{ fontSize: '0.78rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem', textAlign: 'center', fontWeight: '800' }}>
                  ⚡ Quick Demo Login Personas
                </h4>

                {/* Section A: Individual Host Types */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 'bold', display: 'block', marginBottom: '0.3rem' }}>
                    Standard Host Types (Individual):
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                    <button type="button" className="secondary outline" onClick={() => selectQuickPersona('resident1@ashram.org')} style={{ fontSize: '0.75rem', padding: '0.38rem 0.4rem', textAlign: 'left' }}>
                      🏠 <strong>Resident</strong>
                    </button>
                    <button type="button" className="secondary outline" onClick={() => selectQuickPersona('employee1@ashram.org')} style={{ fontSize: '0.75rem', padding: '0.38rem 0.4rem', textAlign: 'left' }}>
                      💼 <strong>Employee</strong>
                    </button>
                    <button type="button" className="secondary outline" onClick={() => selectQuickPersona('viphost1@ashram.org')} style={{ fontSize: '0.75rem', padding: '0.38rem 0.4rem', textAlign: 'left' }}>
                      🌟 <strong>VIP Host</strong>
                    </button>
                    <button type="button" className="secondary outline" onClick={() => selectQuickPersona('pro1@ashram.org')} style={{ fontSize: '0.75rem', padding: '0.38rem 0.4rem', textAlign: 'left' }}>
                      🏛️ <strong>PRO Office</strong>
                    </button>
                  </div>
                </div>

                {/* Section B: Combination Host Types */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 'bold', display: 'block', marginBottom: '0.3rem' }}>
                    Combined Host Types (Multi-Role):
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                    <button type="button" className="secondary outline" onClick={() => selectQuickPersona('resident_employee1@ashram.org')} style={{ fontSize: '0.73rem', padding: '0.38rem 0.4rem', textAlign: 'left', background: '#f0f9ff', borderColor: '#bae6fd' }}>
                      🏠+💼 Resident + Employee
                    </button>
                    <button type="button" className="secondary outline" onClick={() => selectQuickPersona('resident_vip1@ashram.org')} style={{ fontSize: '0.73rem', padding: '0.38rem 0.4rem', textAlign: 'left', background: '#fffbeb', borderColor: '#fde68a' }}>
                      🏠+🌟 Resident + VIP Host
                    </button>
                    <button type="button" className="secondary outline" onClick={() => selectQuickPersona('employee_vip1@ashram.org')} style={{ fontSize: '0.73rem', padding: '0.38rem 0.4rem', textAlign: 'left', background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                      💼+🌟 Employee + VIP Host
                    </button>
                    <button type="button" className="secondary outline" onClick={() => selectQuickPersona('resident_emp_vip1@ashram.org')} style={{ fontSize: '0.73rem', padding: '0.38rem 0.4rem', textAlign: 'left', background: '#faf5ff', borderColor: '#e9d5ff' }}>
                      🏠+💼+🌟 Res + Emp + VIP Host
                    </button>
                  </div>
                </div>

                {/* Section C: Security & Operations Roles */}
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#6b21a8', fontWeight: 'bold', display: 'block', marginBottom: '0.3rem' }}>
                    Security & Administrative Terminals:
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginBottom: '0.4rem' }}>
                    <button type="button" className="secondary outline" onClick={() => selectQuickPersona('guard1@ashram.org')} style={{ fontSize: '0.75rem', padding: '0.38rem 0.4rem', textAlign: 'left' }}>
                      🛡️ Security Guard
                    </button>
                    <button type="button" className="secondary outline" onClick={() => selectQuickPersona('supervisor1@ashram.org')} style={{ fontSize: '0.75rem', padding: '0.38rem 0.4rem', textAlign: 'left' }}>
                      📋 Supervisor (SO)
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                    <button type="button" className="secondary outline" onClick={() => selectQuickPersona('securityhead@ashram.org')} style={{ fontSize: '0.75rem', padding: '0.38rem 0.4rem', textAlign: 'left' }}>
                      👔 Security Head
                    </button>
                    <button type="button" onClick={() => selectQuickPersona('admin@ashram.org')}
                      style={{ fontSize: '0.75rem', padding: '0.38rem 0.4rem', background: '#7e22ce', borderColor: '#7e22ce', color: 'white', fontWeight: 'bold', textAlign: 'left' }}>
                      ⚡ Super Admin
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Phone OTP Login Tab */}
          {activeTab === 'phone' && (
            <>
              {!otpSent ? (
                <form onSubmit={handleSendOtp}>
                  <label style={{ fontWeight: '600', color: '#334155', fontSize: '0.85rem' }}>
                    WhatsApp / Mobile Number
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required
                      placeholder="+91 9876543210" style={{ fontSize: '1rem', padding: '0.5rem' }} />
                  </label>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.3rem 0 1rem 0' }}>
                    We'll send a one-time verification code to this number.
                  </p>
                  <button type="submit" disabled={loading}
                    style={{ width: '100%', background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', borderColor: '#d97706', fontWeight: '700', fontSize: '0.95rem', padding: '0.55rem' }}>
                    {loading ? 'Sending OTP...' : 'Send OTP'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp}>
                  <div style={{ background: '#eff6ff', padding: '0.65rem', borderRadius: '8px', marginBottom: '0.8rem', fontSize: '0.82rem', color: '#1e40af' }}>
                    <strong>OTP sent to {phone}</strong>
                    {devOtp && <span style={{ marginLeft: '0.5rem', background: '#fef3c7', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 'bold', color: '#b45309' }}>Dev OTP: {devOtp}</span>}
                  </div>
                  <label style={{ fontWeight: '600', color: '#334155', fontSize: '0.85rem' }}>
                    Enter 6-Digit OTP
                    <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required
                      placeholder="123456" maxLength="6" style={{ fontSize: '1.3rem', textAlign: 'center', letterSpacing: '0.4rem', padding: '0.4rem' }} />
                  </label>
                  <button type="submit" disabled={loading}
                    style={{ width: '100%', marginTop: '0.8rem', background: '#057a55', borderColor: '#057a55', fontWeight: '700', fontSize: '0.95rem', padding: '0.55rem' }}>
                    {loading ? 'Verifying...' : 'Verify OTP & Login'}
                  </button>
                  <button type="button" onClick={() => { setOtpSent(false); setOtp(''); setDevOtp(''); }} className="secondary outline" style={{ width: '100%', marginTop: '0.4rem', fontSize: '0.78rem', padding: '0.4rem' }}>
                    Change Phone Number
                  </button>
                </form>
              )}
            </>
          )}

          {/* Register Tab */}
          {activeTab === 'register' && (
            <>
              <div style={{ background: '#fef3c7', padding: '0.65rem', borderRadius: '8px', marginBottom: '0.8rem', fontSize: '0.82rem', color: '#92400e' }}>
                <strong>First Time?</strong> Register below. Your account will be reviewed and approved by the Accommodation/Admin office.
              </div>
              <form onSubmit={handleRegister}>
                <label style={{ fontWeight: '600', color: '#334155', fontSize: '0.85rem' }}>
                  Full Name *
                  <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)} required placeholder="Enter your full name" style={{ padding: '0.45rem' }} />
                </label>
                <label style={{ fontWeight: '600', color: '#334155', marginTop: '0.4rem', fontSize: '0.85rem' }}>
                  WhatsApp / Mobile Number *
                  <input type="tel" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} required placeholder="+91 9876549999" style={{ padding: '0.45rem' }} />
                </label>
                <label style={{ fontWeight: '600', color: '#334155', marginTop: '0.4rem', fontSize: '0.85rem' }}>
                  Email Address (Optional)
                  <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="your.email@example.com" style={{ padding: '0.45rem' }} />
                </label>
                <button type="submit" disabled={loading}
                  style={{ width: '100%', marginTop: '1rem', background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', borderColor: '#2563eb', fontWeight: '700', fontSize: '0.95rem', padding: '0.55rem' }}>
                  {loading ? 'Submitting...' : 'Submit Registration for Approval'}
                </button>
              </form>
            </>
          )}
        </article>

        {/* Right Column: Comprehensive Host Types & Privileges Reference Guide Card */}
        <article
          className="card"
          style={{
            borderTop: '6px solid #b45309',
            borderRadius: '16px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
            padding: '1.5rem',
            background: '#ffffff'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building size={20} color="#b45309" />
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b', fontWeight: '800' }}>
                Ashram Host Types & Privileges
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowHostGuide(!showHostGuide)}
              className="secondary outline"
              style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
            >
              {showHostGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />} {showHostGuide ? 'Collapse' : 'Expand'}
            </button>
          </div>

          <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 0, marginBottom: '1rem', lineHeight: '1.4' }}>
            The Visitor Management System defines <strong>8 distinct Host Types</strong> with specific invitation rights and approval authorities:
          </p>

          {showHostGuide && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              
              {/* 1. Resident */}
              <div style={{ background: '#f0f9ff', padding: '0.65rem 0.8rem', borderRadius: '8px', borderLeft: '4px solid #0284c7' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    🏠 Resident
                  </strong>
                </div>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: '#334155' }}>
                  Can invite guests to one's respective <strong>Residence</strong>.
                </p>
              </div>

              {/* 2. Employee */}
              <div style={{ background: '#f0fdf4', padding: '0.65rem 0.8rem', borderRadius: '8px', borderLeft: '4px solid #16a34a' }}>
                <strong style={{ fontSize: '0.85rem', color: '#15803d', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  💼 Employee
                </strong>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: '#334155' }}>
                  Can invite guests to one's respective <strong>Office</strong> (e.g. PBMT, Annapoorna).
                </p>
              </div>

              {/* 3. VIP Host */}
              <div style={{ background: '#fffbeb', padding: '0.65rem 0.8rem', borderRadius: '8px', borderLeft: '4px solid #d97706' }}>
                <strong style={{ fontSize: '0.85rem', color: '#b45309', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  🌟 VIP Host
                </strong>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: '#334155' }}>
                  Can invite <strong>VIP Guests</strong> who are Ashram's guests and not specific to someone's office (e.g. CSR leaders from Hyd, Deepak brother).
                </p>
              </div>

              {/* 4. Public Relations Office (PRO) */}
              <div style={{ background: '#faf5ff', padding: '0.65rem 0.8rem', borderRadius: '8px', borderLeft: '4px solid #9333ea' }}>
                <strong style={{ fontSize: '0.85rem', color: '#7e22ce', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  🏛️ Public Relations Office (PRO)
                </strong>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: '#334155' }}>
                  For walk-in visitors, PRO acts like Host and can approve/reject visitors which do not relate to any of the above 3 Host types. Can approve <strong>Ashram Tour</strong> visitors.
                </p>
              </div>

              {/* Combination Host Types */}
              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '0.2rem' }}>
                <strong style={{ fontSize: '0.82rem', color: '#1e293b', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Combined Host Type Profiles:
                </strong>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.4rem', fontSize: '0.78rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0369a1' }}>
                    <span style={{ fontWeight: 'bold' }}>• Resident + Employee:</span>
                    <span style={{ color: '#475569' }}>Invites to both Residence & Office</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#b45309' }}>
                    <span style={{ fontWeight: 'bold' }}>• Resident + VIP Host:</span>
                    <span style={{ color: '#475569' }}>Invites to Residence & Ashram VIP Guests</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#15803d' }}>
                    <span style={{ fontWeight: 'bold' }}>• Employee + VIP Host:</span>
                    <span style={{ color: '#475569' }}>Invites to Office & Ashram VIP Guests</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#7e22ce' }}>
                    <span style={{ fontWeight: 'bold' }}>• Resident + Employee + VIP Host:</span>
                    <span style={{ color: '#475569' }}>Comprehensive privileges (Residence + Office + VIP)</span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </article>

      </div>
    </main>
  );
}

