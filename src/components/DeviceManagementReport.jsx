import React, { useState, useEffect } from 'react';
import {
  getAdminDevices,
  createAdminDevice,
  updateAdminDevice,
  getDeviceDutyAudit,
} from '../services/api';
import {
  Smartphone,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  Plus,
  RefreshCw,
  Search,
  Calendar,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  Building,
  Edit2,
  Download,
} from 'lucide-react';

export default function DeviceManagementReport({ user }) {
  const [activeSubTab, setActiveSubTab] = useState('devices'); // 'devices' | 'audit'

  // Devices state
  const [devices, setDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [deviceSearch, setDeviceSearch] = useState('');
  const [showSecretMap, setShowSecretMap] = useState({});

  // Device Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [deviceIdInput, setDeviceIdInput] = useState('');
  const [deviceNameInput, setDeviceNameInput] = useState('');
  const [gateNameInput, setGateNameInput] = useState('NORTH_GATE');
  const [secretCodeInput, setSecretCodeInput] = useState('');
  const [statusInput, setStatusInput] = useState('ACTIVE');
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  // Audit state
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [filterDate, setFilterDate] = useState('');
  const [filterDevice, setFilterDevice] = useState('');
  const [filterGate, setFilterGate] = useState('');
  const [auditSearch, setAuditSearch] = useState('');

  const [notification, setNotification] = useState('');

  useEffect(() => {
    fetchDevicesList();
    fetchDutyAuditList();
  }, []);

  const fetchDevicesList = async () => {
    setLoadingDevices(true);
    try {
      const res = await getAdminDevices();
      if (res.success) {
        setDevices(res.devices || []);
      }
    } catch (err) {
      console.error('Failed to fetch devices:', err);
    } finally {
      setLoadingDevices(false);
    }
  };

  const fetchDutyAuditList = async () => {
    setLoadingAudit(true);
    try {
      const params = {};
      if (filterDate) params.date = filterDate;
      if (filterDevice) params.device_id = filterDevice;
      if (filterGate) params.gate_name = filterGate;

      const res = await getDeviceDutyAudit(params);
      if (res.success) {
        setAuditLogs(res.audit_logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch duty audit:', err);
    } finally {
      setLoadingAudit(false);
    }
  };

  const openAddModal = () => {
    setEditingDevice(null);
    setDeviceIdInput('');
    setDeviceNameInput('');
    setGateNameInput('NORTH_GATE');
    setSecretCodeInput('123456');
    setStatusInput('ACTIVE');
    setModalError('');
    setModalSuccess('');
    setShowModal(true);
  };

  const openEditModal = (dev) => {
    setEditingDevice(dev);
    setDeviceIdInput(dev.device_id);
    setDeviceNameInput(dev.device_name || '');
    setGateNameInput(dev.gate_name || 'NORTH_GATE');
    setSecretCodeInput(dev.secret_code || '');
    setStatusInput(dev.status || 'ACTIVE');
    setModalError('');
    setModalSuccess('');
    setShowModal(true);
  };

  const handleSaveDevice = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');

    if (!deviceIdInput.trim()) {
      setModalError('Device ID is required.');
      return;
    }
    if (!secretCodeInput.trim()) {
      setModalError('Secret Code is required.');
      return;
    }

    try {
      if (editingDevice) {
        const res = await updateAdminDevice(editingDevice.id, {
          device_name: deviceNameInput.trim(),
          gate_name: gateNameInput,
          secret_code: secretCodeInput.trim(),
          status: statusInput,
        });
        if (res.success) {
          setNotification(`Device '${res.device.device_id}' updated successfully.`);
          setShowModal(false);
          fetchDevicesList();
        }
      } else {
        const res = await createAdminDevice({
          device_id: deviceIdInput.trim().toUpperCase(),
          device_name: deviceNameInput.trim() || `${gateNameInput} Terminal`,
          gate_name: gateNameInput,
          secret_code: secretCodeInput.trim(),
        });
        if (res.success) {
          setNotification(`Device '${res.device.device_id}' created successfully.`);
          setShowModal(false);
          fetchDevicesList();
        }
      }
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to save device.');
    }
  };

  const toggleShowSecret = (id) => {
    setShowSecretMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtered devices list
  const filteredDevices = devices.filter((d) => {
    const q = deviceSearch.toLowerCase();
    return (
      d.device_id?.toLowerCase().includes(q) ||
      d.device_name?.toLowerCase().includes(q) ||
      d.gate_name?.toLowerCase().includes(q)
    );
  });

  // Filtered audit list
  const filteredAudit = auditLogs.filter((a) => {
    const q = auditSearch.toLowerCase();
    return (
      a.device_id?.toLowerCase().includes(q) ||
      a.guard_name?.toLowerCase().includes(q) ||
      a.guard_phone?.toLowerCase().includes(q) ||
      a.gate_name?.toLowerCase().includes(q)
    );
  });

  const activeTerminalsCount = devices.filter((d) => d.status === 'ACTIVE').length;
  const totalOnDutyGuardsCount = devices.reduce(
    (acc, d) => acc + (d.active_guards ? d.active_guards.length : 0),
    0
  );

  return (
    <div style={{ marginTop: '1rem' }}>
      {/* Top Banner & Stats */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #800000 0%, #4a0000 100%)',
          borderRadius: '12px',
          padding: '1.2rem 1.5rem',
          color: '#ffffff',
          marginBottom: '1.2rem',
          boxShadow: '0 4px 12px rgba(128, 0, 0, 0.2)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Smartphone size={24} color="#f59e0b" />
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800' }}>
              Ashram Gate Devices & Duty Audit
            </h2>
          </div>
          <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem', color: '#fef3c7' }}>
            Manage Ashram-owned guard terminal devices, assign gates, and audit on-duty guard connections date-wise.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', textAlign: 'right' }}>
          <div style={{ background: 'rgba(255,255,255,0.12)', padding: '0.5rem 1rem', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#fcd34d', display: 'block' }}>
              Enrolled Terminals
            </span>
            <strong style={{ fontSize: '1.4rem' }}>{devices.length}</strong>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.12)', padding: '0.5rem 1rem', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#86efac', display: 'block' }}>
              Guards On Duty
            </span>
            <strong style={{ fontSize: '1.4rem' }}>{totalOnDutyGuardsCount}</strong>
          </div>
        </div>
      </div>

      {notification && (
        <div
          style={{
            background: '#def7ec',
            color: '#03543f',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderLeft: '4px solid #0e9f6e',
          }}
        >
          <span>{notification}</span>
          <button
            type="button"
            onClick={() => setNotification('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#03543f' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Sub-tab Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.2rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        <button
          type="button"
          onClick={() => setActiveSubTab('devices')}
          style={{
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            cursor: 'pointer',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: activeSubTab === 'devices' ? '#800000' : '#f1f5f9',
            color: activeSubTab === 'devices' ? '#ffffff' : '#475569',
          }}
        >
          <Smartphone size={16} /> Ashram Enrolled Devices ({devices.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('audit')}
          style={{
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            cursor: 'pointer',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: activeSubTab === 'audit' ? '#800000' : '#f1f5f9',
            color: activeSubTab === 'audit' ? '#ffffff' : '#475569',
          }}
        >
          <Clock size={16} /> Date-wise & Device-wise Guard Duty Audit
        </button>
      </div>

      {/* TAB 1: DEVICE MANAGEMENT */}
      {activeSubTab === 'devices' && (
        <div>
          {/* Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '380px' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '11px', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search by Device ID, Name, or Gate..."
                value={deviceSearch}
                onChange={(e) => setDeviceSearch(e.target.value)}
                style={{ paddingLeft: '32px', margin: 0, fontSize: '0.88rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={fetchDevicesList}
                className="secondary outline"
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}
              >
                <RefreshCw size={14} /> Refresh
              </button>
              <button
                type="button"
                onClick={openAddModal}
                style={{
                  background: '#800000',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.5rem 1rem',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  cursor: 'pointer',
                }}
              >
                <Plus size={16} /> Register New Device
              </button>
            </div>
          </div>

          {/* Devices Table */}
          <div style={{ overflowX: 'auto', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Device ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Device Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Assigned Gate</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Secret Code</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Currently On-Duty Guards</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map((d) => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <strong style={{ color: '#800000', fontFamily: 'monospace', fontSize: '0.92rem' }}>
                        {d.device_id}
                      </strong>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#1e293b' }}>
                      {d.device_name || 'Ashram Terminal'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span
                        style={{
                          background: '#fef3c7',
                          color: '#92400e',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '6px',
                          fontWeight: 'bold',
                          fontSize: '0.78rem',
                          border: '1px solid #fde68a',
                        }}
                      >
                        {d.gate_name}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontFamily: 'monospace' }}>
                          {showSecretMap[d.id] ? d.secret_code : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleShowSecret(d.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: '2px',
                            cursor: 'pointer',
                            color: '#64748b',
                          }}
                          title="Reveal / Hide secret"
                        >
                          {showSecretMap[d.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {d.active_guards && d.active_guards.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                          {d.active_guards.map((g) => (
                            <span
                              key={g.id || g.guard_id}
                              style={{
                                background: '#f0fdf4',
                                color: '#166534',
                                border: '1px solid #bbf7d0',
                                borderRadius: '12px',
                                padding: '0.15rem 0.5rem',
                                fontSize: '0.74rem',
                                fontWeight: 'bold',
                              }}
                            >
                              👮 {g.guard_name} ({g.guard_phone ? g.guard_phone.slice(-4) : 'ID'})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.78rem' }}>
                          No guards logged in
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span
                        style={{
                          background: d.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2',
                          color: d.status === 'ACTIVE' ? '#15803d' : '#991b1b',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontWeight: 'bold',
                          fontSize: '0.72rem',
                        }}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => openEditModal(d)}
                        className="secondary outline"
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredDevices.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      No devices matching query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: GUARD DUTY CONNECTION AUDIT */}
      {activeSubTab === 'audit' && (
        <div>
          {/* Filters Bar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.8rem',
              background: '#f8fafc',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              marginBottom: '1rem',
              alignItems: 'flex-end',
            }}
          >
            <div style={{ minWidth: '160px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#475569', marginBottom: '0.3rem' }}>
                Filter by Date:
              </label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                style={{ margin: 0, fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ minWidth: '160px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#475569', marginBottom: '0.3rem' }}>
                Filter by Device:
              </label>
              <select
                value={filterDevice}
                onChange={(e) => setFilterDevice(e.target.value)}
                style={{ margin: 0, fontSize: '0.85rem' }}
              >
                <option value="">All Devices</option>
                {devices.map((d) => (
                  <option key={d.id} value={d.device_id}>
                    {d.device_id} ({d.gate_name})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ minWidth: '160px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#475569', marginBottom: '0.3rem' }}>
                Filter by Gate:
              </label>
              <select
                value={filterGate}
                onChange={(e) => setFilterGate(e.target.value)}
                style={{ margin: 0, fontSize: '0.85rem' }}
              >
                <option value="">All Gates</option>
                <option value="NORTH_GATE">North Gate</option>
                <option value="SOUTH_GATE">South Gate</option>
                <option value="EAST_GATE">East Gate</option>
                <option value="WEST_GATE">West Gate</option>
                <option value="STAFF_GATE">Staff Gate</option>
              </select>
            </div>

            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#475569', marginBottom: '0.3rem' }}>
                Search Guard / Phone:
              </label>
              <input
                type="text"
                placeholder="Search guard name or phone..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                style={{ margin: 0, fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                type="button"
                onClick={fetchDutyAuditList}
                style={{
                  background: '#800000',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.5rem 1rem',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <Filter size={14} /> Apply Filter
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterDate('');
                  setFilterDevice('');
                  setFilterGate('');
                  setAuditSearch('');
                  fetchDutyAuditList();
                }}
                className="secondary outline"
                style={{ fontSize: '0.85rem' }}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div style={{ overflowX: 'auto', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Duty Date</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Device ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Gate Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Guard Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Guard Phone</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Check-In Time</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Check-Out Time</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Duration</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Duty Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAudit.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                      {log.duty_date ? new Date(log.duty_date).toLocaleDateString() : 'Today'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <strong style={{ color: '#800000', fontFamily: 'monospace' }}>{log.device_id}</strong>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ background: '#fef3c7', color: '#92400e', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {log.gate_name}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <strong style={{ color: '#1e293b' }}>{log.guard_name}</strong>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>
                      {log.guard_phone || '—'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#166534', whiteSpace: 'nowrap' }}>
                      {log.checked_in_at ? new Date(log.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#991b1b', whiteSpace: 'nowrap' }}>
                      {log.checked_out_at ? new Date(log.checked_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Still on duty'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>
                      {log.duration_minutes ? `${log.duration_minutes} mins` : '< 1 min'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span
                        style={{
                          background: log.status === 'ON_DUTY' ? '#dcfce7' : '#f1f5f9',
                          color: log.status === 'ON_DUTY' ? '#15803d' : '#64748b',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '12px',
                          fontWeight: 'bold',
                          fontSize: '0.72rem',
                        }}
                      >
                        {log.status === 'ON_DUTY' ? '● ON DUTY' : '✓ COMPLETED'}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredAudit.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                      No duty connection logs found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT DEVICE MODAL */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '1.5rem',
              width: '100%',
              maxWidth: '480px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b', fontWeight: 'bold' }}>
                {editingDevice ? `Edit Device: ${editingDevice.device_id}` : 'Register New Ashram Device'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.6rem', borderRadius: '6px', fontSize: '0.82rem', marginBottom: '0.8rem' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveDevice}>
              <div style={{ marginBottom: '0.8rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                  Device ID (Hardware / Tag Identifier) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. DEV-NORTH-01"
                  value={deviceIdInput}
                  onChange={(e) => setDeviceIdInput(e.target.value.toUpperCase())}
                  disabled={!!editingDevice}
                  required
                  style={{ margin: 0 }}
                />
              </div>

              <div style={{ marginBottom: '0.8rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                  Device Name / Terminal Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. North Gate Main Terminal Phone"
                  value={deviceNameInput}
                  onChange={(e) => setDeviceNameInput(e.target.value)}
                  style={{ margin: 0 }}
                />
              </div>

              <div style={{ marginBottom: '0.8rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                  Assign Gate (Fixed for this Device) *
                </label>
                <select
                  value={gateNameInput}
                  onChange={(e) => setGateNameInput(e.target.value)}
                  required
                  style={{ margin: 0 }}
                >
                  <option value="NORTH_GATE">North Gate (Main Entrance)</option>
                  <option value="SOUTH_GATE">South Gate (Service Entrance)</option>
                  <option value="EAST_GATE">East Gate (Hospital & Residential)</option>
                  <option value="WEST_GATE">West Gate (School & Campus)</option>
                  <option value="STAFF_GATE">Staff & Logistics Gate</option>
                </select>
              </div>

              <div style={{ marginBottom: '0.8rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                  Device Secret Code (Used for Mobile Login) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 123456"
                  value={secretCodeInput}
                  onChange={(e) => setSecretCodeInput(e.target.value)}
                  required
                  style={{ margin: 0 }}
                />
              </div>

              {editingDevice && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                    Device Status
                  </label>
                  <select
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value)}
                    style={{ margin: 0 }}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE / BLOCKED</option>
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.2rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="secondary outline"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: '#800000',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.5rem 1.2rem',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  {editingDevice ? 'Update Device' : 'Register Device'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
