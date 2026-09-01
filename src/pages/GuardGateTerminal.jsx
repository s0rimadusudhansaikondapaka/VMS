import React, { useState, useEffect } from 'react';
import { verifyGatePass, processGateMovement, createRegistration, getSpotRegistrationsQueue, assignSpotHost, getAdminUsers, updateApproval, getRecentGateLookups, getGatewiseStatsAndSelfRegistered } from '../services/api';
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

  const [recentLookups, setRecentLookups] = useState([]);
  const [gateInCount, setGateInCount] = useState(0);
  const [gateOutCount, setGateOutCount] = useState(0);
  const [gateMovementList, setGateMovementList] = useState([]);
  const [selfRegCount, setSelfRegCount] = useState(0);
  const [selfRegList, setSelfRegList] = useState([]);
  const [showGateLogsModal, setShowGateLogsModal] = useState(false);
  const [showSelfRegModal, setShowSelfRegModal] = useState(false);

  const {
    searchTerm: movementSearch,
    setSearchTerm: setMovementSearch,
    currentPage: movementPage,
    setCurrentPage: setMovementPage,
    totalPages: movementTotalPages,
    totalItems: movementTotalItems,
    paginatedData: paginatedGateMovements,
  } = useTablePagination(gateMovementList, ['visitor_name', 'visitor_phone', 'pass_code', 'guard_name', 'direction', 'gate_name', 'vehicle_no'], 10);

  const {
    searchTerm: selfRegSearch,
    setSearchTerm: setSelfRegSearch,
    currentPage: selfRegPage,
    setCurrentPage: setSelfRegPage,
    totalPages: selfRegTotalPages,
    totalItems: selfRegTotalItems,
    paginatedData: paginatedSelfReg,
  } = useTablePagination(selfRegList, ['visitor_name', 'visitor_phone', 'pass_code', 'visitor_category', 'host_name', 'status'], 10);

  useEffect(() => {
    fetchSpotQueue();
    fetchUsersList();
    fetchRecentLookups();
    fetchGateStats(gateName);

    const handleRealtimeSync = (e) => {
      console.log('[GuardGateTerminal] Realtime Event Received:', e.detail);
      fetchSpotQueue();
      fetchRecentLookups();
      fetchGateStats(gateName);
      if (passData && passData.pass_code) {
        executePassVerification(passData.pass_code);
      }
    };

    window.addEventListener('vms_realtime_sync', handleRealtimeSync);
    return () => window.removeEventListener('vms_realtime_sync', handleRealtimeSync);
  }, [passData, gateName]);

  const fetchGateStats = async (selectedGate) => {
    try {
      const res = await getGatewiseStatsAndSelfRegistered(selectedGate || gateName);
      if (res.success) {
        setGateInCount(res.gate_in_count || 0);
        setGateOutCount(res.gate_out_count || 0);
        setGateMovementList(res.gate_movement_list || []);
        setSelfRegCount(res.self_registered_count || 0);
        setSelfRegList(res.self_registered_list || []);
      }
    } catch (err) {
      console.error('Failed to fetch gatewise stats:', err);
    }
  };

  const fetchRecentLookups = async () => {
    try {
      const res = await getRecentGateLookups();
      if (res.success) setRecentLookups(res.recent_passes || []);
    } catch (err) {
      console.error('Failed to fetch recent lookups:', err);
    }
  };

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
  const [assistedPhone, setAssistedPhone] = useState('');
  const [assistedCompanyName, setAssistedCompanyName] = useState('');
  const [assistedPurpose, setAssistedPurpose] = useState('');
  const [assistedHostId, setAssistedHostId] = useState('');
  const [assistedCategory, setAssistedCategory] = useState('GENERAL');
  const [assistedVisitType, setAssistedVisitType] = useState('HOME');

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

  const executePassVerification = async (queryToVerify) => {
    if (!queryToVerify || !queryToVerify.trim()) return;
    setError('');
    setMsg('');
    setLoading(true);
    try {
      const res = await verifyGatePass(queryToVerify.trim(), gateName);
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
        company_name: assistedCompanyName,
        purpose: assistedPurpose || 'Spot Registration (Assisted Entry - No Smartphone)',
        visitor_category: assistedCategory || 'GENERAL',
        visit_type: assistedVisitType || 'HOME',
        registration_type: 'SPOT_REGISTRATION',
        has_smartphone: false,
        is_spot_registration: true,
        host_id: assistedHostId ? parseInt(assistedHostId) : null,
        valid_from: new Date().toISOString(),
        valid_until: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        adult_men_count: 1,
        adult_women_count: 0,
        children_count: 0,
        vehicles: [],
      });
      if (res.success && res.registration) {
        setMsg(`Assisted entry registration created! Pass Code: ${res.registration.pass_code}. Entry pass generated.`);
        setShowAssistedEntry(false);
        setAssistedName('');
        setAssistedPhone('');
        setAssistedCompanyName('');
        setAssistedPurpose('');
        setAssistedHostId('');
        fetchSpotQueue();
        setSearchQuery(res.registration.pass_code);
        executePassVerification(res.registration.pass_code);
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

      {/* Active Gate Traffic & Self-Registered Visitors Live Counter */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
        <div
          onClick={() => setShowGateLogsModal(!showGateLogsModal)}
          style={{ background: '#fffbf0', border: '2px solid #df6f06', borderRadius: '10px', padding: '0.8rem 1rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div>
            <div style={{ fontSize: '0.78rem', color: '#4e081d', fontWeight: 'bold' }}>
              {gateName.replace('_', ' ')} Ingress (IN Today)
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#15803d' }}>
              {gateInCount} <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 'normal' }}>visitors</span>
            </div>
          </div>
          <button style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', background: '#4e081d', color: '#fff', border: 'none', borderRadius: '4px' }}>
            {showGateLogsModal ? 'Close List' : 'View Log List'}
          </button>
        </div>

        <div
          onClick={() => setShowGateLogsModal(!showGateLogsModal)}
          style={{ background: '#fffbf0', border: '2px solid #df6f06', borderRadius: '10px', padding: '0.8rem 1rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div>
            <div style={{ fontSize: '0.78rem', color: '#4e081d', fontWeight: 'bold' }}>
              {gateName.replace('_', ' ')} Egress (OUT Today)
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#b91c1c' }}>
              {gateOutCount} <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 'normal' }}>visitors</span>
            </div>
          </div>
          <button style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', background: '#4e081d', color: '#fff', border: 'none', borderRadius: '4px' }}>
            {showGateLogsModal ? 'Close List' : 'View Log List'}
          </button>
        </div>

        <div
          onClick={() => setShowSelfRegModal(!showSelfRegModal)}
          style={{ background: '#fffbf0', border: '2px solid #df6f06', borderRadius: '10px', padding: '0.8rem 1rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div>
            <div style={{ fontSize: '0.78rem', color: '#4e081d', fontWeight: 'bold' }}>
              Self-Registered / Spot Visitors
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#7c3aed' }}>
              {selfRegCount} <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 'normal' }}>registered</span>
            </div>
          </div>
          <button style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '4px' }}>
            {showSelfRegModal ? 'Close List' : 'View Visitors List'}
          </button>
        </div>
      </div>

      {/* Gatewise Movement Log List Modal / Card */}
      {showGateLogsModal && (
        <div className="card" style={{ borderTop: '4px solid #4e081d', marginBottom: '1.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3 style={{ margin: 0, color: '#4e081d', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={20} color="#df6f06" /> Gatewise Movement Logs for {gateName.replace('_', ' ')} ({gateMovementList.length})
            </h3>
            <button onClick={() => setShowGateLogsModal(false)} className="secondary outline" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
              ✕ Close
            </button>
          </div>
          <PaginationControls
            searchTerm={movementSearch}
            setSearchTerm={setMovementSearch}
            currentPage={movementPage}
            setCurrentPage={setMovementPage}
            totalPages={movementTotalPages}
            totalItems={movementTotalItems}
            pageSize={10}
            placeholder="Search movement logs by Visitor Name, Phone, Guard, Direction, Vehicle..."
          />

          <div style={{ overflowX: 'auto' }}>
            <table role="grid" style={{ fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#4e081d', color: '#ffffff' }}>
                  <th>Timestamp</th>
                  <th>Visitor Name</th>
                  <th>Direction</th>
                  <th>Security Guard</th>
                  <th>Members Present Breakdown</th>
                </tr>
              </thead>
              <tbody>
                {paginatedGateMovements.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: '#64748b', padding: '1rem' }}>
                      No gate movement logs recorded matching search criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedGateMovements.map((log) => (
                    <tr key={log.id}>
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                      <td>
                        <strong>{log.visitor_name}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{log.visitor_phone}</div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 'bold', color: log.direction === 'IN' ? '#15803d' : '#b91c1c' }}>
                          {log.direction === 'IN' ? '➔ IN (Ingress)' : '⬅ OUT (Egress)'}
                        </span>
                      </td>
                      <td>
                        <strong>{log.guard_name || 'Security Guard'}</strong> ({log.guard_role || 'GUARD'})
                      </td>
                      <td>
                        <strong>Total: {log.person_count || 1} members</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          👨 {log.adult_men_count || 0} Men | 👩 {log.adult_women_count || 0} Women | 👦 {log.boys_count || 0} Boys | 👧 {log.girls_count || 0} Girls
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Self-Registered Visitors Directory List Modal / Card */}
      {showSelfRegModal && (
        <div className="card" style={{ borderTop: '4px solid #7c3aed', marginBottom: '1.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3 style={{ margin: 0, color: '#7c3aed', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <UserPlus size={20} color="#7c3aed" /> Self-Registered & Spot Visitors Directory ({selfRegList.length})
            </h3>
            <button onClick={() => setShowSelfRegModal(false)} className="secondary outline" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
              ✕ Close
            </button>
          </div>

          <PaginationControls
            searchTerm={selfRegSearch}
            setSearchTerm={setSelfRegSearch}
            currentPage={selfRegPage}
            setCurrentPage={setSelfRegPage}
            totalPages={selfRegTotalPages}
            totalItems={selfRegTotalItems}
            pageSize={10}
            placeholder="Search self-registered directory by Visitor Name, Phone, Passcode, Category..."
          />

          <div style={{ overflowX: 'auto' }}>
            <table role="grid" style={{ fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#4e081d', color: '#ffffff' }}>
                  <th>Pass Code</th>
                  <th>Visitor Name</th>
                  <th>Category</th>
                  <th>Host Assigned</th>
                  <th>Status</th>
                  <th>Time Registered</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSelfReg.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: '#64748b', padding: '1rem' }}>
                      No self-registered or spot visitors found matching search criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedSelfReg.map((reg) => (
                    <tr key={reg.id}>
                      <td><strong style={{ color: '#4e081d' }}>{reg.pass_code}</strong></td>
                      <td>
                        <strong>{reg.visitor_name}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{reg.visitor_phone}</div>
                      </td>
                      <td><span className="badge badge-inside">{reg.visitor_category || 'GENERAL'}</span></td>
                      <td>{reg.host_name || 'Spot Assigned'}</td>
                      <td>
                        <span
                          style={{
                            fontWeight: 'bold',
                            fontSize: '0.78rem',
                            color: reg.status === 'INSIDE_CAMPUS' ? '#15803d' : reg.status === 'APPROVED' ? '#d97706' : '#64748b',
                          }}
                        >
                          ● {reg.status}
                        </span>
                      </td>
                      <td>{new Date(reg.created_at).toLocaleString()}</td>
                      <td>
                        <button
                          onClick={() => {
                            setSearchQuery(reg.pass_code);
                            executePassVerification(reg.pass_code);
                            setShowSelfRegModal(false);
                          }}
                          style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', background: '#df6f06', borderColor: '#df6f06', color: '#fff' }}
                        >
                          Verify Pass
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

        {/* Category Verification Method Cheat-Sheet */}
        <div style={{ marginTop: '0.8rem', background: '#f8fafc', padding: '0.8rem', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.4rem' }}>
            📌 Category Verification Methods (Security Standards):
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.78rem' }}>
            <div style={{ background: '#ffffff', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <strong>🔑 House Maids / Caretakers / Labours:</strong> Permanent Passcode (e.g. <code>MAID-PERM-5001</code>)
            </div>
            <div style={{ background: '#ffffff', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <strong>🔑 Frequent Visitors / Devotees:</strong> Permanent Passcode (e.g. <code>DEVOTEE-PERM-7001</code>)
            </div>
            <div style={{ background: '#ffffff', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <strong>📞 Delivery / Milk / Gas / Dhobi:</strong> Mobile Phone Number (e.g. <code>+91 9933445566</code>)
            </div>
            <div style={{ background: '#ffffff', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <strong>🛠️ Home Repair / Cabs / Vendors:</strong> Pre-Approval & Permission Check
            </div>
          </div>
        </div>

        {/* Top 20 Quick Gate Verification Lookups */}
        <div style={{ marginTop: '0.8rem', background: '#fffbf0', padding: '0.9rem', borderRadius: '10px', border: '1px solid #fed7aa' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: '#4e081d', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={16} color="#df6f06" /> Quick Gate Verification Lookups (Top 20 Recent Passes):
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Click any pass for instant lookup</span>
          </div>

          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {recentLookups.length === 0 ? (
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>No recent passes found.</span>
            ) : (
              recentLookups.map((pass) => (
                <button
                  key={pass.id}
                  type="button"
                  onClick={() => {
                    setSearchQuery(pass.pass_code);
                    executePassVerification(pass.pass_code);
                  }}
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.3rem 0.65rem',
                    background: '#4e081d',
                    borderColor: '#4e081d',
                    color: '#ffffff',
                    borderRadius: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  }}
                >
                  <KeyRound size={13} color="#fcb900" />
                  <strong>{pass.pass_code}</strong> ({pass.visitor_name})
                  <span
                    style={{
                      fontSize: '0.65rem',
                      padding: '0.1rem 0.35rem',
                      borderRadius: '4px',
                      background: pass.status === 'INSIDE_CAMPUS' ? '#15803d' : pass.status === 'APPROVED' ? '#d97706' : '#64748b',
                      color: '#ffffff',
                    }}
                  >
                    {pass.status}
                  </span>
                </button>
              ))
            )}
          </div>
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
          <form onSubmit={handleAssistedEntry} style={{ marginTop: '1rem', background: '#fffbf0', padding: '1.2rem', borderRadius: '10px', border: '2px solid #df6f06' }}>
            <div style={{ background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '8px', padding: '0.6rem 0.8rem', marginBottom: '0.8rem', fontSize: '0.8rem', color: '#1e3a8a' }}>
              <strong>Spot Registration Workflow (Visitor without a smartphone/phone):</strong>
              <ul style={{ margin: '0.3rem 0 0 1.2rem', padding: 0 }}>
                <li><strong>Visitor Knows Resident/Employee:</strong> Select Resident/Employee Name & Flat/Department. Resident receives instant approval notification.</li>
                <li><strong>Visitor Unknown / Visiting Ashram:</strong> Select <strong>PRO (Public Relations Officer)</strong>. PRO receives approval notification.</li>
                <li><strong>Unresponsive Host:</strong> SO or Supervisor can click ⚡ SO/Supervisor Approve to clear entry.</li>
              </ul>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4e081d' }}>
                Visitor Full Name *
                <input type="text" required value={assistedName} onChange={(e) => setAssistedName(e.target.value)} placeholder="Enter Visitor Name" style={{ margin: '0.2rem 0 0 0' }} />
              </label>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4e081d' }}>
                Visitor Mobile Number *
                <input type="tel" required value={assistedPhone} onChange={(e) => setAssistedPhone(e.target.value)} placeholder="+91 9876543210" style={{ margin: '0.2rem 0 0 0' }} />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginTop: '0.6rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4e081d' }}>
                Host / Referral Person *
                <select value={assistedHostId} onChange={(e) => setAssistedHostId(e.target.value)} required style={{ margin: '0.2rem 0 0 0' }}>
                  <option value="">-- Select Host (Resident / Employee / PRO) --</option>
                  {adminUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role}) {u.address ? `[${u.address}]` : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4e081d' }}>
                Visitor Category
                <select value={assistedCategory} onChange={(e) => setAssistedCategory(e.target.value)} style={{ margin: '0.2rem 0 0 0' }}>
                  <option value="GENERAL">GENERAL</option>
                  <option value="VIP">VIP</option>
                  <option value="VVIP">VVIP</option>
                  <option value="VENDOR">VENDOR</option>
                  <option value="CONTRACTOR">CONTRACTOR</option>
                  <option value="FOREIGN_NATIONAL">FOREIGN NATIONAL</option>
                  <option value="DELIVERY">DELIVERY</option>
                  <option value="CAB">CAB</option>
                  <option value="MAID">MAID</option>
                  <option value="FREQUENT_VISITOR">FREQUENT VISITOR</option>
                </select>
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginTop: '0.6rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4e081d' }}>
                Company / Agency Name (for Delivery / Courier / Vendors)
                <input type="text" value={assistedCompanyName} onChange={(e) => setAssistedCompanyName(e.target.value)} placeholder="e.g. Amazon, Flipkart, Blue Dart, Gas Agency, Milk Supplier" style={{ margin: '0.2rem 0 0 0' }} />
              </label>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4e081d' }}>
                Purpose of Visit *
                <input type="text" required value={assistedPurpose} onChange={(e) => setAssistedPurpose(e.target.value)} placeholder="e.g. Courier Delivery, Repair Work, Official Visit" style={{ margin: '0.2rem 0 0 0' }} />
              </label>
            </div>

            <button type="submit" style={{ marginTop: '1rem', width: '100%', background: '#df6f06', borderColor: '#df6f06', color: 'white', fontWeight: 'bold', fontSize: '0.92rem' }}>
              Submit & Issue Assisted Entry Gate Pass
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
                  <>⛔ Category Restricted at Current Gate ({gateName.replace('_', ' ')})</>
                ) : (
                  <>✅ Category Allowed at Current Gate ({gateName.replace('_', ' ')})</>
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
                ⚠️ Visitor category '{passData.visitor_category}' is NOT ALLOWED at {gateName.replace('_', ' ')}. Please direct visitor to one of the authorized gates listed below.
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
                        background: g === gateName ? '#15803d' : '#2563eb',
                        color: 'white',
                        fontSize: '0.75rem',
                        padding: '0.22rem 0.65rem',
                        borderRadius: '20px',
                        fontWeight: 'bold',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        boxShadow: g === gateName ? '0 0 0 2px #bbf7d0' : 'none',
                      }}
                    >
                      ✓ {g.replace('_', ' ')} {g === gateName ? '(Current Gate)' : ''}
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
                Scheduled Visit Window & 8-Hour Grace Policy
              </h4>
              <p style={{ margin: '0.3rem 0', fontSize: '0.85rem' }}>
                <Calendar size={14} /> <strong>Scheduled Arrival (`validFrom`):</strong> {new Date(passData.valid_from).toLocaleString()}
              </p>
              <p style={{ margin: '0.3rem 0', fontSize: '0.85rem' }}>
                <Calendar size={14} /> <strong>Scheduled Departure (`validUntil`):</strong> {new Date(passData.valid_until).toLocaleString()}
              </p>

              {/* 8-Hour Grace Window Banner */}
              {passData.earliest_allowed_entry && (
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.6rem 0.8rem',
                  borderRadius: '8px',
                  background: passData.arrival_status === 'TOO_EARLY' ? '#fee2e2' : passData.arrival_status === 'ARRIVAL_EXPIRED' ? '#fff7ed' : '#dcfce7',
                  border: '1px solid currentColor',
                  color: passData.arrival_status === 'TOO_EARLY' ? '#b91c1c' : passData.arrival_status === 'ARRIVAL_EXPIRED' ? '#c2410c' : '#15803d',
                  fontSize: '0.82rem',
                  fontWeight: 'bold'
                }}>
                  <Clock size={14} style={{ display: 'inline', marginRight: '0.3rem' }} />
                  {passData.arrival_message || `8-Hour Grace Period Active`}
                  <div style={{ fontSize: '0.74rem', fontWeight: 'normal', marginTop: '0.2rem', color: '#334155' }}>
                    Entry Grace Window: {new Date(passData.earliest_allowed_entry).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to {new Date(passData.latest_allowed_entry).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              )}

              <p style={{ margin: '0.4rem 0' }}><strong>Purpose:</strong> {passData.purpose}</p>
              <p style={{ margin: '0.4rem 0' }}><strong>Designated Host:</strong> {passData.host_name || 'N/A'}</p>

              {/* Primary Contact Person Attribution Card */}
              <div style={{ marginTop: '0.8rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '0.65rem 0.85rem' }}>
                <h4 style={{ margin: '0 0 0.3rem 0', color: '#1e40af', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Users size={15} color="#2563eb" /> Primary Contact Person & Resident Info
                </h4>
                <p style={{ margin: '0.2rem 0', fontSize: '0.82rem', color: '#1e293b' }}>
                  <strong>Resident Contact Person:</strong> {passData.host_name || 'N/A'} {passData.host_role ? `(${passData.host_role})` : ''}
                </p>
                {passData.family_relationship && (
                  <p style={{ margin: '0.2rem 0', fontSize: '0.82rem', color: '#7c3aed', fontWeight: 'bold' }}>
                    🔗 Relationship to Resident: {passData.family_relationship}
                  </p>
                )}
                <p style={{ margin: '0.2rem 0', fontSize: '0.82rem', color: '#1e293b' }}>
                  <strong>Residence / Flat Location:</strong> {passData.host_flat_info || 'Ashram Campus'}
                </p>
                <p style={{ margin: '0.2rem 0', fontSize: '0.82rem', color: '#1e293b' }}>
                  <strong>Resident Mobile (Masked):</strong> {passData.host_phone_masked || 'N/A'}
                </p>
              </div>
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
              disabled={passData.is_current_gate_allowed === false || passData.arrival_status === 'TOO_EARLY'}
              className="gate-btn-in"
              data-tooltip={passData.is_current_gate_allowed === false ? `Category ${passData.visitor_category} disabled at ${gateName}` : 'Record visitor entry IN at gate'}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                opacity: (passData.is_current_gate_allowed === false || passData.arrival_status === 'TOO_EARLY') ? 0.55 : 1,
                cursor: (passData.is_current_gate_allowed === false || passData.arrival_status === 'TOO_EARLY') ? 'not-allowed' : 'pointer',
                background: (passData.is_current_gate_allowed === false || passData.arrival_status === 'TOO_EARLY') ? '#64748b' : undefined,
                borderColor: (passData.is_current_gate_allowed === false || passData.arrival_status === 'TOO_EARLY') ? '#64748b' : undefined,
              }}
            >
              <LogIn size={20} />
              {passData.is_current_gate_allowed === false 
                ? '⛔ Restricted at this Gate' 
                : passData.arrival_status === 'TOO_EARLY'
                ? '⛔ Entry Window Not Open'
                : passData.status === 'INSIDE_CAMPUS' 
                ? '➔ Record Entry IN (Multi-Entry Active)' 
                : passData.status === 'CHECKED_OUT' 
                ? '➔ Re-Entry IN (Multi-Entry Active)' 
                : '➔ Record Entry IN'}
            </button>
            <button
              onClick={() => handleMovement('OUT')}
              disabled={passData.is_current_gate_allowed === false}
              className="gate-btn-out"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                opacity: passData.is_current_gate_allowed === false ? 0.55 : 1,
                cursor: passData.is_current_gate_allowed === false ? 'not-allowed' : 'pointer',
                background: passData.is_current_gate_allowed === false ? '#475569' : undefined,
                borderColor: passData.is_current_gate_allowed === false ? '#475569' : undefined,
              }}
            >
              <LogOut size={20} />
              {passData.status === 'CHECKED_OUT' ? '⬅ Record Exit OUT (Multi-Exit Active)' : '⬅ Record Egress (OUT)'}
            </button>
          </div>

          {/* Gate Movement Log & Members Audit Card */}
          {passData.gate_movement_logs && passData.gate_movement_logs.length > 0 && (
            <div style={{ marginTop: '1.5rem', background: '#fffbf0', border: '2px solid #df6f06', borderRadius: '10px', padding: '1rem' }}>
              <h4 style={{ margin: '0 0 0.6rem 0', color: '#4e081d', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.95rem' }}>
                <Shield size={18} color="#df6f06" /> Gate Ingress/Egress Guard Verification Audit Logs ({passData.gate_movement_logs.length})
              </h4>
              <div style={{ overflowX: 'auto' }}>
                <table role="grid" style={{ fontSize: '0.82rem', margin: 0 }}>
                  <thead>
                    <tr style={{ background: '#4e081d', color: '#ffffff' }}>
                      <th>Timestamp</th>
                      <th>Gate & Direction</th>
                      <th>Allowed By (Security Guard)</th>
                      <th>Members Present Breakdown</th>
                      <th>Address & Identity Proof Confirmation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {passData.gate_movement_logs.map((log) => (
                      <tr key={log.id}>
                        <td>{new Date(log.timestamp).toLocaleString()}</td>
                        <td>
                          <span style={{ fontWeight: 'bold', color: log.direction === 'IN' ? '#15803d' : '#b91c1c' }}>
                            {log.direction === 'IN' ? '➔ IN (Ingress)' : '⬅ OUT (Egress)'} @ {log.gate_name ? log.gate_name.replace('_', ' ') : gateName}
                          </span>
                        </td>
                        <td>
                          <strong>{log.guard_name || 'Security Guard'}</strong> <span style={{ opacity: 0.75 }}>({log.guard_role || 'GUARD'})</span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 'bold', color: '#4e081d' }}>
                            Total: {log.person_count || (Number(log.adult_men_count || 0) + Number(log.adult_women_count || 0) + Number(log.children_count || 0))} members
                          </span>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            👨 {log.adult_men_count || 0} Men | 👩 {log.adult_women_count || 0} Women | 👦 {log.boys_count || 0} Boys | 👧 {log.girls_count || 0} Girls
                          </div>
                        </td>
                        <td>
                          <span style={{ color: '#057a55', fontWeight: 'bold' }}>
                            ✓ ID & Address Proof Confirmed
                          </span>
                          <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                            {passData.id_type || 'Aadhaar'}: {passData.id_card_number || passData.id_number || 'Verified'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
