import React, { useState, useEffect } from 'react';
import { createRegistration, updateRegistration, getHostRegistrations, updateApproval, getVisitHistory } from '../services/api';
import CameraCaptureModal from '../components/CameraCaptureModal';
import DashboardHeader from '../components/DashboardHeader';
import { UserPlus, CheckCircle, XCircle, Clock, Plus, Trash2, Camera, CreditCard, Users, Car, Calendar, ShieldCheck, KeyRound, Pencil, History } from 'lucide-react';

export default function HostDashboard({ user }) {
  const [registrations, setRegistrations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [editingRegistrationId, setEditingRegistrationId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [visitHistory, setVisitHistory] = useState([]);

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('Male');
  const [photoUrl, setPhotoUrl] = useState('');
  const [idType, setIdType] = useState('Aadhaar');
  const [idCardNumber, setIdCardNumber] = useState('');
  const [idCardImageUrl, setIdCardImageUrl] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [visitType, setVisitType] = useState('HOME');
  const [purpose, setPurpose] = useState('');
  const [stayRequired, setStayRequired] = useState(false);
  const [isVvip, setIsVvip] = useState(false);
  const [cameraTarget, setCameraTarget] = useState('photo'); // 'photo' or 'idCard'

  // PPTX Requirements: Registration Mode (Single/Group), Type & Permanent Pass
  const [registrationMode, setRegistrationMode] = useState('Single');
  const [registrationType, setRegistrationType] = useState('PRE_APPROVAL');
  const [isPermanentPass, setIsPermanentPass] = useState(false);
  const [hasSmartphone, setHasSmartphone] = useState(true);

  // Visit Window (Arrival & Departure)
  const defaultFrom = new Date().toISOString().slice(0, 16);
  const defaultUntil = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString().slice(0, 16);
  const [validFrom, setValidFrom] = useState(defaultFrom);
  const [validUntil, setValidUntil] = useState(defaultUntil);

  // Accompanying Breakdown
  const [adultMen, setAdultMen] = useState(1);
  const [adultWomen, setAdultWomen] = useState(0);
  const [children, setChildren] = useState(0);

  // Multiple Vehicles Array
  const [vehicles, setVehicles] = useState([
    { plate_number: '', vehicle_type: 'Car', driver_name: '', driver_phone: '' }
  ]);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const res = await getHostRegistrations();
      if (res.success) setRegistrations(res.registrations);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVisitHistory = async () => {
    try {
      const res = await getVisitHistory();
      if (res.success) setVisitHistory(res.history);
    } catch (err) {
      console.error(err);
    }
  };

  const addVehicleField = () => {
    setVehicles([...vehicles, { plate_number: '', vehicle_type: 'Car', driver_name: '', driver_phone: '' }]);
  };

  const removeVehicleField = (index) => {
    setVehicles(vehicles.filter((_, i) => i !== index));
  };

  const handleVehicleChange = (index, field, value) => {
    const updated = [...vehicles];
    updated[index][field] = value;
    setVehicles(updated);
  };

  const handleTypeChange = (typeVal) => {
    setRegistrationType(typeVal);
    if (typeVal === 'FREQUENT_VISITOR') {
      setIsPermanentPass(true);
      setCategory('MAID');
    } else if (typeVal === 'DELIVERY_COURIER') {
      setCategory('DELIVERY');
    } else if (typeVal === 'NO_SMARTPHONE') {
      setHasSmartphone(false);
    } else {
      setIsPermanentPass(false);
      setHasSmartphone(true);
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

  const handleStartEdit = (reg) => {
    setEditingRegistrationId(reg.id);
    setFullName(reg.visitor_name || '');
    setPhone(reg.visitor_phone || '');
    setEmail(reg.visitor_email || '');
    setGender(reg.visitor_gender || 'Male');
    setPhotoUrl(reg.photo_url || '');
    setIdType(reg.id_type || 'Aadhaar');
    setIdCardNumber(reg.id_card_number || '');
    setIdCardImageUrl(reg.id_card_image_url || '');
    setCategory(reg.visitor_category || 'GENERAL');
    setVisitType(reg.visit_type || 'HOME');
    setPurpose(reg.purpose || '');
    setStayRequired(reg.stay_required || false);
    setIsVvip(reg.is_vvip || false);
    setRegistrationMode(reg.registration_mode || 'Single');
    setRegistrationType(reg.registration_type || 'PRE_APPROVAL');
    setIsPermanentPass(reg.is_permanent_pass || false);
    setHasSmartphone(reg.has_smartphone !== undefined ? reg.has_smartphone : true);
    if (reg.valid_from) setValidFrom(new Date(reg.valid_from).toISOString().slice(0, 16));
    if (reg.valid_until) setValidUntil(new Date(reg.valid_until).toISOString().slice(0, 16));
    setAdultMen(reg.adult_men_count || 1);
    setAdultWomen(reg.adult_women_count || 0);
    setChildren(reg.children_count || 0);
    setVehicles(reg.vehicles && reg.vehicles.length > 0 ? reg.vehicles : [{ plate_number: '', vehicle_type: 'Car', driver_name: '', driver_phone: '' }]);
    setShowModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    try {
      const payload = {
        full_name: fullName,
        phone,
        email,
        gender,
        photo_url: photoUrl,
        id_type: idType,
        id_number: idCardNumber,
        id_card_number: idCardNumber,
        id_card_image_url: idCardImageUrl,
        visitor_category: category,
        visit_type: visitType,
        purpose,
        stay_required: stayRequired,
        is_vvip: isVvip,
        registration_mode: registrationMode,
        registration_type: registrationType,
        is_permanent_pass: isPermanentPass,
        has_smartphone: hasSmartphone,
        valid_from: validFrom,
        valid_until: validUntil,
        adult_men_count: adultMen,
        adult_women_count: adultWomen,
        children_count: children,
        vehicles: vehicles.filter((v) => v.plate_number.trim() !== ''),
        host_id: user.id,
      };

      if (editingRegistrationId) {
        const res = await updateRegistration(editingRegistrationId, payload);
        if (res.success) {
          setMsg(`Registration #${editingRegistrationId} updated successfully!`);
          setShowModal(false);
          resetForm();
          fetchRegistrations();
        }
      } else {
        const res = await createRegistration(payload);
        if (res.success) {
          setMsg(`Registration created! Pass Code: ${res.registration.pass_code} (${isPermanentPass ? 'PERMANENT PASSCODE' : 'Single Use'})`);
          setShowModal(false);
          resetForm();
          fetchRegistrations();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save registration.');
    }
  };

  const handleAction = async (id, action) => {
    try {
      const res = await updateApproval(id, action, `Action ${action} by Host ${user.name}`);
      if (res.success) {
        fetchRegistrations();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed.');
    }
  };

  const resetForm = () => {
    setEditingRegistrationId(null);
    setFullName('');
    setPhone('');
    setEmail('');
    setPhotoUrl('');
    setIdType('Aadhaar');
    setIdCardNumber('');
    setIdCardImageUrl('');
    setPurpose('');
    setAdultMen(1);
    setAdultWomen(0);
    setChildren(0);
    setRegistrationMode('Single');
    setRegistrationType('PRE_APPROVAL');
    setIsPermanentPass(false);
    setVehicles([{ plate_number: '', vehicle_type: 'Car', driver_name: '', driver_phone: '' }]);
    setIsVvip(false);
  };

  return (
    <div className="container">
      <DashboardHeader
        title="Host Portal (Resident / Employee)"
        subtitle={`Welcome back, ${user.name} | Residency Status: ${user.residency_status || 'Resident'}`}
        roleBadge="RESIDENT / HOST"
        actionButton={
          <button onClick={() => setShowModal(!showModal)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#d97706', borderColor: '#d97706', color: 'white', fontWeight: 'bold' }}>
            <UserPlus size={18} /> Invite / Pre-Register Guest
          </button>
        }
      />

      {msg && <div style={{ background: '#def7ec', color: '#03543f', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem' }}>{msg}</div>}
      {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem' }}>{error}</div>}

      {showCameraModal && (
        <CameraCaptureModal
          onPhotoCaptured={handlePhotoCaptured}
          onClose={() => setShowCameraModal(false)}
        />
      )}

      {showModal && (
        <div className="card" style={{ border: '2px solid #3b82f6' }}>
          <h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', color: '#1e293b' }}>
            {editingRegistrationId ? `✏️ Edit Visitor Invite #${editingRegistrationId} (Before Approval)` : 'Guest Pre-Registration & Visitor Workflow Form'}
          </h3>
          <form onSubmit={handleCreate}>
            {/* PPTX Requirement 1: Registration Type Selector */}
            <div style={{ background: '#eff6ff', padding: '0.75rem', borderRadius: '8px', border: '1px solid #bfdbfe', marginBottom: '1rem' }}>
              <strong style={{ fontSize: '0.85rem', color: '#1e40af' }}>Select Registration Workflow (5 Types):</strong>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', cursor: 'pointer' }}>
                  <input type="radio" name="regType" value="PRE_APPROVAL" checked={registrationType === 'PRE_APPROVAL'} onChange={() => handleTypeChange('PRE_APPROVAL')} />
                  Pre-Approval Registration
                </label>
                <label style={{ fontSize: '0.8rem', cursor: 'pointer' }}>
                  <input type="radio" name="regType" value="SPOT_REGISTRATION" checked={registrationType === 'SPOT_REGISTRATION'} onChange={() => handleTypeChange('SPOT_REGISTRATION')} />
                  Spot Registration at Gate
                </label>
                <label style={{ fontSize: '0.8rem', cursor: 'pointer' }}>
                  <input type="radio" name="regType" value="NO_SMARTPHONE" checked={registrationType === 'NO_SMARTPHONE'} onChange={() => handleTypeChange('NO_SMARTPHONE')} />
                  Visitor Without Smartphone
                </label>
                <label style={{ fontSize: '0.8rem', cursor: 'pointer', color: '#057a55', fontWeight: 'bold' }}>
                  <input type="radio" name="regType" value="FREQUENT_VISITOR" checked={registrationType === 'FREQUENT_VISITOR'} onChange={() => handleTypeChange('FREQUENT_VISITOR')} />
                  Frequent Visitor / Maid (Permanent Passcode)
                </label>
                <label style={{ fontSize: '0.8rem', cursor: 'pointer', color: '#b45309', fontWeight: 'bold' }}>
                  <input type="radio" name="regType" value="DELIVERY_COURIER" checked={registrationType === 'DELIVERY_COURIER'} onChange={() => handleTypeChange('DELIVERY_COURIER')} />
                  Delivery Boy / Courier (Phone Lookup)
                </label>
              </div>
            </div>

            {/* PPTX Requirement 2: Registration Mode (Single vs Group) */}
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', background: '#f8fafc', padding: '0.5rem 1rem', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Registration Mode:</span>
              <label style={{ cursor: 'pointer', fontSize: '0.85rem' }}>
                <input type="radio" name="regMode" value="Single" checked={registrationMode === 'Single'} onChange={(e) => setRegistrationMode(e.target.value)} />
                Single Visitor
              </label>
              <label style={{ cursor: 'pointer', fontSize: '0.85rem' }}>
                <input type="radio" name="regMode" value="Group" checked={registrationMode === 'Group'} onChange={(e) => setRegistrationMode(e.target.value)} />
                Group Visit
              </label>
            </div>

            {/* Section 1: Demographics */}
            <h4 style={{ fontSize: '0.9rem', color: '#2563eb', marginTop: '0.5rem' }}>1. Visitor Demographics & Identity</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem' }}>
              <label>
                Full Name *
                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </label>
              <label>
                Phone Number *
                <input type="text" required value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
              <label>
                Email Address
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <label>
                Gender Selection *
                <select value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              {/* Photo Input with Live Camera Capture & File Upload */}
              <div style={{ gridColumn: 'span 2' }}>
                <label>Visitor Photo (Upload File, Capture Live, or URL)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.5rem', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>📁 Upload Image File:</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoFileUpload}
                      style={{ margin: 0, fontSize: '0.8rem', padding: '0.25rem' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>📷 Camera Capture:</span>
                    <button
                      type="button"
                      onClick={() => { setCameraTarget('photo'); setShowCameraModal(true); }}
                      style={{ width: '100%', margin: 0, background: '#2563eb', borderColor: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.45rem' }}
                    >
                      <Camera size={14} /> Snap Photo
                    </button>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>🔗 Image URL:</span>
                    <input
                      type="text"
                      placeholder="https://.../photo.jpg"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      style={{ margin: 0, fontSize: '0.8rem' }}
                    />
                  </div>
                </div>
                {photoUrl && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
                    <img src={photoUrl} alt="Captured Preview" style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #2563eb' }} />
                    <span style={{ fontSize: '0.75rem', color: '#057a55', fontWeight: 'bold' }}>✓ Photo Attached</span>
                    <button type="button" onClick={() => setPhotoUrl('')} className="secondary outline" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <label>
                Category
                <select
                  value={category}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCategory(val);
                    if (val === 'FOREIGN_NATIONAL' && idType === 'Aadhaar') {
                      setIdType('Foreign Passport');
                    }
                  }}
                >
                  <option value="GENERAL">General Guest</option>
                  <option value="VIP">VIP</option>
                  <option value="VVIP">VVIP</option>
                  <option value="MAID">Domestic Helper / Maid</option>
                  <option value="FREQUENT_VISITOR">Frequent Visitor</option>
                  <option value="DELIVERY">Delivery / Courier</option>
                  <option value="VENDOR">Vendor</option>
                  <option value="FOREIGN_NATIONAL">Foreign National</option>
                </select>
              </label>
            </div>

            {/* Section 2: Address Proof & Identification */}
            <h4 style={{ fontSize: '0.9rem', color: '#2563eb', marginTop: '1rem' }}>2. Address Proof & Identification</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              <label>
                ID / Address Proof Type *
                <select value={idType} onChange={(e) => setIdType(e.target.value)}>
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
                {idType} Number (`idCardNumber`)
                <input
                  type="text"
                  placeholder={`Enter ${idType} Number`}
                  value={idCardNumber}
                  onChange={(e) => setIdCardNumber(e.target.value)}
                />
              </label>
            </div>

            <div style={{ marginTop: '0.8rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <label style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                {idType} Document Image (`idCardImageUrl`) — Select File or Capture from Camera
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.5rem', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.2rem' }}>📁 Choose File:</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleIdFileUpload}
                    style={{ margin: 0, fontSize: '0.8rem', padding: '0.25rem' }}
                  />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.2rem' }}>📷 Camera Capture:</span>
                  <button
                    type="button"
                    onClick={() => { setCameraTarget('idCard'); setShowCameraModal(true); }}
                    style={{ width: '100%', margin: 0, background: '#7c3aed', borderColor: '#7c3aed', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.45rem' }}
                  >
                    <Camera size={14} /> Snap ID Document
                  </button>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.2rem' }}>🔗 Direct Image URL:</span>
                  <input
                    type="text"
                    placeholder="https://.../id_card.jpg"
                    value={idCardImageUrl}
                    onChange={(e) => setIdCardImageUrl(e.target.value)}
                    style={{ margin: 0, fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              {idCardImageUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem', padding: '0.6rem', background: '#ffffff', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <img src={idCardImageUrl} alt="Address Proof Preview" style={{ maxWidth: '120px', maxHeight: '80px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #94a3b8' }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.85rem', color: '#057a55', fontWeight: 'bold' }}>✓ {idType} Document Attached</span>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Ready for security verification.</p>
                  </div>
                  <button type="button" onClick={() => setIdCardImageUrl('')} className="secondary outline" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                    Remove Document
                  </button>
                </div>
              )}
            </div>

            {/* Section 3: Visit Window & Accompanying Breakdown */}
            <h4 style={{ fontSize: '0.9rem', color: '#2563eb', marginTop: '1rem' }}>3. Scheduled Visit Window & Accompanying Breakdown</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              <label>
                Arrival Date/Time (`validFrom`)
                <input type="datetime-local" required value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
              </label>
              <label>
                Departure Date/Time (`validUntil`)
                <input type="datetime-local" required value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
              </label>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '0.5rem' }}>
              <strong style={{ fontSize: '0.85rem', color: '#334155' }}>Accompanying Breakdown ({registrationMode}):</strong>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem', marginTop: '0.4rem' }}>
                <label>
                  Adult Men (👨)
                  <input type="number" min="0" value={adultMen} onChange={(e) => setAdultMen(e.target.value)} />
                </label>
                <label>
                  Adult Women (👩)
                  <input type="number" min="0" value={adultWomen} onChange={(e) => setAdultWomen(e.target.value)} />
                </label>
                <label>
                  Children (👶)
                  <input type="number" min="0" value={children} onChange={(e) => setChildren(e.target.value)} />
                </label>
              </div>
            </div>

            {/* Section 4: Multiple Registered Vehicles */}
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#2563eb', margin: 0 }}>4. Multiple Registered Vehicles</h4>
                <button type="button" onClick={addVehicleField} className="secondary outline" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                  <Plus size={14} /> Add Vehicle
                </button>
              </div>

              {vehicles.map((v, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr 1.2fr 0.4fr', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
                  <input type="text" placeholder="Plate Number (e.g. KA-01-AB-1234)" value={v.plate_number} onChange={(e) => handleVehicleChange(idx, 'plate_number', e.target.value)} />
                  <select value={v.vehicle_type} onChange={(e) => handleVehicleChange(idx, 'vehicle_type', e.target.value)}>
                    <option value="Car">Car</option>
                    <option value="SUV">SUV</option>
                    <option value="Two Wheeler">Two Wheeler</option>
                    <option value="Truck">Truck / Supply</option>
                  </select>
                  <input type="text" placeholder="Driver Name" value={v.driver_name} onChange={(e) => handleVehicleChange(idx, 'driver_name', e.target.value)} />
                  <input type="text" placeholder="Driver Phone" value={v.driver_phone} onChange={(e) => handleVehicleChange(idx, 'driver_phone', e.target.value)} />
                  {vehicles.length > 1 && (
                    <button type="button" onClick={() => removeVehicleField(idx)} className="secondary" style={{ padding: '0.4rem', color: '#dc2626' }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <label style={{ marginTop: '1rem' }}>
              Purpose of Visit *
              <textarea rows="2" required value={purpose} onChange={(e) => setPurpose(e.target.value)}></textarea>
            </label>

            <div style={{ display: 'flex', gap: '2rem', margin: '0.5rem 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#057a55', fontWeight: 'bold' }}>
                <input type="checkbox" checked={isPermanentPass} onChange={(e) => setIsPermanentPass(e.target.checked)} />
                Generate Permanent Passcode (Frequent Visitor / Maid - Can be reused every time)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#99154b', fontWeight: 'bold' }}>
                <input type="checkbox" checked={isVvip} onChange={(e) => setIsVvip(e.target.checked)} />
                Important VVIP Request
              </label>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" style={{ background: editingRegistrationId ? '#2563eb' : undefined, borderColor: editingRegistrationId ? '#2563eb' : undefined }}>
                {editingRegistrationId ? 'Save Changes' : 'Submit Registration'}
              </button>
              <button type="button" className="secondary" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Invited Visitors List */}
      <div className="card">
        <h3>My Invited Visitors ({registrations.length})</h3>
        <table role="grid">
          <thead>
            <tr>
              <th>Pass / Photo</th>
              <th>Visitor Name</th>
              <th>Type / Passcode</th>
              <th>Visit Window</th>
              <th>Breakdown</th>
              <th>Vehicles</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {registrations.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', color: '#64748b' }}>No registrations found.</td>
              </tr>
            ) : (
              registrations.map((reg) => (
                <tr key={reg.id}>
                  <td>
                    {reg.photo_url ? (
                      <img src={reg.photo_url} alt="Visitor" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
                        No Pic
                      </div>
                    )}
                  </td>
                  <td>
                    <strong>{reg.visitor_name}</strong><br/>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{reg.visitor_phone}</span>
                  </td>
                  <td>
                    <strong>{reg.pass_code}</strong><br/>
                    {reg.is_permanent_pass ? (
                      <span className="badge badge-approved" style={{ fontSize: '0.65rem' }}>PERMANENT PASS</span>
                    ) : (
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{reg.registration_type}</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.75rem' }}>
                    From: {new Date(reg.valid_from).toLocaleString()}<br/>
                    Until: {new Date(reg.valid_until).toLocaleString()}
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>
                    👨 {reg.adult_men_count || 1} | 👩 {reg.adult_women_count || 0} | 👶 {reg.children_count || 0}
                  </td>
                  <td style={{ fontSize: '0.75rem' }}>
                    {reg.vehicles && reg.vehicles.length > 0 ? (
                      reg.vehicles.map((v, i) => <div key={i}>🚘 {v.plate_number} ({v.vehicle_type})</div>)
                    ) : (
                      <span style={{ color: '#94a3b8' }}>None</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge badge-${reg.status.toLowerCase()}`}>{reg.status}</span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                      {reg.status.startsWith('PENDING_') && (
                        <button className="secondary outline" onClick={() => handleStartEdit(reg)} style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', color: '#2563eb', borderColor: '#2563eb' }} title="Edit invitation details before approval">
                          <Pencil size={14} /> Edit
                        </button>
                      )}
                      {reg.status === 'PENDING_L1' && (
                        <>
                          <button className="outline" onClick={() => handleAction(reg.id, 'APPROVE')} style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                            <CheckCircle size={14} /> Approve
                          </button>
                          <button className="secondary outline" onClick={() => handleAction(reg.id, 'REJECT')} style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                            <XCircle size={14} /> Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Visit History Section */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={20} /> Visit History
          </h3>
          <button
            onClick={() => { setShowHistory(!showHistory); if (!showHistory) fetchVisitHistory(); }}
            className="secondary outline"
            style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}
          >
            {showHistory ? 'Hide History' : 'Show Visit History'}
          </button>
        </div>
        {showHistory && (
          <table role="grid" style={{ marginTop: '1rem' }}>
            <thead>
              <tr>
                <th>Pass Code</th>
                <th>Visitor Name</th>
                <th>Category</th>
                <th>Entry Time</th>
                <th>Exit Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {visitHistory.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: '#64748b' }}>No visit history found.</td>
                </tr>
              ) : (
                visitHistory.map((visit) => (
                  <tr key={visit.id}>
                    <td><strong>{visit.pass_code}</strong></td>
                    <td>{visit.visitor_name}</td>
                    <td>{visit.visitor_category}</td>
                    <td style={{ fontSize: '0.8rem' }}>
                      {visit.entry_time ? new Date(visit.entry_time).toLocaleString() : '—'}
                      {visit.entry_gate && <span style={{ fontSize: '0.7rem', color: '#64748b' }}><br/>{visit.entry_gate}</span>}
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>
                      {visit.exit_time ? new Date(visit.exit_time).toLocaleString() : '—'}
                      {visit.exit_gate && <span style={{ fontSize: '0.7rem', color: '#64748b' }}><br/>{visit.exit_gate}</span>}
                    </td>
                    <td>
                      <span className={`badge badge-${visit.status.toLowerCase()}`}>{visit.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
