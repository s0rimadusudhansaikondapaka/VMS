import React, { useState, useEffect } from 'react';
import { getPublicHostInfo, createPublicVisitorRegistration } from '../services/api';
import CameraCaptureModal from '../components/CameraCaptureModal';
import FormFieldGuide from '../components/FormFieldGuide';
import OneWorldOneFamilyLogo from '../components/OneWorldOneFamilyLogo';
import { Shield, User, Camera, Upload, CheckCircle, Calendar, Users, Car, AlertTriangle } from 'lucide-react';

export default function GuestInviteForm() {
  const params = new URLSearchParams(window.location.search);
  const hostId = params.get('token') || params.get('guid') || params.get('host_guid') || params.get('host_id') || '1';
  const initialMode = params.get('mode') || 'Single';

  const [hostInfo, setHostInfo] = useState(null);
  const [loadingHost, setLoadingHost] = useState(true);
  const [registrationMode, setRegistrationMode] = useState(initialMode || 'Single');
  const [activeField, setActiveField] = useState('');
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraTarget, setCameraTarget] = useState('photo'); // 'photo' or 'idCard'

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('Male');
  const [photoUrl, setPhotoUrl] = useState('');
  const [idType, setIdType] = useState('Aadhaar');
  const [idCardNumber, setIdCardNumber] = useState('');
  const [idCardImageUrl, setIdCardImageUrl] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [purpose, setPurpose] = useState('');

  // Visit Window (Arrival: Now, Departure: Tomorrow 9:00 PM)
  const getDefaultFrom = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const getDefaultUntil = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(21, 0, 0, 0); // Tomorrow 9:00 PM
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const hours = String(tomorrow.getHours()).padStart(2, '0');
    const minutes = String(tomorrow.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [validFrom, setValidFrom] = useState(getDefaultFrom());
  const [validUntil, setValidUntil] = useState(getDefaultUntil());

  const [adultMen, setAdultMen] = useState(1);
  const [adultWomen, setAdultWomen] = useState(0);
  const [boysCount, setBoysCount] = useState(0);
  const [girlsCount, setGirlsCount] = useState(0);

  const [vehicles, setVehicles] = useState([
    { plate_number: '', vehicle_type: 'Car', driver_name: '', driver_phone: '' }
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [submittedPassCode, setSubmittedPassCode] = useState(null);
  const [isLinkUsed, setIsLinkUsed] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHostDetails();
  }, [hostId]);

  const fetchHostDetails = async () => {
    setLoadingHost(true);
    try {
      const res = await getPublicHostInfo(hostId);
      if (res.success) {
        setHostInfo(res.host);
        if (res.host?.user_type === 'VIP_HOST' || res.host?.role === 'VIP_HOST') {
          setCategory('VIP');
        }
        if (res.is_used) {
          setIsLinkUsed(true);
        }
      }
    } catch (err) {
      console.error('Failed to load host info:', err);
    } finally {
      setLoadingHost(false);
    }
  };

  const handlePhotoCaptured = (dataUrl) => {
    if (cameraTarget === 'idCard') {
      setIdCardImageUrl(dataUrl);
    } else {
      setPhotoUrl(dataUrl);
    }
  };

  const handlePhotoFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleIdFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setIdCardImageUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const isSingle = registrationMode === 'Single';
    const computedMen = isSingle ? (gender === 'Female' ? 0 : 1) : (parseInt(adultMen) || 0);
    const computedWomen = isSingle ? (gender === 'Female' ? 1 : 0) : (parseInt(adultWomen) || 0);
    const computedBoys = isSingle ? 0 : (parseInt(boysCount) || 0);
    const computedGirls = isSingle ? 0 : (parseInt(girlsCount) || 0);

    try {
      const res = await createPublicVisitorRegistration({
        host_id: hostId,
        token: params.get('token') || (typeof hostId === 'string' && hostId.startsWith('inv_') ? hostId : null),
        full_name: fullName,
        phone,
        email,
        gender,
        photo_url: photoUrl,
        id_type: idType,
        id_card_number: idCardNumber,
        id_card_image_url: idCardImageUrl,
        registration_mode: registrationMode,
        visitor_category: category,
        purpose: purpose || 'Visitor Pre-Approval Invite Form',
        valid_from: validFrom,
        valid_until: validUntil,
        adult_men_count: computedMen,
        adult_women_count: computedWomen,
        boys_count: computedBoys,
        girls_count: computedGirls,
        children_count: computedBoys + computedGirls,
        vehicles: vehicles.filter(v => v.plate_number.trim() !== ''),
      });

      if (res.success) {
        setSubmittedPassCode(res.pass_code);
      } else {
        setError(res.message || 'Submission failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit visitor registration.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLinkUsed) {
    return (
      <main className="container" style={{ marginTop: '2rem', marginBottom: '3rem' }}>
        <div className="card" style={{ borderTop: '6px solid #dc2626', textAlign: 'center', padding: '2.5rem' }}>
          <AlertTriangle size={58} color="#dc2626" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ color: '#991b1b', margin: '0 0 0.5rem 0' }}>Invitation Link Expired</h2>
          <p style={{ fontSize: '0.95rem', color: '#475569', maxWidth: '520px', margin: '0 auto 1.5rem auto', lineHeight: '1.5' }}>
            This single-use invitation link for host <strong>{hostInfo?.name || 'Resident / Staff'}</strong> has already been submitted and completed.
          </p>
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '0.8rem 1rem', borderRadius: '8px', fontSize: '0.85rem', color: '#991b1b', fontWeight: 'bold', display: 'inline-block' }}>
            ✓ Submissions are allowed only once per invitation link.
          </div>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '1.5rem' }}>
            If you need to register again, please request a new invite link from your host.
          </p>
        </div>
      </main>
    );
  }

  if (submittedPassCode) {
    return (
      <main className="container" style={{ maxWidth: '560px', marginTop: '2rem', marginBottom: '3rem' }}>
        <div className="card" style={{ borderTop: '6px solid #057a55', textAlign: 'center', padding: '2rem' }}>
          <CheckCircle size={54} color="#057a55" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ color: '#03543f', margin: '0 0 0.5rem 0' }}>Registration Submitted!</h2>
          <p style={{ fontSize: '0.95rem', color: '#475569', margin: 0 }}>
            Your guest information has been sent to <strong>{hostInfo?.name || 'your Ashram Host'}</strong> for review.
          </p>

          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1rem', borderRadius: '8px', margin: '1.5rem 0' }}>
            <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 'bold' }}>REFERENCE PASSCODE</span>
            <h3 style={{ fontSize: '1.8rem', color: '#15803d', margin: '0.2rem 0' }}>{submittedPassCode}</h3>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#166534' }}>
              ✓ Single-Use Pass (Valid Only Once Upon Approval)
            </p>
          </div>

          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Once approved by your referrer/host, your single-use QR Code will be activated for gate entry.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="container" style={{ marginTop: '1.5rem', marginBottom: '3rem' }}>
      {showCameraModal && (
        <CameraCaptureModal
          onPhotoCaptured={handlePhotoCaptured}
          onClose={() => setShowCameraModal(false)}
        />
      )}

      {/* Header Banner */}
      <div className="card" style={{ borderLeft: '6px solid #d97706', background: 'linear-gradient(135deg, #ffffff 0%, #fffbf0 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
          {/* 360° Rotating Emblem */}
          <OneWorldOneFamilyLogo size={56} showText={false} variant="navbar" speed="normal" />
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', color: '#1e293b', fontWeight: '900' }}>ONE WORLD ONE FAMILY</h2>
            <span style={{ fontSize: '0.78rem', color: '#d97706', fontWeight: 'bold' }}>Sathya Sai Grama Visitor Pre-Approval</span>
          </div>
        </div>

        {loadingHost ? (
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Loading host invitation details...</p>
        ) : (
          <div style={{ background: '#fef3c7', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', color: '#b45309' }}>
            🤝 Invited by Host/Referrer: <strong>{hostInfo?.name || 'Resident / Staff'}</strong> ({initialMode} Visit)
          </div>
        )}
      </div>

      {/* Guest Pre-Approval Registration Form */}
      <div className="card">
        <h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', color: '#1e293b', marginTop: 0 }}>
          Guest Information Form
        </h3>

        {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem' }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '1.5rem', alignItems: 'start' }}>
          <form onSubmit={handleSubmit}>
          {/* Registration Mode Selection: Single Visitor vs Group Visit */}
          <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 'bold', color: '#1e293b' }}>Visit Type Mode:</span>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <label style={{ cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', color: registrationMode === 'Single' ? '#2563eb' : '#475569', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                <input
                  type="radio"
                  name="guestRegMode"
                  value="Single"
                  checked={registrationMode === 'Single'}
                  onChange={(e) => setRegistrationMode(e.target.value)}
                />
                Single Visitor
              </label>
              <label style={{ cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', color: registrationMode === 'Group' ? '#057a55' : '#475569', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                <input
                  type="radio"
                  name="guestRegMode"
                  value="Group"
                  checked={registrationMode === 'Group'}
                  onChange={(e) => setRegistrationMode(e.target.value)}
                />
                Group Visit
              </label>
            </div>
          </div>

          {/* Section 1: Demographics */}
          <h4 style={{ fontSize: '0.9rem', color: '#2563eb', marginTop: '0.5rem' }}>1. Visitor Demographics & Identity</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <label>
              Full Name *
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onFocus={() => setActiveField('fullName')}
                className={activeField === 'fullName' ? 'field-highlighted' : ''}
                placeholder="Full Name"
              />
            </label>
            <label>
              Phone / WhatsApp Number *
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onFocus={() => setActiveField('phone')}
                className={activeField === 'phone' ? 'field-highlighted' : ''}
                placeholder="+91 9876543210"
              />
            </label>
            <label>
              Email Address
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setActiveField('email')}
                className={activeField === 'email' ? 'field-highlighted' : ''}
                placeholder="name@example.com"
              />
            </label>
            <label>
              Gender *
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                onFocus={() => setActiveField('gender')}
                className={activeField === 'gender' ? 'field-highlighted' : ''}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </label>
          </div>

          {/* Simplified Visitor Photo Attachment Control */}
          <div style={{ marginTop: '0.8rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <label style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
              📷 Visitor Photo Attachment
            </label>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <label className="button" style={{ margin: 0, padding: '0.45rem 1rem', fontSize: '0.82rem', background: '#2563eb', borderColor: '#2563eb', color: 'white', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 'bold' }}>
                <Upload size={15} /> Select Photo File
                <input type="file" accept="image/*" onChange={handlePhotoFileUpload} style={{ display: 'none' }} />
              </label>
              <button
                type="button"
                onClick={() => { setCameraTarget('photo'); setShowCameraModal(true); }}
                style={{ margin: 0, padding: '0.45rem 1rem', fontSize: '0.82rem', background: '#7c3aed', borderColor: '#7c3aed', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 'bold' }}
              >
                <Camera size={15} /> Snap Live Camera
              </button>
            </div>
            {photoUrl && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.6rem', padding: '0.5rem', background: '#ffffff', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                <img src={photoUrl} alt="Preview" style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #057a55' }} />
                <span style={{ fontSize: '0.8rem', color: '#057a55', fontWeight: 'bold' }}>✓ Visitor Photo Attached</span>
                <button type="button" onClick={() => setPhotoUrl('')} className="secondary outline" style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', marginLeft: 'auto' }}>
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Section 2: Identity & Document Proof Attachment */}
          <h4 style={{ fontSize: '0.9rem', color: '#2563eb', marginTop: '1rem' }}>2. Identity & Document Proof Attachment</h4>
          <div style={{ marginTop: '0.5rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <label style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
              📄 Upload Document or Snap Photo
            </label>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <label className="button" style={{ margin: 0, padding: '0.45rem 1rem', fontSize: '0.82rem', background: '#2563eb', borderColor: '#2563eb', color: 'white', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 'bold' }}>
                <Upload size={15} /> Select Document / Photo File
                <input type="file" accept="image/*,.pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={handleIdFileUpload} style={{ display: 'none' }} />
              </label>
              <button
                type="button"
                onClick={() => { setCameraTarget('idCard'); setShowCameraModal(true); }}
                style={{ margin: 0, padding: '0.45rem 1rem', fontSize: '0.82rem', background: '#7c3aed', borderColor: '#7c3aed', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 'bold' }}
              >
                <Camera size={15} /> Snap Photo / Document
              </button>
            </div>

            {idCardImageUrl && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.6rem', padding: '0.5rem', background: '#ffffff', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                {idCardImageUrl.startsWith('data:image') || idCardImageUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) || idCardImageUrl.startsWith('http') ? (
                  <img src={idCardImageUrl} alt="Document Preview" style={{ maxWidth: '90px', maxHeight: '55px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                ) : (
                  <div style={{ padding: '0.5rem 0.8rem', background: '#eff6ff', borderRadius: '4px', fontSize: '0.8rem', color: '#1e40af', fontWeight: 'bold' }}>📄 Document File</div>
                )}
                <span style={{ fontSize: '0.8rem', color: '#057a55', fontWeight: 'bold' }}>✓ Document / Proof Attached</span>
                <button type="button" onClick={() => setIdCardImageUrl('')} className="secondary outline" style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', marginLeft: 'auto' }}>
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Section 3: Visit Window & Accompanying Breakdown */}
          <h4 style={{ fontSize: '0.9rem', color: '#2563eb', marginTop: '1rem' }}>3. Scheduled Visit Window & Accompanying Breakdown</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <label>
              Arrival Date/Time
              <input type="datetime-local" required value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
            </label>
            <label>
              Departure Date/Time
              <input type="datetime-local" required value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </label>
          </div>

          {registrationMode === 'Group' || registrationMode === 'group' ? (
            <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '0.5rem' }}>
              <strong style={{ fontSize: '0.85rem', color: '#334155' }}>Group Accompanying Breakdown:</strong>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.8rem', marginTop: '0.4rem' }}>
                <label>
                  Adult Men (👨)
                  <input type="number" min="0" value={adultMen} onChange={(e) => setAdultMen(e.target.value)} />
                </label>
                <label>
                  Adult Women (👩)
                  <input type="number" min="0" value={adultWomen} onChange={(e) => setAdultWomen(e.target.value)} />
                </label>
                <label>
                  Boys (👦)
                  <input type="number" min="0" value={boysCount} onChange={(e) => setBoysCount(e.target.value)} />
                </label>
                <label>
                  Girls (👧)
                  <input type="number" min="0" value={girlsCount} onChange={(e) => setGirlsCount(e.target.value)} />
                </label>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.4rem', fontWeight: 'bold' }}>
                Total People: {(parseInt(adultMen) || 0) + (parseInt(adultWomen) || 0) + (parseInt(boysCount) || 0) + (parseInt(girlsCount) || 0)} (Children: {(parseInt(boysCount) || 0) + (parseInt(girlsCount) || 0)})
              </div>
            </div>
          ) : (
            <div style={{ background: '#eff6ff', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #bfdbfe', marginTop: '0.5rem', fontSize: '0.82rem', color: '#1e40af', fontWeight: 'bold' }}>
              ⚡ Single Visitor Mode: Auto-calculated breakdown for 1 Visitor ({gender === 'Female' ? '1 Adult Woman' : '1 Adult Man'}).
            </div>
          )}

          <label style={{ marginTop: '1rem' }}>
            Purpose of Visit *
            <textarea rows="2" required value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Meeting Resident, Personal Visit, Darshan"></textarea>
          </label>

          <button
            type="submit"
            disabled={submitting}
            data-tooltip="Submit pre-approval guest registration form to host"
            style={{ width: '100%', marginTop: '1.2rem', background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', borderColor: '#d97706', color: 'white', fontWeight: 'bold', fontSize: '1rem', padding: '0.75rem' }}
          >
            {submitting ? 'Submitting Form...' : 'Submit Guest Registration'}
          </button>
        </form>

        {/* Right-side Interactive Field Guide */}
        <FormFieldGuide activeField={activeField} />
      </div>
      </div>
    </main>
  );
}
