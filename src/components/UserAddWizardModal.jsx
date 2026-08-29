import React, { useState, useEffect } from 'react';
import { createSingleUser, getDepartments } from '../services/api';
import FormFieldGuide from './FormFieldGuide';
import { UserPlus, CheckCircle, ChevronRight, ChevronLeft, Shield, Building, Key, X } from 'lucide-react';

export default function UserAddWizardModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeField, setActiveField] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    residency_status: 'RESIDENT',
    user_type: 'RESIDENT',
    role: 'HOST',
    department_id: '',
    password: 'password123',
  });

  useEffect(() => {
    if (isOpen) {
      loadDepartments();
      resetForm();
    }
  }, [isOpen]);

  const loadDepartments = async () => {
    try {
      const res = await getDepartments();
      if (res.success) setDepartments(res.departments);
    } catch (err) {
      console.error('Failed to load departments:', err);
    }
  };

  const resetForm = () => {
    setStep(1);
    setError('');
    setSuccessMsg('');
    setFormData({
      name: '',
      email: '',
      phone: '',
      residency_status: 'RESIDENT',
      user_type: 'RESIDENT',
      role: 'HOST',
      department_id: '',
      password: 'password123',
    });
  };

  const handleChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const validateStep1 = () => {
    if (!formData.name.trim()) return 'Full Name is required.';
    if (!formData.email.trim() || !formData.email.includes('@')) return 'Valid Email address is required.';
    if (!formData.phone.trim() || formData.phone.length < 10) return 'Valid Phone number is required.';
    return null;
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      const err = validateStep1();
      if (err) {
        setError(err);
        return;
      }
    }
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const handlePrev = () => {
    setError('');
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...formData,
        department_id: formData.department_id ? parseInt(formData.department_id) : null,
      };

      const res = await createSingleUser(payload);
      if (res.success) {
        setSuccessMsg(`User '${res.user.name}' (${res.user.role}) added successfully!`);
        setTimeout(() => {
          if (onSuccess) onSuccess(res.user);
          onClose();
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <UserPlus color="#7e22ce" size={24} />
            <div>
              <h3 style={{ margin: 0, color: '#4c1d95', fontSize: '1.2rem' }}>Add New User (Superadmin Wizard)</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Step-by-step creation of Ashram Residents, Employees, HODs, Guards, Supervisors, or Admins</p>
            </div>
          </div>
          <button onClick={onClose} style={closeBtnStyle}><X size={20} /></button>
        </div>

        {/* Wizard Stepper Progress Bar */}
        <div style={stepperContainerStyle}>
          <div style={stepItemStyle(step >= 1)}>
            <div style={stepCircleStyle(step >= 1)}>1</div>
            <span style={{ fontSize: '0.8rem', fontWeight: step === 1 ? 'bold' : 'normal' }}>Personal Info</span>
          </div>
          <div style={stepDividerStyle(step >= 2)} />
          <div style={stepItemStyle(step >= 2)}>
            <div style={stepCircleStyle(step >= 2)}>2</div>
            <span style={{ fontSize: '0.8rem', fontWeight: step === 2 ? 'bold' : 'normal' }}>Role & Dept</span>
          </div>
          <div style={stepDividerStyle(step >= 3)} />
          <div style={stepItemStyle(step >= 3)}>
            <div style={stepCircleStyle(step >= 3)}>3</div>
            <span style={{ fontSize: '0.8rem', fontWeight: step === 3 ? 'bold' : 'normal' }}>Confirm</span>
          </div>
        </div>

        {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}
        {successMsg && <div style={{ background: '#def7ec', color: '#03543f', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>{successMsg}</div>}

        {/* Form Body */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 270px', gap: '1.2rem', alignItems: 'start' }}>
          <form onSubmit={handleSubmit}>
            {/* STEP 1: Personal Details */}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    onFocus={() => setActiveField('fullName')}
                    className={activeField === 'fullName' ? 'field-highlighted' : ''}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>Email Address *</label>
                    <input
                      type="email"
                      placeholder="ramesh@ashram.org"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      onFocus={() => setActiveField('email')}
                      className={activeField === 'email' ? 'field-highlighted' : ''}
                      required
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone Number *</label>
                    <input
                      type="text"
                      placeholder="+91 9876543210"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      onFocus={() => setActiveField('phone')}
                      className={activeField === 'phone' ? 'field-highlighted' : ''}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Residency Status</label>
                  <select
                    value={formData.residency_status}
                    onChange={(e) => handleChange('residency_status', e.target.value)}
                    onFocus={() => setActiveField('address')}
                  >
                    <option value="RESIDENT">Ashram Resident (Stays in Campus)</option>
                    <option value="NON_RESIDENT">Non-Resident (Day Commuter / Guest)</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>
                    {formData.residency_status === 'RESIDENT' ? 'Ashram Home Address / Villa & Flat No' : 'Department Office Address / Location'}
                  </label>
                  <input
                    type="text"
                    placeholder={formData.residency_status === 'RESIDENT' ? 'e.g. Flat 302, Sai Residence Block A, Sathya Sai Grama' : 'e.g. Room 12, Admin Block, Education Dept'}
                    value={formData.address || ''}
                    onChange={(e) => handleChange('address', e.target.value)}
                    onFocus={() => setActiveField('address')}
                    className={activeField === 'address' ? 'field-highlighted' : ''}
                  />
                </div>
              </div>
            )}

            {/* STEP 2: Role & Department Assignment */}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>User Type / Category *</label>
                  <select
                    value={formData.user_type}
                    onChange={(e) => handleChange('user_type', e.target.value)}
                  >
                    <option value="RESIDENT">RESIDENT (Ashram Resident Host)</option>
                    <option value="EMPLOYEE">EMPLOYEE (Ashram Staff Member)</option>
                    <option value="RESIDENT_EMPLOYEE">RESIDENT_EMPLOYEE (Resident + Staff Dual Profile)</option>
                    <option value="VOLUNTEER">VOLUNTEER (Ashram Sevadal / Volunteer)</option>
                    <option value="STUDENT">STUDENT (Campus Student)</option>
                    <option value="GUEST">GUEST (Visiting Guest Host)</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>System Access Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleChange('role', e.target.value)}
                  >
                    <option value="HOST">HOST (Standard Host - L1 Visitor Approver)</option>
                    <option value="HOD">HOD (Department Head L2 Approver)</option>
                    <option value="PRO">PRO (Public Relations Officer L2 Approver)</option>
                    <option value="GUARD">GUARD (Security Gate Pass Terminal)</option>
                    <option value="SUPERVISOR">SUPERVISOR (Security Officer Override)</option>
                    <option value="SECURITY_HEAD">SECURITY_HEAD (Chief Security Officer)</option>
                    <option value="ADMIN">ADMIN (Super Administrator)</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Department Assignment</label>
                  <select
                    value={formData.department_id}
                    onChange={(e) => handleChange('department_id', e.target.value)}
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Initial Default Password</label>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* STEP 3: Confirmation Summary */}
            {step === 3 && (
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <h4 style={{ margin: '0 0 0.8rem 0', color: '#1e293b', fontSize: '0.95rem' }}>Verify New User Account Details:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem' }}>
                  <div><strong>Full Name:</strong> {formData.name}</div>
                  <div><strong>Email Address:</strong> {formData.email}</div>
                  <div><strong>Phone Number:</strong> {formData.phone}</div>
                  <div><strong>User Type / Category:</strong> <span className="badge badge-vvip" style={{ background: '#0d9488' }}>{formData.user_type}</span></div>
                  <div><strong>System Access Role:</strong> <span className="badge badge-vvip">{formData.role}</span></div>
                  <div><strong>Residency Status:</strong> {formData.residency_status}</div>
                  <div><strong>Ashram Address:</strong> {formData.address || 'Ashram Campus'}</div>
                  <div><strong>Department:</strong> {departments.find(d => String(d.id) === String(formData.department_id))?.name || 'None'}</div>
                </div>
              </div>
            )}

            {/* Buttons Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
              {step > 1 ? (
                <button type="button" onClick={handlePrev} style={secondaryBtnStyle} data-tooltip="Go back to previous step">
                  <ChevronLeft size={16} /> Back
                </button>
              ) : <div />}

              {step < 3 ? (
                <button type="button" onClick={handleNext} style={primaryBtnStyle} data-tooltip="Proceed to next step">
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button type="submit" disabled={loading} style={{ ...primaryBtnStyle, background: '#057a55', borderColor: '#057a55' }} data-tooltip="Create user account now">
                  {loading ? 'Creating...' : 'Create User Account'} <CheckCircle size={16} />
                </button>
              )}
            </div>
          </form>

          {/* Right-side Helper Guide Panel */}
          <FormFieldGuide activeField={activeField} />
        </div>
      </div>
    </div>
  );
}

