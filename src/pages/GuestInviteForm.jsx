import React, { useState, useEffect } from 'react';
import { getPublicHostInfo, createPublicVisitorRegistration } from '../services/api';
import CameraCaptureModal from '../components/CameraCaptureModal';
import { Shield, User, Camera, Upload, CheckCircle, Calendar, Users, Car, AlertTriangle } from 'lucide-react';

export default function GuestInviteForm() {
  const params = new URLSearchParams(window.location.search);
  const hostId = params.get('host_id') || '1';
  const initialMode = params.get('mode') || 'Single';

  const [hostInfo, setHostInfo] = useState(null);
  const [loadingHost, setLoadingHost] = useState(true);
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

  const defaultFrom = new Date().toISOString().slice(0, 16);
  const defaultUntil = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString().slice(0, 16);
  const [validFrom, setValidFrom] = useState(defaultFrom);
  const [validUntil, setValidUntil] = useState(defaultUntil);

  const [adultMen, setAdultMen] = useState(1);
  const [adultWomen, setAdultWomen] = useState(0);
  const [boysCount, setBoysCount] = useState(0);
  const [girlsCount, setGirlsCount] = useState(0);

  const [vehicles, setVehicles] = useState([
    { plate_number: '', vehicle_type: 'Car', driver_name: '', driver_phone: '' }
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [submittedPassCode, setSubmittedPassCode] = useState(null);
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
    try {
      const res = await createPublicVisitorRegistration({
        host_id: parseInt(hostId),
        full_name: fullName,
        phone,
        email,
        gender,
        photo_url: photoUrl,
        id_type: idType,
        id_card_number: idCardNumber,
        id_card_image_url: idCardImageUrl,
        registration_mode: initialMode,
        visitor_category: category,
        purpose: purpose || 'Visitor Pre-Approval Invite Form',
        valid_from: validFrom,
        valid_until: validUntil,
        adult_men_count: adultMen,
        adult_women_count: adultWomen,
        boys_count: boysCount,
        girls_count: girlsCount,
        children_count: (parseInt(boysCount) || 0) + (parseInt(girlsCount) || 0),
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
    <main className="container" style={{ maxWidth: '640px', marginTop: '1.5rem', marginBottom: '3rem' }}>
      {showCameraModal && (
        <CameraCaptureModal
          onPhotoCaptured={handlePhotoCaptured}
          onClose={() => setShowCameraModal(false)}
        />
      )}

      {/* Header Banner */}
      <div className="card" style={{ borderLeft: '6px solid #d97706', background: 'linear-gradient(135deg, #ffffff 0%, #fffbf0 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.8rem' }}>
          <img
            src="/madhu_sudhan_sai.jpg"
            alt="Sadguru Sri Madhusudan Sai"
            style={{ width: '56px', height: '56px', borderRadius: '50%', border: '2px solid #f59e0b', objectFit: 'cover' }}
          />
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#1e293b', fontWeight: '800' }}>Pre-Approval Guest Invitation</h2>
            <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 'bold' }}>Sathya Sai Grama Visitor Management System</span>
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

        <form onSubmit={handleSubmit}>
          {/* Section 1: Demographics */}
          <h4 style={{ fontSize: '0.9rem', color: '#2563eb', marginTop: '0.5rem' }}>1. Visitor Demographics & Identity</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <label>
              Full Name *
              <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" />
            </label>
            <label>
              Phone / WhatsApp Number *
              <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 9876543210" />
            </label>
            <label>
              Email Address
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
            </label>
            <label>
              Gender *
              <select value={gender} onChange={(e) => setGender(e.target.value)}>
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

          {/* Section 2: Address Proof & Identification */}
          <h4 style={{ fontSize: '0.9rem', color: '#2563eb', marginTop: '1rem' }}>2. Address Proof & Identification</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <label>
              ID / Address Proof Type *
              <select
                value={idType}
                onChange={(e) => setIdType(e.target.value)}
              >
                <optgroup label="Domestic / Indian National Documents">
                  <option value="Aadhaar">Aadhaar Card</option>
                  <option value="Passport">Passport (Indian)</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Voter ID">Voter ID</option>
                  <option value="PAN Card">PAN Card</option>
                  <option value="Govt ID">Government / Employee ID</option>
                </optgroup>
                <optgroup label="Foreign National & International Documents">
                  <option value="Foreign Passport">Foreign Passport</option>
                  <option value="OCI Card">OCI Card (Overseas Citizen of India)</option>
                  <option value="PIO Card">PIO Card (Person of Indian Origin)</option>
                  <option value="Tourist Visa">Tourist / E-Visa Document</option>
                  <option value="Work Student Visa">Work / Student / Business Visa</option>
                  <option value="FRRO Permit">FRRO / FRO Registration Permit</option>
                  <option value="Diplomatic ID">Diplomatic Passport / Identity Card</option>
                  <option value="International Driving Permit">International Driving Permit (IDP)</option>
                </optgroup>
                <optgroup label="Other">
                  <option value="Other">Other Official ID</option>
                </optgroup>
              </select>
            </label>
            <label>
              {idType} Number
              <input type="text" placeholder={`Enter ${idType} Number`} value={idCardNumber} onChange={(e) => setIdCardNumber(e.target.value)} />
            </label>
          </div>

          <div style={{ marginTop: '0.8rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <label style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
              📄 {idType} Document Image Attachment
            </label>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <label className="button" style={{ margin: 0, padding: '0.45rem 1rem', fontSize: '0.82rem', background: '#2563eb', borderColor: '#2563eb', color: 'white', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 'bold' }}>
                <Upload size={15} /> Select ID Document File
                <input type="file" accept="image/*" onChange={handleIdFileUpload} style={{ display: 'none' }} />
              </label>
              <button
                type="button"
                onClick={() => { setCameraTarget('idCard'); setShowCameraModal(true); }}
                style={{ margin: 0, padding: '0.45rem 1rem', fontSize: '0.82rem', background: '#7c3aed', borderColor: '#7c3aed', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 'bold' }}
              >
                <Camera size={15} /> Snap ID Document Camera
              </button>
            </div>

            {idCardImageUrl && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.6rem', padding: '0.5rem', background: '#ffffff', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <img src={idCardImageUrl} alt="ID Preview" style={{ maxWidth: '90px', maxHeight: '55px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                <span style={{ fontSize: '0.8rem', color: '#057a55', fontWeight: 'bold' }}>✓ {idType} Document Attached</span>
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

          <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '0.5rem' }}>
            <strong style={{ fontSize: '0.85rem', color: '#334155' }}>Accompanying Breakdown ({initialMode}):</strong>
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

          <label style={{ marginTop: '1rem' }}>
            Purpose of Visit *
            <textarea rows="2" required value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Meeting Resident, Personal Visit, Darshan"></textarea>
          </label>

          <button
            type="submit"
            disabled={submitting}
            style={{ width: '100%', marginTop: '1.2rem', background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', borderColor: '#d97706', color: 'white', fontWeight: 'bold', fontSize: '1rem', padding: '0.75rem' }}
          >
            {submitting ? 'Submitting Form...' : 'Submit Guest Registration'}
          </button>
        </form>
      </div>
    </main>
  );
}
