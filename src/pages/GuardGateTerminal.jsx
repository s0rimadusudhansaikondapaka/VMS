import React, { useState } from 'react';
import { verifyGatePass, processGateMovement, createRegistration } from '../services/api';
import DashboardHeader from '../components/DashboardHeader';
import { ShieldCheck, LogIn, LogOut, Search, UserCheck, AlertTriangle, Car, Users, Calendar, Camera, Phone, KeyRound, UserPlus } from 'lucide-react';

export default function GuardGateTerminal({ user }) {
  const [gateName, setGateName] = useState('NORTH_GATE');
  const [searchQuery, setSearchQuery] = useState('');
  const [passData, setPassData] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Editable Accompanying Breakdown fields allowed for Security Guard
  const [adultMen, setAdultMen] = useState(1);
  const [adultWomen, setAdultWomen] = useState(0);
  const [children, setChildren] = useState(0);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [remarks, setRemarks] = useState('');

  const [showAssistedEntry, setShowAssistedEntry] = useState(false);
  const [assistedName, setAssistedName] = useState('');
  const [assistedPhone, setAssistedPhone] = useState('');
  const [assistedPurpose, setAssistedPurpose] = useState('');
  const [assistedHostName, setAssistedHostName] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setError('');
    setMsg('');
    setLoading(true);
    try {
      const res = await verifyGatePass(searchQuery.trim());
      if (res.success) {
        setPassData(res.pass);
        setAdultMen(res.pass.adult_men_count || 1);
        setAdultWomen(res.pass.adult_women_count || 0);
        setChildren(res.pass.children_count || 0);
        setSelectedVehicle(res.pass.vehicles && res.pass.vehicles.length > 0 ? res.pass.vehicles[0].plate_number : res.pass.registered_vehicle_no || '');
      } else {
        setError(res.message);
        setPassData(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Pass not found for query: ' + searchQuery);
      setPassData(null);
    } finally {
      setLoading(false);
    }
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
        children_count: children,
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
        }
      />

      <div className="card">
        <h3>Verify Visitor Gate Pass</h3>
        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Search by <strong>Passcode (e.g. PASS-1001, MAID-PERM-5001)</strong>, <strong>Delivery Boy Phone Number (+91 9933445566)</strong>, <strong>Vehicle Plate No</strong>, or <strong>QR Code scan</strong>.
        </p>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem' }}>
          <input
            type="text"
            placeholder="Scan QR Code or enter Pass Code / Phone Number / Vehicle No"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, margin: 0 }}
          />
          <button type="submit" disabled={loading} style={{ margin: 0, minWidth: '140px' }}>
            <Search size={16} /> Verify Pass
          </button>
        </form>

        {/* PPTX Shortcuts */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 'bold' }}>PPTX Quick Demo Lookups:</span>
          <button type="button" className="secondary outline" onClick={() => quickSearchPhone('MAID-PERM-5001')} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>
            <KeyRound size={12} /> Maid Permanent Pass (MAID-PERM-5001)
          </button>
          <button type="button" className="secondary outline" onClick={() => quickSearchPhone('+91 9933445566')} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>
            <Phone size={12} /> Delivery Boy Phone (+91 9933445566)
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
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

              <div style={{ background: '#e2e8f0', padding: '0.4rem 0.8rem', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', margin: '0.5rem 0' }}>
                Total People Entering: {parseInt(adultMen) + parseInt(adultWomen) + parseInt(children)}
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
              className="gate-btn-in"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <LogIn size={20} /> Record Ingress (IN)
            </button>
            <button
              onClick={() => handleMovement('OUT')}
              className="gate-btn-out"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <LogOut size={20} /> Record Egress (OUT)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
