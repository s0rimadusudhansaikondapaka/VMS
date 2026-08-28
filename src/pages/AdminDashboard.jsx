import React, { useState, useEffect } from 'react';
import { getReportData, adminBypassApprove, adminEmergencyPass, toggleL2Approval, getSystemSettings, getAdminUsers, getGateCategoryRules, toggleGateCategoryRule } from '../services/api';
import DashboardHeader from '../components/DashboardHeader';
import UserAddWizardModal from '../components/UserAddWizardModal';
import BulkUploadModal from '../components/BulkUploadModal';
import { useTablePagination, PaginationControls } from '../components/TablePagination';
import { KeyRound, Zap, ShieldAlert, CheckCircle, Lock, Unlock, AlertTriangle, FileSpreadsheet, UserPlus, Users, UploadCloud, Shield, Check, X } from 'lucide-react';

export default function AdminDashboard({ user }) {
  const [registrations, setRegistrations] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [gateRules, setGateRules] = useState([]);
  const [l2Enabled, setL2Enabled] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const {
    searchTerm: userSearch,
    setSearchTerm: setUserSearch,
    currentPage: userPage,
    setCurrentPage: setUserPage,
    totalPages: userTotalPages,
    totalItems: userTotalItems,
    paginatedData: paginatedUsers,
  } = useTablePagination(usersList, ['name', 'email', 'phone', 'role', 'department'], 10);

  const {
    searchTerm: masterSearch,
    setSearchTerm: setMasterSearch,
    currentPage: masterPage,
    setCurrentPage: setMasterPage,
    totalPages: masterTotalPages,
    totalItems: masterTotalItems,
    paginatedData: paginatedMasterRegs,
  } = useTablePagination(registrations, ['visitor_name', 'pass_code', 'visitor_category', 'status'], 10);

  const {
    searchTerm: auditSearch,
    setSearchTerm: setAuditSearch,
    currentPage: auditPage,
    setCurrentPage: setAuditPage,
    totalPages: auditTotalPages,
    totalItems: auditTotalItems,
    paginatedData: paginatedAuditLogs,
  } = useTablePagination(auditLogs, ['action', 'entity_type', 'remarks'], 10);

  // Modals state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // Emergency Pass Form state
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyVehicle, setEmergencyVehicle] = useState('');
  const [emergencyPurpose, setEmergencyPurpose] = useState('');
  const [emergencyPassResult, setEmergencyPassResult] = useState(null);

  useEffect(() => {
    fetchData();
    fetchUsers();
    fetchGateRules();
  }, []);

  const fetchGateRules = async () => {
    try {
      const res = await getGateCategoryRules();
      if (res.success) setGateRules(res.rules);
    } catch (err) {
      console.error('Failed to fetch gate rules:', err);
    }
  };

  const handleToggleGateRule = async (gateName, catName, currentAllowed) => {
    try {
      const res = await toggleGateCategoryRule(gateName, catName, !currentAllowed);
      if (res.success) {
        setMsg(res.message);
        fetchGateRules();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update gate rule.');
    }
  };

  const fetchData = async () => {
    try {
      const regRes = await getReportData('PRE_REG');
      if (regRes.success) setRegistrations(regRes.data);

      const auditRes = await getReportData('EXCEPTION');
      if (auditRes.success) setAuditLogs(auditRes.data);

      const setRes = await getSystemSettings();
      if (setRes.success) setL2Enabled(setRes.settings.L2_APPROVAL_ENABLED);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await getAdminUsers();
      if (res.success) setUsersList(res.users);
    } catch (err) {
      console.error('Failed to fetch users list:', err);
    }
  };

  const handleAdminBypass = async (regId) => {
    setError('');
    setMsg('');
    try {
      const res = await adminBypassApprove(regId, `Super Admin Override Executed by ${user.name}`);
      if (res.success) {
        setMsg(`Super Admin Bypass Executed! Registration ID #${regId} immediately approved and QR code generated.`);
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Admin bypass failed.');
    }
  };

  const handleEmergencyPassSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    try {
      const res = await adminEmergencyPass({
        full_name: emergencyName,
        phone: emergencyPhone,
        vehicle_no: emergencyVehicle,
        purpose: emergencyPurpose,
      });

      if (res.success) {
        setEmergencyPassResult(res.registration);
        setMsg(`Emergency Instant Pass Generated! Pass Code: ${res.registration.pass_code}`);
        setEmergencyName('');
        setEmergencyPhone('');
        setEmergencyVehicle('');
        setEmergencyPurpose('');
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Emergency pass creation failed.');
    }
  };

  const handleToggleSetting = async (key, currentVal) => {
    try {
      const res = await toggleL2Approval(!currentVal, key);
      if (res.success) {
        if (key === 'L2_APPROVAL_ENABLED') setL2Enabled(res.enabled);
        setMsg(`System policy toggle updated: ${key} set to ${res.enabled ? 'ENABLED' : 'DISABLED'}`);
      }
    } catch (err) {
      alert('Toggle setting failed.');
    }
  };

  return (
    <div className="container">
      <DashboardHeader
        title="System Super Admin Control Panel"
        subtitle={`Master Approval Bypasses & Emergency Access Management | Operator: ${user.name}`}
        roleBadge="SUPER ADMIN"
      />

      {/* Action Toolbar for Superadmin User Creation & Bulk Upload */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setIsWizardOpen(true)}
          style={{ background: '#7e22ce', borderColor: '#7e22ce', color: '#ffffff', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem' }}
        >
          <UserPlus size={18} /> Single User Add Wizard
        </button>

        <button
          onClick={() => setIsBulkModalOpen(true)}
          style={{ background: '#2563eb', borderColor: '#2563eb', color: '#ffffff', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem' }}
        >
          <FileSpreadsheet size={18} /> Bulk Excel Sheet Upload (Users / Visitors)
        </button>
      </div>

      {msg && <div style={{ background: '#def7ec', color: '#03543f', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem' }}>{msg}</div>}
      {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem' }}>{error}</div>}

      {/* Modals */}
      <UserAddWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={() => {
          fetchUsers();
          fetchData();
        }}
      />

      <BulkUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={() => {
          fetchUsers();
          fetchData();
        }}
      />

      {/* Admin Policy Controls & Emergency Pass Generator */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Policy Toggles */}
        <div className="card" style={{ borderTop: '4px solid #9333ea' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b21a8' }}>
            <ShieldAlert /> Global System Policy Toggles
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Admin controls to bypass workflow stages during high-volume events or emergencies.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '0.75rem', borderRadius: '6px' }}>
              <div>
                <strong>L2 Approval Workflow</strong>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Bypasses Department HOD level approvals when OFF</p>
              </div>
              <button
                onClick={() => handleToggleSetting('L2_APPROVAL_ENABLED', l2Enabled)}
                style={{ background: l2Enabled ? '#057a55' : '#64748b', fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}
              >
                {l2Enabled ? 'ENABLED (ON)' : 'BYPASSED (OFF)'}
              </button>
            </div>
          </div>
        </div>

        {/* Emergency Instant Pass Generator */}
        <div className="card" style={{ borderTop: '4px solid #dc2626' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#991b1b' }}>
            <Zap /> Issue Admin Emergency Instant Pass
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Bypasses all Host L1/L2 approvals, Accommodation checks, and Curfew limits instantly.</p>
          
          <form onSubmit={handleEmergencyPassSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <input type="text" placeholder="Visitor Full Name *" required value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} />
              <input type="text" placeholder="Phone Number *" required value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input type="text" placeholder="Vehicle Number (e.g. KA-01-AB-1234)" value={emergencyVehicle} onChange={(e) => setEmergencyVehicle(e.target.value)} />
              <input type="text" placeholder="Emergency Reason / Purpose" required value={emergencyPurpose} onChange={(e) => setEmergencyPurpose(e.target.value)} />
            </div>

            <button type="submit" style={{ width: '100%', marginTop: '0.8rem', background: '#dc2626', borderColor: '#dc2626', color: 'white', fontWeight: 'bold' }}>
              <Zap size={16} /> Issue & Auto-Approve Emergency Pass
            </button>
          </form>

          {emergencyPassResult && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <img src={emergencyPassResult.qr_code_url} alt="Emergency QR" style={{ width: '60px', height: '60px' }} />
              <div>
                <strong style={{ color: '#991b1b' }}>Pass Code: {emergencyPassResult.pass_code}</strong>
                <p style={{ margin: 0, fontSize: '0.8rem' }}>State: APPROVED (Admin Bypassed)</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gatewise Visitor Category Access Matrix (Super Admin) */}
      <div className="card" style={{ marginBottom: '1.5rem', borderTop: '4px solid #0284c7' }}>
        <div style={{ marginBottom: '0.8rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0369a1', margin: 0 }}>
            <Shield size={22} color="#0284c7" /> Gatewise Visitor Category Access Matrix
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
            Super Admin can allow or disable specific visitor categories at each gate. Guards scanning passes at gates will automatically block ingress for disabled categories.
          </p>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table role="grid" style={{ fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: '#f0f9ff' }}>
                <th style={{ minWidth: '150px' }}>Visitor Category</th>
                {['NORTH_GATE', 'SOUTH_GATE', 'EAST_GATE', 'WEST_GATE', 'STAFF_GATE'].map((gate) => (
                  <th key={gate} style={{ textAlign: 'center', minWidth: '120px' }}>
                    {gate.replace('_', ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {['GENERAL', 'VVIP', 'VIP', 'VENDOR', 'CONTRACTOR', 'FOREIGN_NATIONAL', 'DELIVERY', 'CAB', 'MAID', 'FREQUENT_VISITOR'].map((cat) => (
                <tr key={cat}>
                  <td><strong>{cat}</strong></td>
                  {['NORTH_GATE', 'SOUTH_GATE', 'EAST_GATE', 'WEST_GATE', 'STAFF_GATE'].map((gate) => {
                    const rule = gateRules.find((r) => r.gate_name === gate && r.visitor_category === cat);
                    const isAllowed = rule ? rule.is_allowed : true;
                    return (
                      <td key={gate} style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleGateRule(gate, cat, isAllowed)}
                          style={{
                            fontSize: '0.72rem',
                            padding: '0.25rem 0.55rem',
                            margin: 0,
                            borderRadius: '20px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            background: isAllowed ? '#dcfce7' : '#fee2e2',
                            color: isAllowed ? '#15803d' : '#b91c1c',
                            border: `1px solid ${isAllowed ? '#86efac' : '#fca5a5'}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                          title={`Click to ${isAllowed ? 'Disable' : 'Allow'} ${cat} at ${gate}`}
                        >
                          {isAllowed ? <Check size={12} /> : <X size={12} />}
                          {isAllowed ? 'ALLOWED' : 'DISABLED'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System User Directory Table */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b', margin: 0 }}>
              <Users color="#7e22ce" size={20} /> System User Directory ({usersList.length})
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>All registered Ashram Residents, Staff, Guards, Supervisors, and Administrators.</p>
          </div>
          <button
            onClick={() => setIsWizardOpen(true)}
            style={{ background: '#7e22ce', color: '#fff', fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}
          >
            + Add New User
          </button>
        </div>

        <PaginationControls
          searchTerm={userSearch}
          setSearchTerm={setUserSearch}
          currentPage={userPage}
          setCurrentPage={setUserPage}
          totalPages={userTotalPages}
          totalItems={userTotalItems}
          pageSize={10}
          placeholder="Filter users by Name, Email, Phone, Role, Department..."
        />

        <table role="grid">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Residency</th>
              <th>Ashram Address / Location</th>
              <th>Department</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', color: '#64748b' }}>No users found.</td>
              </tr>
            ) : (
              paginatedUsers.map((u) => (
                <tr key={u.id}>
                  <td>#{u.id}</td>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td>
                    <span className="badge badge-vvip" style={{ background: u.role === 'ADMIN' ? '#9333ea' : u.role === 'HOD' ? '#2563eb' : u.role === 'GUARD' ? '#d97706' : '#475569' }}>
                      {u.role}
                    </span>
                  </td>
                  <td>{u.residency_status}</td>
                  <td style={{ fontSize: '0.8rem', color: '#475569' }}>{u.address || u.flat_info || 'Ashram Campus'}</td>
                  <td>{u.department_name || 'N/A'}</td>
                  <td>
                    <span style={{ color: u.registration_status === 'ACTIVE' ? '#057a55' : '#dc2626', fontWeight: 'bold', fontSize: '0.8rem' }}>
                      ● {u.registration_status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Admin Bypass List */}
      <div className="card">
        <h3>Master Registrations & Admin Bypass Control</h3>
        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Admin can force-approve any pending or rejected visitor registration directly.</p>

        <PaginationControls
          searchTerm={masterSearch}
          setSearchTerm={setMasterSearch}
          currentPage={masterPage}
          setCurrentPage={setMasterPage}
          totalPages={masterTotalPages}
          totalItems={masterTotalItems}
          pageSize={10}
          placeholder="Search registrations by Visitor Name, Passcode, Category, Status..."
        />

        <table role="grid">
          <thead>
            <tr>
              <th>Pass Code</th>
              <th>Visitor Name</th>
              <th>Category</th>
              <th>Status</th>
              <th>Admin Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedMasterRegs.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: '#64748b' }}>No registrations found matching filter.</td>
              </tr>
            ) : (
              paginatedMasterRegs.map((reg) => (
                <tr key={reg.id}>
                  <td><strong>{reg.pass_code}</strong></td>
                  <td>{reg.visitor_name}</td>
                  <td>{reg.visitor_category}</td>
                  <td>
                    <span className={`badge badge-${reg.status.toLowerCase()}`}>{reg.status}</span>
                    {reg.bypassed_by_admin && <span className="badge badge-vvip" style={{ marginLeft: '0.3rem' }}>BYPASSED</span>}
                  </td>
                  <td>
                    {reg.status !== 'APPROVED' && reg.status !== 'INSIDE_CAMPUS' && reg.status !== 'CHECKED_OUT' ? (
                      <button
                        onClick={() => handleAdminBypass(reg.id)}
                        style={{ background: '#7e22ce', borderColor: '#7e22ce', color: 'white', padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
                      >
                        <Unlock size={14} /> Force Admin Bypass Approval
                      </button>
                    ) : (
                      <span style={{ color: '#057a55', fontSize: '0.8rem', fontWeight: 'bold' }}>✓ Pass Approved</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Audit Logs */}
      <div className="card">
        <h3>System Audit & Exception Ledger</h3>

        <PaginationControls
          searchTerm={auditSearch}
          setSearchTerm={setAuditSearch}
          currentPage={auditPage}
          setCurrentPage={setAuditPage}
          totalPages={auditTotalPages}
          totalItems={auditTotalItems}
          pageSize={10}
          placeholder="Filter audit logs by Action, Entity, Remarks..."
        />

        <table role="grid">
          <thead>
            <tr>
              <th>ID</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Remarks</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {paginatedAuditLogs.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: '#64748b' }}>No audit logs matching filter.</td>
              </tr>
            ) : (
              paginatedAuditLogs.map((log) => (
                <tr key={log.id}>
                  <td>{log.id}</td>
                  <td><strong>{log.action}</strong></td>
                  <td>{log.entity_type}</td>
                  <td>{log.remarks}</td>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

