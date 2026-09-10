import React, { useState, useEffect } from 'react';
import { getDashboardMetrics, getReportData, getSystemSettings, toggleL2Approval, resolveIncident } from '../services/api';
import DashboardHeader from '../components/DashboardHeader';
import { useTablePagination, PaginationControls } from '../components/TablePagination';
import { ShieldCheck, ToggleLeft, ToggleRight, FileText, Users, AlertTriangle, Crown, ShieldAlert, Eye, Check, CheckCircle } from 'lucide-react';

export default function SecurityHeadDashboard({ user }) {
  const [metrics, setMetrics] = useState({
    visitors_inside: 0,
    total_today: 0,
    pending_approvals: 0,
    overstays: 0,
    vvip_visits_today: 0,
    open_incidents: 0,
  });

  const [l2Enabled, setL2Enabled] = useState(true);
  const [reportType, setReportType] = useState('DAILY_ENTRY_EXIT');
  const [reportData, setReportData] = useState([]);
  const [loadingReport, setLoadingReport] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [msg, setMsg] = useState('');

  const {
    searchTerm: reportSearch,
    setSearchTerm: setReportSearch,
    currentPage: reportPage,
    setCurrentPage: setReportPage,
    totalPages: reportTotalPages,
    totalItems: reportTotalItems,
    paginatedData: paginatedReportData,
  } = useTablePagination(reportData, [
    'visitor_name', 'phone', 'pass_code', 'host_name', 'action', 'remarks',
    'visitor_category', 'incident_id', 'incident_type', 'description',
    'gate_name', 'guard_name', 'vehicle_no'
  ], 10);

  useEffect(() => {
    fetchMetrics();
    fetchSettings();
    fetchReport(reportType);

    const handleRealtimeSync = () => {
      fetchMetrics();
      fetchReport(reportType);
    };

    window.addEventListener('vms_realtime_sync', handleRealtimeSync);
    return () => window.removeEventListener('vms_realtime_sync', handleRealtimeSync);
  }, [reportType]);

  const fetchMetrics = async () => {
    try {
      const res = await getDashboardMetrics();
      if (res.success) setMetrics(res.metrics);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await getSystemSettings();
      if (res.success) setL2Enabled(res.settings.L2_APPROVAL_ENABLED);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReport = async (type) => {
    setReportType(type);
    setLoadingReport(true);
    try {
      const res = await getReportData(type);
      if (res.success) setReportData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleToggleL2 = async () => {
    try {
      const res = await toggleL2Approval(!l2Enabled);
      if (res.success) {
        setL2Enabled(res.l2_enabled);
        setMsg(`Global L2 Approval Workflow setting set to ${res.l2_enabled ? 'ENABLED (ON)' : 'DISABLED (OFF)'}`);
      }
    } catch (err) {
      alert('Failed to toggle L2 setting.');
    }
  };

  const handleResolveIncident = async () => {
    if (!selectedIncident || !resolutionNotes.trim()) {
      alert('Please enter executive resolution notes.');
      return;
    }
    try {
      const res = await resolveIncident(selectedIncident.id, resolutionNotes);
      if (res.success) {
        setMsg(`Incident ${selectedIncident.incident_id || '#' + selectedIncident.id} successfully resolved by Security Head.`);
        setSelectedIncident(null);
        setResolutionNotes('');
        fetchReport(reportType);
        fetchMetrics();
      }
    } catch (err) {
      alert('Failed to resolve incident: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="container">
      <DashboardHeader
        title="Security Head Command Center"
        subtitle="Global Executive Security & Real-Time Monitoring"
        roleBadge="SECURITY HEAD"
        actionButton={
          <div style={{ background: '#1e293b', padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '0.82rem', color: '#cbd5e1', marginRight: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>
              Global L2 Approval Toggle:
            </span>
            <button
              onClick={handleToggleL2}
              style={{
                background: l2Enabled ? '#057a55' : '#475569',
                color: 'white',
                border: 'none',
                padding: '0.3rem 0.8rem',
                borderRadius: '4px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              {l2Enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              {l2Enabled ? 'L2 Mandatory (ON)' : 'L2 Bypass (OFF)'}
            </button>
          </div>
        }
      />

      {msg && <div style={{ background: '#def7ec', color: '#03543f', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem' }}>{msg}</div>}

      {/* Analytics KPI Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ borderTop: '4px solid #3b82f6', margin: 0 }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Visitors Inside Campus</span>
          <div className="metric-value">{metrics.visitors_inside}</div>
        </div>
        <div className="card" style={{ borderTop: '4px solid #10b981', margin: 0 }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Total Registrations Today</span>
          <div className="metric-value">{metrics.total_today}</div>
        </div>
        <div className="card" style={{ borderTop: '4px solid #f59e0b', margin: 0 }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Pending Approvals</span>
          <div className="metric-value">{metrics.pending_approvals}</div>
        </div>
        <div className="card" style={{ borderTop: '4px solid #ef4444', margin: 0 }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Overstay Alerts</span>
          <div className="metric-value">{metrics.overstays}</div>
        </div>
        <div
          className="card"
          onClick={() => fetchReport('INCIDENTS')}
          style={{
            borderTop: `4px solid ${metrics.open_incidents > 0 ? '#dc2626' : '#64748b'}`,
            margin: 0,
            cursor: 'pointer',
            background: reportType === 'INCIDENTS' ? '#fff5f5' : '#ffffff',
            transition: 'transform 0.15s ease'
          }}
          title="Click to view all Gate Security Incidents"
        >
          <span style={{ fontSize: '0.85rem', color: metrics.open_incidents > 0 ? '#dc2626' : '#64748b', fontWeight: 'bold' }}>
            🚨 Open Gate Incidents
          </span>
          <div className="metric-value" style={{ color: metrics.open_incidents > 0 ? '#dc2626' : 'inherit' }}>
            {metrics.open_incidents || 0}
          </div>
        </div>
      </div>

      {/* Incident Resolution Modal for Security Head */}
      {selectedIncident && (
        <div className="card" style={{ border: '2px solid #dc2626', background: '#fff5f5', marginBottom: '1.5rem' }}>
          <h3 style={{ color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert color="#dc2626" /> Security Head Incident Resolution: {selectedIncident.incident_id || `INC-${selectedIncident.id}`}
          </h3>
          <div style={{ fontSize: '0.85rem', color: '#1f2937', marginBottom: '0.75rem' }}>
            <strong>Type:</strong> {selectedIncident.incident_type} ({selectedIncident.severity} Severity) |{' '}
            <strong>Gate:</strong> {selectedIncident.gate_name} |{' '}
            <strong>Reported by:</strong> {selectedIncident.guard_name || 'Guard'} (Device: {selectedIncident.device_id || 'N/A'})
          </div>
          <div style={{ background: '#fff', padding: '0.6rem', borderRadius: '4px', border: '1px solid #fecaca', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
            <strong>Incident Description:</strong> {selectedIncident.description}
          </div>

          <label style={{ fontWeight: 'bold', color: '#991b1b' }}>
            Executive Resolution Remarks & Directives (Mandatory):
            <textarea
              rows="3"
              placeholder="e.g. Reviewed CCTV footage and evidence photo. Security protocol enforced. Driver barred from campus entry for 30 days..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              required
              style={{ marginTop: '0.3rem' }}
            ></textarea>
          </label>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
            <button onClick={handleResolveIncident} style={{ background: '#dc2626', color: '#fff' }}>
              <CheckCircle size={16} /> Resolve Incident as Security Head
            </button>
            <button className="secondary" onClick={() => setSelectedIncident(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Full-Screen Evidence Photo Preview Modal */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1rem',
            cursor: 'pointer'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '8px',
              padding: '1rem',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <h4 style={{ margin: '0 0 0.75rem 0', color: '#1e293b' }}>Incident Photographic Evidence</h4>
            <img
              src={previewPhoto}
              alt="Incident Evidence Full Preview"
              style={{ maxWidth: '80vw', maxHeight: '70vh', objectFit: 'contain', borderRadius: '4px' }}
            />
            <button
              onClick={() => setPreviewPhoto(null)}
              style={{ marginTop: '1rem', background: '#1e293b', color: '#fff', padding: '0.4rem 1.2rem', borderRadius: '4px', border: 'none' }}
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* 13 Built-in Reports & Analytics Suite */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h3>Executive Reports & Audit Logs</h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className={reportType === 'INCIDENTS' ? '' : 'secondary outline'}
              onClick={() => fetchReport('INCIDENTS')}
              style={{
                fontSize: '0.75rem',
                padding: '0.3rem 0.6rem',
                borderColor: '#dc2626',
                color: reportType === 'INCIDENTS' ? '#fff' : '#dc2626',
                background: reportType === 'INCIDENTS' ? '#dc2626' : 'transparent',
                fontWeight: 'bold'
              }}
            >
              🚨 Gate Incidents ({metrics.open_incidents || 0})
            </button>
            <button className={reportType === 'DAILY_ENTRY_EXIT' ? '' : 'secondary outline'} onClick={() => fetchReport('DAILY_ENTRY_EXIT')} style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>
              Daily Ingress/Egress
            </button>
            <button className={reportType === 'SPOT_REG' ? '' : 'secondary outline'} onClick={() => fetchReport('SPOT_REG')} style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>
              Spot Registrations
            </button>
            <button className={reportType === 'PRE_REG' ? '' : 'secondary outline'} onClick={() => fetchReport('PRE_REG')} style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>
              Pre-Registrations
            </button>
            <button className={reportType === 'VENDOR' ? '' : 'secondary outline'} onClick={() => fetchReport('VENDOR')} style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>
              Vendors & Supply
            </button>
            <button className={reportType === 'OVERSTAY' ? '' : 'secondary outline'} onClick={() => fetchReport('OVERSTAY')} style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>
              Delayed Exits
            </button>
            <button className={reportType === 'FOREIGN' ? '' : 'secondary outline'} onClick={() => fetchReport('FOREIGN')} style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>
              Foreign Visitors
            </button>
            <button className={reportType === 'VVIP' ? '' : 'secondary outline'} onClick={() => fetchReport('VVIP')} style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>
              VVIP Visits
            </button>
            <button className={reportType === 'EXCEPTION' ? '' : 'secondary outline'} onClick={() => fetchReport('EXCEPTION')} style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>
              Security Audit Logs
            </button>
          </div>
        </div>

        <PaginationControls
          searchTerm={reportSearch}
          setSearchTerm={setReportSearch}
          currentPage={reportPage}
          setCurrentPage={setReportPage}
          totalPages={reportTotalPages}
          totalItems={reportTotalItems}
          pageSize={10}
          placeholder="Search report by ID, Visitor, Passcode, Gate, Guard, Severity, Action..."
        />

        <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
          <table role="grid">
            <thead>
              <tr>
                {reportType === 'INCIDENTS' ? (
                  <>
                    <th>Incident ID</th>
                    <th>Gate & Guard</th>
                    <th>Type & Severity</th>
                    <th>Description / Details</th>
                    <th>Evidence Photo</th>
                    <th>Status</th>
                    <th>Executive Action</th>
                  </>
                ) : reportType === 'EXCEPTION' ? (
                  <>
                    <th>ID</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Entity ID</th>
                    <th>Remarks</th>
                    <th>Timestamp</th>
                  </>
                ) : (
                  <>
                    <th>ID / Code</th>
                    <th>Visitor Name</th>
                    <th>Category / Gate</th>
                    <th>Host / Details</th>
                    <th>Status / Direction</th>
                    <th>Timestamp</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {loadingReport ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '1.5rem' }}>Loading report data...</td>
                </tr>
              ) : paginatedReportData.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: '#64748b', padding: '1.5rem' }}>No data records found matching filter.</td>
                </tr>
              ) : (
                paginatedReportData.map((row, idx) => {
                  if (reportType === 'INCIDENTS') {
                    const isHigh = row.severity === 'HIGH';
                    const isMed = row.severity === 'MEDIUM';
                    const sevBg = isHigh ? '#fee2e2' : isMed ? '#fef3c7' : '#dbeafe';
                    const sevColor = isHigh ? '#dc2626' : isMed ? '#d97706' : '#2563eb';
                    const isOpen = row.status === 'OPEN';

                    return (
                      <tr key={row.id || idx} style={{ background: isOpen && isHigh ? '#fff5f5' : 'transparent' }}>
                        <td>
                          <strong>{row.incident_id || `INC-${row.id}`}</strong>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            {new Date(row.created_at).toLocaleString()}
                          </div>
                        </td>
                        <td>
                          <strong>{row.gate_name || 'N/A'}</strong>
                          <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                            Guard: {row.guard_name || row.guard_id || 'On-Duty Guard'}
                          </div>
                          {row.device_id && (
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                              Device: {row.device_id}
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.2rem' }}>
                            {row.incident_type}
                          </div>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 'bold',
                              background: sevBg,
                              color: sevColor
                            }}
                          >
                            {row.severity}
                          </span>
                        </td>
                        <td>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: '#1e293b', maxWidth: '280px', wordBreak: 'break-word' }}>
                            {row.description}
                          </p>
                          {(row.vehicle_no || row.pass_code) && (
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                              {row.vehicle_no && <span>Vehicle: <strong>{row.vehicle_no}</strong> </span>}
                              {row.pass_code && <span>Pass: <strong>{row.pass_code}</strong></span>}
                            </div>
                          )}
                        </td>
                        <td>
                          {row.photo_url ? (
                            <div
                              onClick={() => setPreviewPhoto(row.photo_url)}
                              style={{
                                cursor: 'pointer',
                                display: 'inline-flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.2rem'
                              }}
                              title="Click to view full size photo"
                            >
                              <img
                                src={row.photo_url}
                                alt="Evidence"
                                style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                              />
                              <span style={{ fontSize: '0.68rem', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                <Eye size={12} /> View
                              </span>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>No Photo</span>
                          )}
                        </td>
                        <td>
                          {isOpen ? (
                            <span className="badge" style={{ background: '#dc2626', color: '#fff', fontSize: '0.75rem' }}>
                              OPEN
                            </span>
                          ) : (
                            <div>
                              <span className="badge" style={{ background: '#057a55', color: '#fff', fontSize: '0.75rem' }}>
                                RESOLVED
                              </span>
                              {row.resolved_by && (
                                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>
                                  By: {row.resolved_by}
                                </div>
                              )}
                              {row.resolution_notes && (
                                <div style={{ fontSize: '0.7rem', color: '#047857', maxWidth: '180px', fontStyle: 'italic' }}>
                                  "{row.resolution_notes}"
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td>
                          {isOpen ? (
                            <button
                              onClick={() => {
                                setSelectedIncident(row);
                                setResolutionNotes('');
                              }}
                              style={{
                                padding: '0.3rem 0.6rem',
                                fontSize: '0.75rem',
                                background: '#dc2626',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                fontWeight: '600'
                              }}
                            >
                              <Check size={14} /> Resolve
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#057a55', fontWeight: 'bold' }}>
                              ✓ Closed
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  }

                  if (reportType === 'EXCEPTION') {
                    return (
                      <tr key={row.id || idx}>
                        <td>{row.id}</td>
                        <td><strong>{row.action}</strong></td>
                        <td>{row.entity_type}</td>
                        <td>{row.entity_id || '-'}</td>
                        <td>{row.remarks}</td>
                        <td>{new Date(row.timestamp).toLocaleString()}</td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={row.id || idx}>
                      <td><strong>{row.pass_code || row.id}</strong></td>
                      <td>{row.visitor_name || 'N/A'}</td>
                      <td>{row.gate_name || row.visitor_category}</td>
                      <td>{row.host_name || row.vehicle_no || row.remarks || 'N/A'}</td>
                      <td>
                        <span className={`badge badge-${(row.direction || row.status || 'APPROVED').toLowerCase()}`}>
                          {row.direction || row.status}
                        </span>
                      </td>
                      <td>{new Date(row.timestamp || row.created_at).toLocaleString()}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