// Inline Styles
const overlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.65)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000,
  backdropFilter: 'blur(4px)',
};

const modalStyle = {
  background: '#ffffff',
  borderRadius: '12px',
  width: '90%', maxWidth: '560px',
  padding: '1.5rem',
  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
};

const headerStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
  marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem',
};

const closeBtnStyle = {
  background: 'none', border: 'none', cursor: 'pointer', color: '#64748b',
};

const labelStyle = {
  display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#334155', marginBottom: '0.3rem',
};

const stepperContainerStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.25rem',
};

const stepItemStyle = (active) => ({
  display: 'flex', alignItems: 'center', gap: '0.4rem',
  color: active ? '#7e22ce' : '#94a3b8',
});

const stepCircleStyle = (active) => ({
  width: '24px', height: '24px', borderRadius: '50%',
  background: active ? '#7e22ce' : '#cbd5e1',
  color: active ? '#ffffff' : '#475569',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '0.75rem', fontWeight: 'bold',
});

const stepDividerStyle = (active) => ({
  flex: 1, height: '2px', background: active ? '#7e22ce' : '#cbd5e1', maxWidth: '60px',
});

const primaryBtnStyle = {
  background: '#7e22ce', color: '#fff', border: 'none',
  padding: '0.5rem 1.2rem', borderRadius: '6px', fontWeight: 'bold',
  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
};

const secondaryBtnStyle = {
  background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1',
  padding: '0.5rem 1.2rem', borderRadius: '6px', fontWeight: 'bold',
  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
};
