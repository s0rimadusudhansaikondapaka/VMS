import React, { useState, useEffect } from 'react';
import { getReportData, adminBypassApprove, adminEmergencyPass, toggleL2Approval, getSystemSettings, getAdminUsers, getGateCategoryRules, toggleGateCategoryRule, getL2MatrixRules, updateL2MatrixRule, getAllPendingL2Approvals, processL2ApprovalByAdmin, getGateDirectionConfig, updateGateDirectionConfig, getDepartments, updateAdminUser } from '../services/api';
import DashboardHeader from '../components/DashboardHeader';
import UserAddWizardModal from '../components/UserAddWizardModal';
import BulkUploadModal from '../components/BulkUploadModal';
import DeliveryPersonsReport from '../components/DeliveryPersonsReport';
import { useTablePagination, PaginationControls } from '../components/TablePagination';
import { KeyRound, Zap, ShieldAlert, CheckCircle, Lock, Unlock, AlertTriangle, FileSpreadsheet, UserPlus, Users, UploadCloud, Shield, Check, X, Sliders, ArrowRightLeft, Pencil, Truck } from 'lucide-react';

export default function AdminDashboard({ user }) {
  const [registrations, setRegistrations] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [gateRules, setGateRules] = useState([]);
  const [gateDirections, setGateDirections] = useState([]);
  const [l2Enabled, setL2Enabled] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  // Edit User Details & Status Modal State (Super Admin)
  const [departments, setDepartments] = useState([]);
  const [editUserModalData, setEditUserModalData] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('HOST');
  const [editUserType, setEditUserType] = useState('RESIDENT');
  const [editResidency, setEditResidency] = useState('RESIDENT');
  const [editStatus, setEditStatus] = useState('ACTIVE');
  const [editFlatInfo, setEditFlatInfo] = useState('');
  const [editDeptId, setEditDeptId] = useState('');

  const {
    searchTerm: userSearch,
    setSearchTerm: setUserSearch,
    currentPage: userPage,
    setCurrentPage: setUserPage,
    totalPages: userTotalPages,
    totalItems: userTotalItems,
    paginatedData: paginatedUsers,
  } = useTablePagination(usersList, ['guid', 'name', 'email', 'phone', 'role', 'user_type', 'department_name', 'department', 'id'], 10);

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
  } = useTablePagination(auditLogs, ['action', 'entity_type', 'remarks', 'actor_name', 'actor_role', 'status', 'ip_address'], 10);

  // Modals state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // Emergency Pass Form state
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyVehicle, setEmergencyVehicle] = useState('');
  const [emergencyPurpose, setEmergencyPurpose] = useState('');
  const [emergencyPassResult, setEmergencyPassResult] = useState(null);

  const [l2MatrixRules, setL2MatrixRules] = useState([]);
  const [pendingL2List, setPendingL2List] = useState([]);

  const {
    searchTerm: l2Search,
    setSearchTerm: setL2Search,
    currentPage: l2Page,
    setCurrentPage: setL2Page,
    totalPages: l2TotalPages,
    totalItems: l2TotalItems,
    paginatedData: paginatedPendingL2,
  } = useTablePagination(pendingL2List, ['visitor_name', 'pass_code', 'visitor_category', 'host_name', 'host_role', 'host_department'], 10);

  useEffect(() => {
    fetchData();
    fetchUsers();
    fetchGateRules();
    fetchGateDirections();
    fetchL2MatrixRules();
    fetchPendingL2();

    const handleRealtimeSync = (e) => {
      console.log('[AdminDashboard] Realtime Event Received:', e.detail);
      fetchData();
      fetchUsers();
      fetchGateRules();
      fetchGateDirections();
      fetchL2MatrixRules();
      fetchPendingL2();
    };

    window.addEventListener('vms_realtime_sync', handleRealtimeSync);
    return () => window.removeEventListener('vms_realtime_sync', handleRealtimeSync);
  }, []);

  const fetchPendingL2 = async () => {
    try {
      const res = await getAllPendingL2Approvals();
      if (res.success) setPendingL2List(res.pending_approvals);
    } catch (err) {
      console.error('Failed to fetch pending L2 approvals:', err);
    }
  };

  const handleL2Decision = async (regId, action) => {
    setError('');
    setMsg('');
    try {
      const res = await processL2ApprovalByAdmin(regId, action, `Super Admin ${action} decision by ${user.name}`);
      if (res.success) {
        setMsg(res.message);
        fetchData();
        fetchPendingL2();
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to process ${action} decision.`);
    }
  };

  const fetchGateRules = async () => {
    try {
      const res = await getGateCategoryRules();
      if (res.success) setGateRules(res.rules);
    } catch (err) {
      console.error('Failed to fetch gate rules:', err);
    }
  };

  const fetchDepartmentsList = async () => {
    try {
      const res = await getDepartments();
      if (res.success) setDepartments(res.departments || []);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  };

  const openEditUserModal = (u) => {
    setEditUserModalData(u);
    setEditName(u.name || '');
    setEditEmail(u.email || '');
    setEditPhone(u.phone || '');
    setEditUserType(u.user_type || u.role || 'RESIDENT');
    setEditRole(u.role || 'HOST');
    setEditResidency(u.residency_status || 'RESIDENT');
    setEditStatus(u.registration_status || 'ACTIVE');
    setEditFlatInfo(u.flat_info || u.address || '');
    setEditDeptId(u.department_id ? String(u.department_id) : '');
    fetchDepartmentsList();
  };

  const handleSaveUserEdit = async (e) => {
    e.preventDefault();
    if (!editUserModalData) return;
    try {
      const res = await updateAdminUser(editUserModalData.id, {
        name: editName,
        email: editEmail,
        phone: editPhone,
        role: editRole,
        user_type: editUserType,
        residency_status: editResidency,
        registration_status: editStatus,
        flat_info: editFlatInfo,
        department_id: editDeptId ? parseInt(editDeptId) : null,
      });

      if (res.success) {
        alert(res.message);
        setEditUserModalData(null);
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user details.');
    }
  };

  const fetchGateDirections = async () => {
    try {
      const res = await getGateDirectionConfig();
      if (res.success) setGateDirections(res.configs);
    } catch (err) {
      console.error('Failed to fetch gate direction configs:', err);
    }
  };

  const handleUpdateGateDirection = async (gateName, newMode) => {
    try {
      const res = await updateGateDirectionConfig(gateName, newMode);
      if (res.success) {
        setMsg(res.message);
        fetchGateDirections();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update gate direction state.');
    }
  };

  const fetchL2MatrixRules = async () => {
    try {
      const res = await getL2MatrixRules();
      if (res.success) setL2MatrixRules(res.rules);
    } catch (err) {
      console.error('Failed to fetch L2 matrix rules:', err);
    }
  };

  const handleUpdateL2MatrixRule = async (hostCategory, visitTypeCategory, newApproverType) => {
    try {
      const res = await updateL2MatrixRule(hostCategory, visitTypeCategory, newApproverType);
      if (res.success) {
        setMsg(res.message);
        fetchL2MatrixRules();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update L2 matrix rule.');
    }
  };

  const handleToggleGateRule = async (gateName, catName, modeOrAllowed) => {
    try {
      const payload = typeof modeOrAllowed === 'string'
        ? { direction_mode: modeOrAllowed }
        : { is_allowed: !modeOrAllowed };
      const res = await toggleGateCategoryRule(gateName, catName, payload);
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

      {/* Delivery Persons Management & Supervisor Approvals */}
      <DeliveryPersonsReport user={user} />

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

      {/* Gate In/Out Direction State Management Console (Super Admin) */}
      <div className="card" style={{ marginBottom: '1.5rem', borderTop: '4px solid #16a34a' }}>
        <div style={{ marginBottom: '0.8rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#15803d', margin: 0 }}>
            <Sliders size={22} color="#16a34a" /> Gate In/Out Direction State Management Console
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
            Super Admin can configure active movement direction states for each campus entry gate (Two-Way IN & OUT, INGRESS ONLY, EGRESS ONLY, or CLOSED).
          </p>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table role="grid" style={{ fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f0fdf4' }}>
                <th>Gate Identifier</th>
                <th>Current State Mode</th>
                <th>Configured Traffic Direction</th>
                <th>Super Admin Control Action</th>
              </tr>
            </thead>
            <tbody>
              {['NORTH_GATE', 'SOUTH_GATE', 'EAST_GATE', 'WEST_GATE', 'STAFF_GATE'].map((gate) => {
                const config = gateDirections.find((c) => c.gate_name === gate);
                const currentMode = config ? config.direction_mode : 'BOTH';

                return (
                  <tr key={gate}>
                    <td>
                      <strong>{gate.replace('_', ' ')}</strong>
                    </td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.65rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        background: currentMode === 'BOTH' ? '#dcfce7' : currentMode === 'IN_ONLY' ? '#dbeafe' : currentMode === 'OUT_ONLY' ? '#ffedd5' : '#fee2e2',
                        color: currentMode === 'BOTH' ? '#15803d' : currentMode === 'IN_ONLY' ? '#1d4ed8' : currentMode === 'OUT_ONLY' ? '#c2410c' : '#b91c1c',
                        border: `1px solid ${currentMode === 'BOTH' ? '#86efac' : currentMode === 'IN_ONLY' ? '#93c5fd' : currentMode === 'OUT_ONLY' ? '#fdba74' : '#fca5a5'}`
                      }}>
                        {currentMode === 'BOTH' && '🟢 IN & OUT (Two-Way)'}
                        {currentMode === 'IN_ONLY' && '🔵 INGRESS ONLY (Entry)'}
                        {currentMode === 'OUT_ONLY' && '🟠 EGRESS ONLY (Exit)'}
                        {currentMode === 'CLOSED' && '🔴 GATE CLOSED'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#475569' }}>
                      {currentMode === 'BOTH' && 'Allows both Entry (Check-In) and Exit (Check-Out)'}
                      {currentMode === 'IN_ONLY' && 'Allows Entry only. Exit movements strictly blocked.'}
                      {currentMode === 'OUT_ONLY' && 'Allows Exit only. Entry movements strictly blocked.'}
                      {currentMode === 'CLOSED' && 'Gate completely locked. All movements blocked.'}
                    </td>
                    <td>
                      <select
                        value={currentMode}
                        onChange={(e) => handleUpdateGateDirection(gate, e.target.value)}
                        style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem', margin: 0, fontWeight: 'bold', borderRadius: '6px' }}
                      >
                        <option value="BOTH">🟢 BOTH (In & Out Allowed)</option>
                        <option value="IN_ONLY">🔵 IN ONLY (Ingress Gate)</option>
                        <option value="OUT_ONLY">🟠 OUT ONLY (Egress Gate)</option>
                        <option value="CLOSED">🔴 CLOSED (Gate Locked)</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gatewise Visitor Category Access Matrix (Super Admin IN & OUT Controls) */}
      <div className="card" style={{ marginBottom: '1.5rem', borderTop: '4px solid #0284c7' }}>
        <div style={{ marginBottom: '0.8rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0369a1', margin: 0 }}>
            <Shield size={22} color="#0284c7" /> Gatewise Visitor Category Access Matrix (IN & OUT Controls)
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
            Super Admin can configure granular IN (Ingress Check-In) and OUT (Egress Check-Out) movement controls for each visitor category at every gate.
          </p>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table role="grid" style={{ fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: '#f0f9ff' }}>
                <th style={{ minWidth: '150px' }}>Visitor Category</th>
                {['NORTH_GATE', 'SOUTH_GATE', 'EAST_GATE', 'WEST_GATE', 'STAFF_GATE'].map((gate) => (
                  <th key={gate} style={{ textAlign: 'center', minWidth: '145px' }}>
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
                    const currentMode = rule ? (rule.direction_mode || (rule.is_allowed ? 'BOTH' : 'DISABLED')) : 'BOTH';

                    return (
                      <td key={gate} style={{ textAlign: 'center', padding: '0.4rem 0.2rem' }}>
                        <select
                          value={currentMode}
                          onChange={(e) => handleToggleGateRule(gate, cat, e.target.value)}
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.3rem 0.45rem',
                            margin: 0,
                            borderRadius: '16px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            textAlign: 'center',
                            background: currentMode === 'BOTH' ? '#dcfce7' : currentMode === 'IN_ONLY' ? '#dbeafe' : currentMode === 'OUT_ONLY' ? '#ffedd5' : '#fee2e2',
                            color: currentMode === 'BOTH' ? '#15803d' : currentMode === 'IN_ONLY' ? '#1d4ed8' : currentMode === 'OUT_ONLY' ? '#c2410c' : '#b91c1c',
                            border: `1px solid ${currentMode === 'BOTH' ? '#86efac' : currentMode === 'IN_ONLY' ? '#93c5fd' : currentMode === 'OUT_ONLY' ? '#fdba74' : '#fca5a5'}`
                          }}
                          title={`Configure IN/OUT direction controls for ${cat} at ${gate}`}
                        >
                          <option value="BOTH">🟢 BOTH (In & Out)</option>
                          <option value="IN_ONLY">🔵 IN ONLY (Entry)</option>
                          <option value="OUT_ONLY">🟠 OUT ONLY (Exit)</option>
                          <option value="DISABLED">🔴 DISABLED (Block)</option>
                        </select>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Super Admin Customizable L2 Approval Routing Matrix Panel */}
      <div className="card" style={{ marginBottom: '1.5rem', borderTop: '4px solid #4e081d' }}>
        <div style={{ marginBottom: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4e081d', margin: 0 }}>
              <Shield size={22} color="#df6f06" /> Customizable L2 Approval Matrix Panel (Super Admin)
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0.2rem 0 0 0' }}>
              Configure and customize default L2 approver routing for Resident, Employee, and Combined (Resident + Employee) Hosts.
            </p>
          </div>
          <span className="badge badge-inside" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
            System Status: {l2Enabled ? '⚡ L2 Approvals Active' : '🔓 Super Admin Bypassed'}
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table role="grid" style={{ fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#4e081d', color: '#ffffff' }}>
                <th>Host Profile Category</th>
                <th>Visit Purpose / Type</th>
                <th>System Default L2 Rule</th>
                <th>Active Configured L2 Approver</th>
              </tr>
            </thead>
            <tbody>
              {[
                { hostCat: 'RESIDENT', hostLabel: 'Resident Host', visitCat: 'RESIDENT_VISIT', visitLabel: 'Resident / Home Visit (HOME)', defaultApprover: 'DEPARTMENT_PRO', desc: 'resident - PRO(department)' },
                { hostCat: 'RESIDENT', hostLabel: 'Resident Host', visitCat: 'ASHRAM_VISIT', visitLabel: 'Ashram Visit (BHAJAN/ASHRAM/TOUR)', defaultApprover: 'DEPARTMENT_PRO', desc: 'asram - PRO(department)' },
                { hostCat: 'EMPLOYEE', hostLabel: 'Employee Host', visitCat: 'EMPLOYEE_OFFICIAL_VISIT', visitLabel: 'Employee Visit (OFFICE/OFFICIAL)', defaultApprover: 'SAME_DEPARTMENT_HOD', desc: 'employee - SAME DEPARTMENT - HOD(role)' },
                { hostCat: 'EMPLOYEE', hostLabel: 'Employee Host', visitCat: 'ASHRAM_VISIT', visitLabel: 'Ashram Visit (BHAJAN/ASHRAM/TOUR)', defaultApprover: 'DEPARTMENT_PRO', desc: 'asram - PRO(department)' },
                { hostCat: 'BOTH', hostLabel: 'Resident + Employee Host', visitCat: 'RESIDENT_VISIT', visitLabel: 'Resident / Home Visit (HOME)', defaultApprover: 'DEPARTMENT_PRO', desc: 'resident - PRO(department)' },
                { hostCat: 'BOTH', hostLabel: 'Resident + Employee Host', visitCat: 'EMPLOYEE_OFFICIAL_VISIT', visitLabel: 'Employee Visit (OFFICE/OFFICIAL)', defaultApprover: 'SAME_DEPARTMENT_HOD', desc: 'employee - SAME DEPARTMENT - HOD(role)' },
                { hostCat: 'BOTH', hostLabel: 'Resident + Employee Host', visitCat: 'ASHRAM_VISIT', visitLabel: 'Ashram Visit (BHAJAN/ASHRAM/TOUR)', defaultApprover: 'DEPARTMENT_PRO', desc: 'asram - PRO(department)' },
              ].map((row) => {
                const rule = l2MatrixRules.find((r) => r.host_category === row.hostCat && r.visit_type_category === row.visitCat);
                const currentApprover = rule ? rule.approver_type : row.defaultApprover;

                return (
                  <tr key={`${row.hostCat}_${row.visitCat}`}>
                    <td>
                      <strong>{row.hostLabel}</strong>
                    </td>
                    <td>{row.visitLabel}</td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: '#9c4c1c', fontWeight: '600' }}>
                        {row.desc}
                      </span>
                    </td>
                    <td>
                      <select
                        value={currentApprover}
                        onChange={(e) => handleUpdateL2MatrixRule(row.hostCat, row.visitCat, e.target.value)}
                        style={{
                          fontSize: '0.82rem',
                          padding: '0.3rem 0.6rem',
                          margin: 0,
                          borderRadius: '6px',
                          border: '2px solid #df6f06',
                          background: '#fffbf0',
                          color: '#4e081d',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="DEPARTMENT_PRO">PRO (Department)</option>
                        <option value="SAME_DEPARTMENT_HOD">Official HOD (Same Department Role)</option>
                        <option value="ACCOMMODATION_TEAM">Accommodation Team (Department)</option>
                        <option value="SUPER_ADMIN_BYPASS">Super Admin Direct Auto-Approve</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
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
              <th>User Category</th>
              <th>System Role</th>
              <th>Residency</th>
              <th>Ashram Address / Location</th>
              <th>Department</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan="11" style={{ textAlign: 'center', color: '#64748b' }}>No users found.</td>
              </tr>
            ) : (
              paginatedUsers.map((u) => (
                <tr key={u.id}>
                  <td><code style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 'bold' }}>{u.guid || (`USR-${u.id}`)}</code></td>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td>
                    <span className="badge badge-vvip" style={{ background: u.user_type === 'RESIDENT_EMPLOYEE' ? '#0d9488' : '#0284c7' }}>
                      {u.user_type === 'RESIDENT_EMPLOYEE' ? 'RESIDENT + EMPLOYEE' : (u.user_type || 'RESIDENT')}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-vvip" style={{ background: u.role === 'ADMIN' ? '#9333ea' : u.role === 'HOD' ? '#2563eb' : u.role === 'GUARD' ? '#d97706' : '#475569' }}>
                      {u.role || 'HOST'}
                    </span>
                  </td>
                  <td>{u.residency_status}</td>
                  <td style={{ fontSize: '0.8rem', color: '#475569' }}>{u.address || u.flat_info || 'Ashram Campus'}</td>
                  <td>{u.department_name || 'N/A'}</td>
                  <td>
                    <span style={{
                      color: u.registration_status === 'ACTIVE' ? '#057a55' : u.registration_status === 'PENDING_APPROVAL' ? '#d97706' : '#dc2626',
                      fontWeight: 'bold',
                      fontSize: '0.78rem',
                      background: u.registration_status === 'ACTIVE' ? '#dcfce7' : u.registration_status === 'PENDING_APPROVAL' ? '#fef3c7' : '#fee2e2',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '12px',
                      border: `1px solid ${u.registration_status === 'ACTIVE' ? '#86efac' : u.registration_status === 'PENDING_APPROVAL' ? '#fde68a' : '#fca5a5'}`
                    }}>
                      ● {u.registration_status || 'ACTIVE'}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => openEditUserModal(u)}
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', background: '#2563eb', borderColor: '#2563eb', color: 'white', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <Pencil size={13} /> Edit User & Status
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Super Admin Master Pending L2 Approvals Panel */}
      <div className="card" style={{ borderTop: '4px solid #7c3aed' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#7c3aed', margin: 0 }}>
              <CheckCircle size={22} color="#7c3aed" /> Master L2 Approvals Queue (Super Admin Control)
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0.2rem 0 0 0' }}>
              Super Admin can view all pending Level-2 approval requests across all departments and directly approve or reject them.
            </p>
          </div>
          <span className="badge badge-pending_l2" style={{ fontSize: '0.82rem', padding: '0.3rem 0.7rem' }}>
            Pending L2 Requests: {pendingL2List.length}
          </span>
        </div>

        <PaginationControls
          searchTerm={l2Search}
          setSearchTerm={setL2Search}
          currentPage={l2Page}
          setCurrentPage={setL2Page}
          totalPages={l2TotalPages}
          totalItems={l2TotalItems}
          pageSize={10}
          placeholder="Search L2 pending requests by Visitor, Passcode, Host Name, Role, Department..."
        />

        <div style={{ overflowX: 'auto', marginTop: '0.5rem' }}>
          <table role="grid">
            <thead>
              <tr style={{ background: '#f5f3ff' }}>
                <th>Pass Code</th>
                <th>Visitor Name & Category</th>
                <th>Host / Referral Person</th>
                <th>Department & Role</th>
                <th>Status</th>
                <th>Super Admin L2 Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPendingL2.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: '#64748b', padding: '1.2rem' }}>
                    🎉 No pending L2 approvals requiring action.
                  </td>
                </tr>
              ) : (
                paginatedPendingL2.map((req) => (
                  <tr key={req.id}>
                    <td>
                      <strong style={{ color: '#4e081d' }}>{req.pass_code}</strong>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{new Date(req.created_at).toLocaleString()}</div>
                    </td>
                    <td>
                      <strong>{req.visitor_name}</strong> ({req.visitor_phone})
                      <div><span className="badge badge-inside" style={{ fontSize: '0.7rem' }}>{req.visitor_category || 'GENERAL'}</span></div>
                    </td>
                    <td>
                      {req.host_name || 'System Auto'}
                      {req.host_address ? <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Flat: {req.host_address}</div> : null}
                    </td>
                    <td>
                      <strong>{req.host_role || 'RESIDENT'}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#475569' }}>{req.host_department || 'General'}</div>
                    </td>
                    <td>
                      <span className={`badge badge-${req.status.toLowerCase()}`}>{req.status}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => handleL2Decision(req.id, 'APPROVE')}
                          style={{ background: '#166534', borderColor: '#166534', color: 'white', padding: '0.25rem 0.65rem', fontSize: '0.75rem', fontWeight: 'bold' }}
                        >
                          <Check size={14} /> Approve L2
                        </button>
                        <button
                          onClick={() => handleL2Decision(req.id, 'REJECT')}
                          style={{ background: '#991b1b', borderColor: '#991b1b', color: 'white', padding: '0.25rem 0.65rem', fontSize: '0.75rem', fontWeight: 'bold' }}
                        >
                          <X size={14} /> Reject L2
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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

      {/* Universal Live System Audit Log Ledger */}
      <div className="card" style={{ borderTop: '4px solid #4e081d' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4e081d', margin: 0 }}>
              <ShieldAlert color="#df6f06" size={22} /> Universal System Audit & Action Ledger (Super Admin)
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0.2rem 0 0 0' }}>
              Complete immutable security audit trail logging every user login, pass approval, gate movement, administrative change, and result.
            </p>
          </div>
          <span className="badge badge-inside" style={{ fontSize: '0.8rem' }}>
            Total Audit Records: {auditLogs.length}
          </span>
        </div>

        <PaginationControls
          searchTerm={auditSearch}
          setSearchTerm={setAuditSearch}
          currentPage={auditPage}
          setCurrentPage={setAuditPage}
          totalPages={auditTotalPages}
          totalItems={auditTotalItems}
          pageSize={10}
          placeholder="Filter audit logs by Who (Actor), Role, Action, Status, IP, or Remarks..."
        />

        <div style={{ overflowX: 'auto' }}>
          <table role="grid" style={{ fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#4e081d', color: '#ffffff' }}>
                <th>Log ID & Time</th>
                <th>Who (Actor & Role)</th>
                <th>What (Action Performed)</th>
                <th>Result & Details</th>
                <th>Status</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAuditLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: '#64748b', padding: '1.5rem' }}>
                    No audit logs matching filter.
                  </td>
                </tr>
              ) : (
                paginatedAuditLogs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <div style={{ fontWeight: 'bold', color: '#4e081d' }}><code>{log.guid || (`AUD-${log.id}`)}</code></div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 'bold', color: '#1e293b' }}>
                        {log.actor_name || 'System / Guest'}
                      </div>
                      <span className="badge badge-inside" style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', marginTop: '0.2rem' }}>
                        {log.actor_role || 'SYSTEM'}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: 'bold',
                          fontSize: '0.78rem',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          background: log.action?.includes('APPROVE') || log.action === 'USER_LOGIN' || log.action?.includes('GATE')
                            ? '#dcfce7'
                            : log.action?.includes('FAIL') || log.action?.includes('DENIED')
                            ? '#fee2e2'
                            : '#fff8eb',
                          color: log.action?.includes('APPROVE') || log.action === 'USER_LOGIN' || log.action?.includes('GATE')
                            ? '#15803d'
                            : log.action?.includes('FAIL') || log.action?.includes('DENIED')
                            ? '#b91c1c'
                            : '#9c4c1c',
                          border: '1px solid currentColor',
                          display: 'inline-block',
                        }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td style={{ maxWidth: '350px', wordBreak: 'break-word', fontSize: '0.82rem' }}>
                      <strong>[{log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}]</strong> {log.remarks}
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: 'bold',
                          fontSize: '0.75rem',
                          color: log.status === 'FAILED' ? '#dc2626' : '#057a55',
                        }}
                      >
                        ● {log.status || 'SUCCESS'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: 'monospace' }}>
                      {log.ip_address || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Details & Registration Status Modal (Super Admin) */}
      {editUserModalData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: '#ffffff', padding: '1.8rem', borderRadius: '12px', maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.8rem' }}>
              <h3 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Pencil size={20} color="#2563eb" /> Edit User Profile & Status (User #{editUserModalData.id})
              </h3>
              <button type="button" onClick={() => setEditUserModalData(null)} style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUserEdit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#334155' }}>
                    Full Name *
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      style={{ marginTop: '0.3rem' }}
                    />
                  </label>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#334155' }}>
                    Email Address *
                    <input
                      type="email"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      style={{ marginTop: '0.3rem' }}
                    />
                  </label>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#334155' }}>
                    Phone Number
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      style={{ marginTop: '0.3rem' }}
                    />
                  </label>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#334155' }}>
                    User Category / Type *
                    <select
                      value={editUserType}
                      onChange={(e) => setEditUserType(e.target.value)}
                      style={{ marginTop: '0.3rem', fontWeight: 'bold' }}
                    >
                      <option value="RESIDENT">RESIDENT (Ashram Resident Host)</option>
                      <option value="EMPLOYEE">EMPLOYEE (Ashram Staff Member)</option>
                      <option value="RESIDENT_EMPLOYEE">RESIDENT_EMPLOYEE (Resident + Staff Dual Profile)</option>
                      <option value="VOLUNTEER">VOLUNTEER (Ashram Sevadal / Volunteer)</option>
                      <option value="STUDENT">STUDENT (Campus Student)</option>
                      <option value="GUEST">GUEST (Visiting Guest Host)</option>
                    </select>
                  </label>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#334155' }}>
                    System Access Role *
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      style={{ marginTop: '0.3rem', fontWeight: 'bold' }}
                    >
                      <option value="HOST">HOST (Standard Host - L1 Visitor Approver)</option>
                      <option value="HOD">HOD (Department Head L2 Approver)</option>
                      <option value="PRO">PRO (Public Relations Officer L2 Approver)</option>
                      <option value="GUARD">GUARD (Security Gate Pass Terminal Guard)</option>
                      <option value="SUPERVISOR">SUPERVISOR (Security Officer Override)</option>
                      <option value="SECURITY_HEAD">SECURITY_HEAD (Chief Security Officer)</option>
                      <option value="ADMIN">ADMIN (Super Administrator)</option>
                    </select>
                  </label>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#334155' }}>
                    Residency Category *
                    <select
                      value={editResidency}
                      onChange={(e) => setEditResidency(e.target.value)}
                      style={{ marginTop: '0.3rem', fontWeight: 'bold' }}
                    >
                      <option value="RESIDENT">RESIDENT (Ashram Resident)</option>
                      <option value="NON_RESIDENT">NON_RESIDENT (Staff Commuter / External)</option>
                    </select>
                  </label>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#7c3aed' }}>
                    Account Registration Status *
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      style={{ marginTop: '0.3rem', fontWeight: 'bold', border: '2px solid #7c3aed', background: '#faf5ff', color: '#4c1d95' }}
                    >
                      <option value="ACTIVE">🟢 ACTIVE (Full Access & Login Permitted)</option>
                      <option value="PENDING_APPROVAL">🟡 PENDING_APPROVAL (Awaiting Admin Review)</option>
                      <option value="REJECTED">🔴 REJECTED (Registration Denied)</option>
                      <option value="SUSPENDED">⛔ SUSPENDED (Login & Access Revoked)</option>
                    </select>
                  </label>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#334155' }}>
                    Flat Info / Residence Location
                    <input
                      type="text"
                      placeholder="e.g. Anand Bhavan Flat 302"
                      value={editFlatInfo}
                      onChange={(e) => setEditFlatInfo(e.target.value)}
                      style={{ marginTop: '0.3rem' }}
                    />
                  </label>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#334155' }}>
                    Assigned Department
                    <select
                      value={editDeptId}
                      onChange={(e) => setEditDeptId(e.target.value)}
                      style={{ marginTop: '0.3rem' }}
                    >
                      <option value="">-- No Specific Department --</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code || 'DEPT'})
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setEditUserModalData(null)}
                  style={{ background: '#94a3b8', borderColor: '#94a3b8', color: 'white', fontWeight: 'bold' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#2563eb', borderColor: '#2563eb', color: 'white', fontWeight: 'bold' }}
                >
                  💾 Save Profile & Status Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

