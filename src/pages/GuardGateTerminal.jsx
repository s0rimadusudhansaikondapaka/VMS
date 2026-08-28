import React, { useState, useEffect } from 'react';
import { verifyGatePass, processGateMovement, createRegistration, getSpotRegistrationsQueue, assignSpotHost, getAdminUsers, updateApproval } from '../services/api';
import DashboardHeader from '../components/DashboardHeader';
import QrScannerModal from '../components/QrScannerModal';
import { useTablePagination, PaginationControls } from '../components/TablePagination';
import { ShieldCheck, LogIn, LogOut, Search, UserCheck, AlertTriangle, Car, Users, Calendar, Camera, Phone, KeyRound, UserPlus, QrCode, Share2, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function GuardGateTerminal({ user }) {
  const [gateName, setGateName] = useState('NORTH_GATE');
  const [searchQuery, setSearchQuery] = useState('');
  const [passData, setPassData] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCameraScanner, setShowCameraScanner] = useState(false);

  // Gate Spot Registration Queue & QR Modal State
  const [showGateSpotQrModal, setShowGateSpotQrModal] = useState(false);
  const [spotQueue, setSpotQueue] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [assignedHosts, setAssignedHosts] = useState({});

  const {
    searchTerm: spotSearch,
    setSearchTerm: setSpotSearch,
    currentPage: spotPage,
    setCurrentPage: setSpotPage,
    totalPages: spotTotalPages,
    totalItems: spotTotalItems,
    paginatedData: paginatedSpotQueue,
  } = useTablePagination(spotQueue, ['visitor_name', 'visitor_phone', 'pass_code', 'host_name', 'purpose'], 10);

  useEffect(() => {
    fetchSpotQueue();
    fetchUsersList();

    const handleRealtimeSync = (e) => {
      console.log('[GuardGateTerminal] Realtime Event Received:', e.detail);
      fetchSpotQueue();
      if (passData && passData.pass_code) {
        executePassVerification(passData.pass_code);
      }
    };

    window.addEventListener('vms_realtime_sync', handleRealtimeSync);
    return () => window.removeEventListener('vms_realtime_sync', handleRealtimeSync);
  }, [passData]);

  const fetchSpotQueue = async () => {
    try {
      const res = await getSpotRegistrationsQueue();
      if (res.success) setSpotQueue(res.spot_requests);
    } catch (err) {
      console.error('Failed to fetch spot queue:', err);
    }
  };

  const fetchUsersList = async () => {
    try {
      const res = await getAdminUsers();
      if (res.success) setAdminUsers(res.users);
    } catch (err) {
      console.error('Failed to fetch admin users:', err);
    }
  };

  const handleAssignHost = async (registrationId) => {
    const hostId = assignedHosts[registrationId];
    if (!hostId) {
      alert('Please select a Resident / Employee / PRO to assign.');
      return;
    }
    try {
      const res = await assignSpotHost(registrationId, parseInt(hostId), 'Host assigned by Gate Security Guard');
      if (res.success) {
        alert(res.message);
        fetchSpotQueue();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign host.');
    }
  };

  // Editable Accompanying Breakdown fields allowed for Security Guard
  const [adultMen, setAdultMen] = useState(1);
  const [adultWomen, setAdultWomen] = useState(0);
  const [boysCount, setBoysCount] = useState(0);
  const [girlsCount, setGirlsCount] = useState(0);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [remarks, setRemarks] = useState('');

  const [showAssistedEntry, setShowAssistedEntry] = useState(false);
  const [assistedName, setAssistedName] = useState('');
  const handleSupervisorOverrideApprove = async (spot) => {
    try {
      const res = await updateApproval(
        spot.id,
        'APPROVE',
        `SO / Supervisor override approval on behalf of non-responding host by ${user.name}`,
        { priority: 'P3' }
      );
      if (res.success) {
        setMsg(`Approved visitor ${spot.visitor_name} on behalf of host/PRO. Notification sent to host!`);
        fetchSpotQueue();
        setSearchQuery(spot.pass_code);
        executePassVerification(spot.pass_code);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Supervisor override approval failed.');
    }
  };
  const [assistedPurpose, setAssistedPurpose] = useState('');
  const [assistedHostName, setAssistedHostName] = useState('');

  const executePassVerification = async (queryToVerify) => {
    if (!queryToVerify || !queryToVerify.trim()) return;
    setError('');
    setMsg('');
    setLoading(true);
    try {
      const res = await verifyGatePass(queryToVerify.trim(), activeGate);
      if (res.success) {
        setPassData(res.pass);
        setAdultMen(res.pass.adult_men_count || 1);
        setAdultWomen(res.pass.adult_women_count || 0);
        setBoysCount(res.pass.boys_count || 0);
        setGirlsCount(res.pass.girls_count || 0);
        setSelectedVehicle(res.pass.vehicles && res.pass.vehicles.length > 0 ? res.pass.vehicles[0].plate_number : res.pass.registered_vehicle_no || '');
      } else {
        setError(res.message);
        setPassData(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Pass not found for query: ' + queryToVerify);
      setPassData(null);
    } finally {
      setLoading(false);
    }
  };

  const parsePassCodeFromInput = (rawText) => {
    if (!rawText) return '';
    let clean = rawText.trim();
    if (clean.startsWith('{') && clean.endsWith('}')) {
      try {
        const parsed = JSON.parse(clean);
        if (parsed.passCode || parsed.pass_code) {
          return (parsed.passCode || parsed.pass_code).trim();
        }
      } catch (e) {}
    }
    if (clean.includes('pass=')) {
      const match = clean.match(/pass=([A-Za-z0-9_-]+)/);
      if (match) return match[1];
    } else if (clean.includes('/pass/')) {
      const match = clean.match(/\/pass\/([A-Za-z0-9_-]+)/);
      if (match) return match[1];
    }
    return clean;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const cleanCode = parsePassCodeFromInput(searchQuery);
    setSearchQuery(cleanCode);
    executePassVerification(cleanCode);
  };

  const handleQrScanSuccess = (scannedCode) => {
    const cleanCode = parsePassCodeFromInput(scannedCode);
    setSearchQuery(cleanCode);
    executePassVerification(cleanCode);
  };

  const handleMovement = async (direction) => {
    if (!passData) return;
    setError('');
    setMsg('');
    try {
      const res = await processGateMovement({
        registration_id: passData.id,
        gate_name: gateName,
        direction,
        adult_men_count: adultMen,
        adult_women_count: adultWomen,
        boys_count: boysCount,
        girls_count: girlsCount,
        children_count: (parseInt(boysCount) || 0) + (parseInt(girlsCount) || 0),
        vehicle_no: selectedVehicle,
        remarks,
      });

      if (res.success) {
        setMsg(res.message);
        setPassData((prev) => ({ ...prev, status: res.status }));
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to process ${direction} movement.`);
    }
  };

  const handleAssistedEntry = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    try {
      const res = await createRegistration({
        full_name: assistedName,
        phone: assistedPhone,
        purpose: assistedPurpose || 'Spot Registration (Assisted Entry - No Smartphone)',
        visitor_category: 'GENERAL',
        visit_type: 'HOME',
        registration_type: 'SPOT_REGISTRATION',
        has_smartphone: false,
        is_spot_registration: true,
        valid_from: new Date().toISOString(),
        valid_until: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        adult_men_count: 1,
        adult_women_count: 0,
        children_count: 0,
        vehicles: [],
      });
      if (res.success) {
        setMsg(`Assisted entry registration created! Pass Code: ${res.registration.pass_code}. Awaiting host/supervisor approval.`);
        setShowAssistedEntry(false);
        setAssistedName('');
        setAssistedPhone('');
        setAssistedPurpose('');
        setAssistedHostName('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Assisted entry registration failed.');
    }
  };

  const quickSearchPhone = (phoneNum) => {
    setSearchQuery(phoneNum);
  };

  return (
    <div className="container">
      <DashboardHeader
        title="Security Gate Terminal"
        subtitle={`Active Guard: ${user.name} | Gate Ingress & Egress Verification`}
        roleBadge="SECURITY GUARD"
        actionButton={
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowGateSpotQrModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#2563eb', borderColor: '#2563eb', color: 'white', fontWeight: 'bold', fontSize: '0.85rem' }}
            >
              <QrCode size={16} /> 📱 Gate Spot QR Code
            </button>

            <div style={{ background: '#ffffff', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid #fcd34d' }}>
              <label style={{ margin: 0, fontWeight: 'bold', fontSize: '0.82rem', color: '#78350f' }}>
                Active Gate:
                <select value={gateName} onChange={(e) => setGateName(e.target.value)} style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', padding: '0.2rem 0.5rem' }}>
                  <option value="NORTH_GATE">North Gate (Primary Ingress)</option>
                  <option value="EAST_GATE">East Gate (Primary Egress)</option>
                  <option value="WEST_GATE">West Gate (Construction & Material)</option>
                  <option value="SOUTH_GATE">South Gate (Restricted - Security Head)</option>
                </select>
              </label>
            </div>
          </div>
        }
      />

      <div className="card">
        <h3>Verify Visitor Gate Pass</h3>
        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Search by <strong>Passcode (e.g. PASS-1001, MAID-PERM-5001)</strong>, <strong>Delivery Boy Phone Number (+91 9933445566)</strong>, <strong>Vehicle Plate No</strong>, or <strong>QR Code scan</strong>.
        </p>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.8rem', width: '100%', flexWrap: 'wrap', margin: '1rem 0' }}>
          <div style={{ flex: '1 1 320px', minWidth: '280px' }}>
            <input
              type="text"
              placeholder="Scan QR Code / Pass Code / Mobile No / Vehicle No / Maid / Delivery"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', margin: 0, fontSize: '0.95rem', height: '48px', background: '#ffffff', color: '#0f172a', border: '2px solid #2563eb', borderRadius: '8px', padding: '0 1rem' }}
            />
          </div>
          <button type="submit" disabled={loading} style={{ margin: 0, minWidth: '150px', height: '48px', background: '#2563eb', borderColor: '#2563eb', color: 'white', fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', borderRadius: '8px' }}>
            <Search size={18} /> Verify Pass
          </button>
          <button
            type="button"
            onClick={() => setShowCameraScanner(true)}
            style={{ margin: 0, minWidth: '160px', height: '48px', background: '#7c3aed', borderColor: '#7c3aed', color: 'white', fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', borderRadius: '8px' }}
          >
            <Camera size={18} /> 📷 Scan QR Code
          </button>
        </form>

        {/* Verification Category Shortcuts */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.5rem', background: '#f8fafc', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.78rem', color: '#334155', fontWeight: 'bold', width: '100%', marginBottom: '0.2rem' }}>Quick Gate Verification Lookups:</span>
          <button type="button" className="secondary outline" onClick={() => quickSearchPhone('PASS-1001')} style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem', background: '#white' }}>
            <KeyRound size={14} /> Single Visitor Pass (PASS-1001)
          </button>
          <button type="button" className="secondary outline" onClick={() => quickSearchPhone('MAID-PERM-5001')} style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}>
            <UserCheck size={14} /> Maid Permanent Pass (MAID-PERM-5001)
          </button>
          <button type="button" className="secondary outline" onClick={() => quickSearchPhone('+91 9933445566')} style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}>
            <Phone size={14} /> Delivery Boy Lookup (+91 9933445566)
          </button>
          <button type="button" className="secondary outline" onClick={() => quickSearchPhone('KA-01-MJ-9999')} style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}>
            <Car size={14} /> Vehicle Plate Lookup (KA-01-MJ-9999)
          </button>
        </div>

        {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '6px', marginTop: '1rem' }}>{error}</div>}
        {msg && <div style={{ background: '#def7ec', color: '#03543f', padding: '0.75rem', borderRadius: '6px', marginTop: '1rem' }}>{msg}</div>}
      </div>

      {/* Assisted Entry for Non-Smartphone Visitors */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#7c3aed' }}>
            <UserPlus size={20} /> Assisted Entry (Non-Smartphone Visitors)
          </h3>
          <button
            onClick={() => setShowAssistedEntry(!showAssistedEntry)}
            style={{ background: '#7c3aed', borderColor: '#7c3aed', color: 'white', fontSize: '0.82rem', padding: '0.35rem 0.8rem' }}
          >
            {showAssistedEntry ? 'Close' : 'Register Visitor'}
          </button>
        </div>
        <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0.3rem 0 0 0' }}>
          Use this to register visitors who don't have a smartphone. Guard fills in details on their behalf.
        </p>
        {showAssistedEntry && (
          <form onSubmit={handleAssistedEntry} style={{ marginTop: '1rem', background: '#f5f3ff', padding: '1rem', borderRadius: '8px', border: '1px solid #ddd6fe' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              <label>
                Visitor Name *
                <input type="text" required value={assistedName} onChange={(e) => setAssistedName(e.target.value)} placeholder="Full Name" />
              </label>
              <label>
                Phone Number *
                <input type="tel" required value={assistedPhone} onChange={(e) => setAssistedPhone(e.target.value)} placeholder="+91 9876543210" />
              </label>
            </div>
            <label style={{ marginTop: '0.5rem' }}>
              Purpose of Visit *
              <input type="text" required value={assistedPurpose} onChange={(e) => setAssistedPurpose(e.target.value)} placeholder="e.g. Meeting Resident, Delivery, Tour" />
            </label>
            <label style={{ marginTop: '0.5rem' }}>
              Host / Resident Name (if known)
              <input type="text" value={assistedHostName} onChange={(e) => setAssistedHostName(e.target.value)} placeholder="Name of person they are visiting" />
            </label>
            <button type="submit" style={{ marginTop: '1rem', width: '100%', background: '#7c3aed', borderColor: '#7c3aed', color: 'white', fontWeight: 'bold' }}>
              Submit Assisted Entry Registration
            </button>
          </form>
        )}
      </div>

      {passData && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
            <div>
              <h3 style={{ margin: 0 }}>Pass Verification Details</h3>
              {passData.is_permanent_pass && (
                <span className="badge badge-approved" style={{ marginTop: '0.3rem' }}>
                  PERMANENT PASSCODE (Reusable Daily)
                </span>
              )}
            </div>
            <div>
              {passData.is_vvip && <span className="badge badge-vvip">IMPORTANT VVIP</span>}
              <span className={`badge badge-${passData.status.toLowerCase()}`} style={{ marginLeft: '0.5rem' }}>
                Status: {passData.status}
              </span>
            </div>
          </div>

          {/* Authorized & Allowed Gates List Banner */}
          <div style={{
            background: passData.is_current_gate_allowed === false ? '#fef2f2' : '#f0fdf4',
            border: `2px solid ${passData.is_current_gate_allowed === false ? '#ef4444' : '#22c55e'}`,
            borderRadius: '10px',
            padding: '0.85rem 1rem',
            marginTop: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h4 style={{
                margin: 0,
                fontSize: '0.98rem',
                color: passData.is_current_gate_allowed === false ? '#b91c1c' : '#15803d',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}>
                {passData.is_current_gate_allowed === false ? (
                  <>⛔ Category Restricted at Current Gate ({activeGate.replace('_', ' ')})</>
                ) : (
                  <>✅ Category Allowed at Current Gate ({activeGate.replace('_', ' ')})</>
                )}
              </h4>
              <span className="badge" style={{
                background: passData.is_current_gate_allowed === false ? '#fee2e2' : '#dcfce7',
                color: passData.is_current_gate_allowed === false ? '#991b1b' : '#166534',
                fontWeight: 'bold',
              }}>
                Category: {passData.visitor_category || 'GENERAL'}
              </span>
            </div>

            {passData.is_current_gate_allowed === false && (
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#991b1b', fontWeight: 'bold' }}>
                ⚠️ Visitor category '{passData.visitor_category}' is NOT ALLOWED at {activeGate.replace('_', ' ')}. Please direct visitor to one of the authorized gates listed below.
              </p>
            )}

            <div style={{ marginTop: '0.3rem' }}>
              <strong style={{ fontSize: '0.82rem', color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                📍 Authorized & Allowed Gates for '{passData.visitor_category || 'GENERAL'}' Category ({passData.allowed_gates ? passData.allowed_gates.length : 0} Gates):
              </strong>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {passData.allowed_gates && passData.allowed_gates.length > 0 ? (
                  passData.allowed_gates.map((g) => (
                    <span
                      key={g}
                      style={{
                        background: g === activeGate ? '#15803d' : '#2563eb',
                        color: 'white',
                        fontSize: '0.75rem',
                        padding: '0.22rem 0.65rem',
                        borderRadius: '20px',
                        fontWeight: 'bold',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        boxShadow: g === activeGate ? '0 0 0 2px #bbf7d0' : 'none',
                      }}
                    >
                      ✓ {g.replace('_', ' ')} {g === activeGate ? '(Current Gate)' : ''}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: 'bold' }}>None (Disabled across all gates by Super Admin)</span>
                )}
              </div>
            </div>
          </div>

          {/* Approved By Approver Tracking Badge */}
          {(passData.status === 'APPROVED' || passData.status === 'INSIDE_CAMPUS') && (
            <div style={{ marginTop: '0.85rem', background: '#ecfdf5', border: '1.5px solid #34d399', padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.88rem', color: '#065f46', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={18} color="#059669" />
                <span>
                  <strong>Pass Approved By:</strong> {passData.approved_by_display || passData.approved_by_name || 'Authorized Host/Admin'}
                </span>
              </div>
              <span className="badge badge-approved" style={{ fontSize: '0.7rem' }}>VERIFIED APPROVAL</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.5rem', marginTop: '1rem' }}>
            {/* Read-Only Credentials & Photos */}
            <div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>
                {passData.photo_url ? (
                  <img src={passData.photo_url} alt="Visitor Photo" style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', border: '2px solid #3b82f6' }} />
                ) : (
                  <div style={{ width: '80px', height: '80px', borderRadius: '8px', background: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                    No Photo
                  </div>
                )}
                <div>
                  <h4 style={{ margin: 0, color: '#1e293b' }}>{passData.visitor_name}</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Category: <strong>{passData.visitor_category}</strong></p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Gender: <strong>{passData.visitor_gender || 'Male'}</strong></p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Phone: <strong>{passData.visitor_phone}</strong></p>
                </div>
              </div>

              <h4 style={{ fontSize: '0.9rem', color: '#475569', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.3rem' }}>
                Address Proof & Identity (`idCardNumber`)
              </h4>
              <p style={{ margin: '0.4rem 0' }}><strong>Aadhaar Card No:</strong> {passData.id_card_number || passData.id_number || 'Verified'}</p>
              {passData.id_card_image_url && (
                <div style={{ marginTop: '0.4rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Aadhaar Card Image:</span><br/>
                  <img src={passData.id_card_image_url} alt="Aadhaar Proof" style={{ maxWidth: '200px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
              )}

              <h4 style={{ fontSize: '0.9rem', color: '#475569', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.3rem', marginTop: '1rem' }}>
                Scheduled Visit Window
              </h4>
              <p style={{ margin: '0.3rem 0', fontSize: '0.85rem' }}>
                <Calendar size={14} /> <strong>Arrival (`validFrom`):</strong> {new Date(passData.valid_from).toLocaleString()}
              </p>
              <p style={{ margin: '0.3rem 0', fontSize: '0.85rem' }}>
                <Calendar size={14} /> <strong>Departure (`validUntil`):</strong> {new Date(passData.valid_until).toLocaleString()}
              </p>
              <p style={{ margin: '0.4rem 0' }}><strong>Purpose:</strong> {passData.purpose}</p>
              <p style={{ margin: '0.4rem 0' }}><strong>Designated Host:</strong> {passData.host_name || 'N/A'}</p>
              <p style={{ margin: '0.4rem 0', fontSize: '0.85rem', color: '#64748b' }}>
                <strong>Host Phone (Masked):</strong> {passData.host_phone_masked}
              </p>
            </div>

            {/* Editable Fields & Vehicle Selection */}
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <h4 style={{ fontSize: '0.95rem', color: '#1e293b', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.3rem' }}>
                Accompanying Breakdown & Gate Modifications
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.4rem', marginTop: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem' }}>
                  Adult Men (👨)
                  <input type="number" min="0" value={adultMen} onChange={(e) => setAdultMen(e.target.value)} />
                </label>
                <label style={{ fontSize: '0.8rem' }}>
                  Adult Women (👩)
                  <input type="number" min="0" value={adultWomen} onChange={(e) => setAdultWomen(e.target.value)} />
                </label>
                <label style={{ fontSize: '0.8rem' }}>
                  Boys (👦)
                  <input type="number" min="0" value={boysCount} onChange={(e) => setBoysCount(e.target.value)} />
                </label>
                <label style={{ fontSize: '0.8rem' }}>
                  Girls (👧)
                  <input type="number" min="0" value={girlsCount} onChange={(e) => setGirlsCount(e.target.value)} />
                </label>
              </div>

              <div style={{ background: '#e2e8f0', padding: '0.4rem 0.8rem', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', margin: '0.5rem 0', fontSize: '0.85rem' }}>
                Total People Entering: {(parseInt(adultMen) || 0) + (parseInt(adultWomen) || 0) + (parseInt(boysCount) || 0) + (parseInt(girlsCount) || 0)} (Children: {(parseInt(boysCount) || 0) + (parseInt(girlsCount) || 0)})
              </div>

              <h4 style={{ fontSize: '0.9rem', color: '#1e293b', marginTop: '1rem' }}>
                Registered Vehicles ({passData.vehicles?.length || 0})
              </h4>
              {passData.vehicles && passData.vehicles.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.8rem' }}>
                  {passData.vehicles.map((v, i) => (
                    <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="selectedVehicle"
                        value={v.plate_number}
                        checked={selectedVehicle === v.plate_number}
                        onChange={(e) => setSelectedVehicle(e.target.value)}
                      />
                      <span><strong>{v.plate_number}</strong> ({v.vehicle_type}) - Driver: {v.driver_name || 'Owner'}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="Enter Vehicle Plate Number"
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                />
              )}

              <label style={{ marginTop: '0.5rem' }}>
                Gate Guard Remarks:
                <input
                  type="text"
                  placeholder="Optional gate log remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button
              onClick={() => handleMovement('IN')}
              disabled={passData.status === 'INSIDE_CAMPUS' || passData.is_current_gate_allowed === false}
              className="gate-btn-in"
              data-tooltip={passData.is_current_gate_allowed === false ? `Category ${passData.visitor_category} disabled at ${activeGate}` : 'Record visitor entry IN at gate'}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                opacity: (passData.status === 'INSIDE_CAMPUS' || passData.is_current_gate_allowed === false) ? 0.55 : 1,
                cursor: (passData.status === 'INSIDE_CAMPUS' || passData.is_current_gate_allowed === false) ? 'not-allowed' : 'pointer',
                background: (passData.status === 'INSIDE_CAMPUS' || passData.is_current_gate_allowed === false) ? '#64748b' : undefined,
                borderColor: (passData.status === 'INSIDE_CAMPUS' || passData.is_current_gate_allowed === false) ? '#64748b' : undefined,
              }}
            >
              <LogIn size={20} />
              {passData.is_current_gate_allowed === false ? '⛔ Restricted at this Gate' : passData.status === 'INSIDE_CAMPUS' ? '✓ Already Inside Campus (IN)' : 'Record Ingress (IN)'}
            </button>
            <button
              onClick={() => handleMovement('OUT')}
              disabled={passData.status === 'CHECKED_OUT'}
              className="gate-btn-out"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                gap: '0.5rem',
                opacity: passData.status === 'CHECKED_OUT' ? 0.55 : 1,
                cursor: passData.status === 'CHECKED_OUT' ? 'not-allowed' : 'pointer',
                background: passData.status === 'CHECKED_OUT' ? '#475569' : undefined,
                borderColor: passData.status === 'CHECKED_OUT' ? '#475569' : undefined,
              }}
            >
              <LogOut size={20} />
              {passData.status === 'CHECKED_OUT' ? '✓ Already Checked Out (OUT)' : 'Record Egress (OUT)'}
            </button>
          </div>
        </div>
      )}

      {/* Spot Registration Queue & Host/PRO Assignment Card */}
      <div className="card" style={{ marginTop: '1.5rem', borderTop: '4px solid #2563eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
          <div>
            <h3 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserCheck size={20} color="#2563eb" /> Gate Spot Registrations Queue ({spotQueue.length})
            </h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
              Visitors who scanned the Gate Spot QR Code and submitted form at the gate. Select Host/PRO to route approval request.
            </p>
          </div>
          <button type="button" onClick={fetchSpotQueue} className="secondary outline" style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem' }}>
            🔄 Refresh Queue
          </button>
        </div>

        <PaginationControls
          searchTerm={spotSearch}
          setSearchTerm={setSpotSearch}
          currentPage={spotPage}
          setCurrentPage={setSpotPage}
          totalPages={spotTotalPages}
          totalItems={spotTotalItems}
          pageSize={10}
          placeholder="Filter queue by Visitor Name, Phone, Passcode, Host..."
        />

        <table role="grid">
          <thead>
            <tr>
              <th>Passcode / Visitor</th>
              <th>Category & Purpose</th>
              <th>Accompanying</th>
              <th>Assigned Host / PRO</th>
              <th>Approval Status</th>
              <th>Guard Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedSpotQueue.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: '#64748b', padding: '1rem' }}>
                  No spot registrations found matching search filter.
                </td>
              </tr>
            ) : (
              paginatedSpotQueue.map((spot) => (
                <tr key={spot.id}>
                  <td>
                    <strong>{spot.pass_code}</strong><br/>
                    <span style={{ fontSize: '0.85rem' }}>{spot.visitor_name}</span><br/>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{spot.visitor_phone}</span>
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>
                    <span className="badge badge-pending" style={{ fontSize: '0.65rem' }}>{spot.visitor_category}</span><br/>
                    <span style={{ color: '#475569' }}>{spot.purpose}</span>
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>
                    👨 {spot.adult_men_count || 1} | 👩 {spot.adult_women_count || 0} | 👦 {spot.boys_count || 0} | 👧 {spot.girls_count || 0}
                  </td>
                  <td>
                    {spot.host_name ? (
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#15803d' }}>
                        ✓ {spot.host_name} ({spot.department || 'Ashram'})
                      </span>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                        <select
                          value={assignedHosts[spot.id] || ''}
                          onChange={(e) => setAssignedHosts({ ...assignedHosts, [spot.id]: e.target.value })}
                          style={{ fontSize: '0.78rem', padding: '0.2rem', margin: 0, flex: 1 }}
                        >
                          <option value="">-- Select Host / PRO --</option>
                          {adminUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} [{u.flat_info || u.address ? `${u.flat_info || u.address}` : (u.department || u.role)}]
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleAssignHost(spot.id)}
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', margin: 0 }}
                        >
                          Assign
                        </button>
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`badge badge-${spot.status.toLowerCase()}`}>
                      {spot.status === 'PENDING_L1' ? 'PENDING HOST APPROVAL' : spot.status}
                    </span>
                  </td>
                  <td>
                    {spot.status === 'APPROVED' ? (
                      <button
                        type="button"
                        className="gate-btn-in"
                        onClick={() => { setSearchQuery(spot.pass_code); executePassVerification(spot.pass_code); }}
                        style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                        IN Button & Allow
                      </button>
                    ) : spot.status === 'REJECTED' ? (
                      <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 'bold' }}>
                        ❌ DO NOT ALLOW VISITOR
                      </span>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <span style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 'bold' }}>
                          ⏳ Awaiting Host Response
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSupervisorOverrideApprove(spot)}
                          style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem', background: '#d97706', borderColor: '#d97706', color: 'white', fontWeight: 'bold', borderRadius: '4px' }}
                          title="If resident/Employee/PRO does not respond, SO & Supervisor can approve on their behalf"
                        >
                          ⚡ SO/Supervisor Approve
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Gate Spot QR Code Poster Modal */}
      {showGateSpotQrModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', background: 'linear-gradient(180deg, #ffffff 0%, #eff6ff 100%)' }}>
            <h3 style={{ margin: '0 0 0.4rem 0', color: '#1e293b' }}>Gate Spot Visitor Registration QR</h3>
            <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0 0 1rem 0' }}>
              Ask arriving visitors at the gate to scan this QR code with their mobile phone camera to fill out their details.
            </p>

            <div style={{ background: '#ffffff', padding: '1.2rem', borderRadius: '12px', border: '3px solid #2563eb', margin: '1rem 0', boxShadow: '0 10px 25px rgba(37,99,235,0.15)' }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/?invite=true&mode=Spot`)}`}
                alt="Gate Spot Visitor Registration QR Code"
                style={{ width: '200px', height: '200px', margin: '0 auto 0.8rem auto', display: 'block', borderRadius: '8px' }}
              />
              <span style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 'bold', display: 'block' }}>
                SCAN WITH MOBILE CAMERA TO REGISTER AT GATE
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/?invite=true&mode=Spot`);
                  alert('Gate Spot Form URL copied to clipboard!');
                }}
                style={{ flex: 1, fontSize: '0.82rem', padding: '0.5rem' }}
              >
                📋 Copy Form Link
              </button>
              <button
                type="button"
                className="secondary outline"
                onClick={() => setShowGateSpotQrModal(false)}
                style={{ flex: 1, fontSize: '0.82rem', padding: '0.5rem' }}
              >
                Close Poster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Camera QR Code Scanner Modal */}
      <QrScannerModal
        isOpen={showCameraScanner}
        onClose={() => setShowCameraScanner(false)}
        onScanSuccess={handleQrScanSuccess}
      />
    </div>
  );
}
