import React, { useState, useEffect } from 'react';
import { getDashboardMetrics, getReportData, getSystemSettings, toggleL2Approval } from '../services/api';
import DashboardHeader from '../components/DashboardHeader';
import { useTablePagination, PaginationControls } from '../components/TablePagination';
import { ShieldCheck, ToggleLeft, ToggleRight, FileText, Users, AlertTriangle, Crown } from 'lucide-react';

export default function SecurityHeadDashboard({ user }) {
  const [metrics, setMetrics] = useState({
    visitors_inside: 0,
    total_today: 0,
    pending_approvals: 0,
    overstays: 0,
    vvip_visits_today: 0,
  });

  const [l2Enabled, setL2Enabled] = useState(true);
  const [reportType, setReportType] = useState('DAILY_ENTRY_EXIT');
  const [reportData, setReportData] = useState([]);
  const [loadingReport, setLoadingReport] = useState(false);
  const [msg, setMsg] = useState('');

  const {
    searchTerm: reportSearch,
    setSearchTerm: setReportSearch,
    currentPage: reportPage,
    setCurrentPage: setReportPage,
    totalPages: reportTotalPages,
    totalItems: reportTotalItems,
    paginatedData: paginatedReportData,
  } = useTablePagination(reportData, ['visitor_name', 'phone', 'pass_code', 'host_name', 'action', 'remarks', 'visitor_category'], 10);

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
      <div className="grid-cols-4">
        <div className="card" style={{ borderTop: '4px solid #3b82f6' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Visitors Inside Campus</span>
          <div className="metric-value">{metrics.visitors_inside}</div>
        </div>
        <div className="card" style={{ borderTop: '4px solid #10b981' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Total Registrations Today</span>
          <div className="metric-value">{metrics.total_today}</div>
        </div>
        <div className="card" style={{ borderTop: '4px solid #f59e0b' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Pending Approvals</span>
          <div className="metric-value">{metrics.pending_approvals}</div>
        </div>
        <div className="card" style={{ borderTop: '4px solid #ef4444' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Overstay Alerts</span>
          <div className="metric-value">{metrics.overstays}</div>
        </div>
      </div>

      {/* 13 Built-in Reports & Analytics Suite */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h3>Executive Reports & Audit Logs</h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
          placeholder="Search report by Visitor Name, Passcode, Phone, Host, Action..."
        />

        <table role="grid" style={{ marginTop: '1rem' }}>
          <thead>
            <tr>
              {reportType === 'EXCEPTION' ? (
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
                <td colSpan="6" style={{ textAlign: 'center' }}>Loading report data...</td>
              </tr>
            ) : paginatedReportData.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: '#64748b' }}>No data records found matching filter.</td>
              </tr>
            ) : (
              paginatedReportData.map((row, idx) => (
                <tr key={row.id || idx}>
                  {reportType === 'EXCEPTION' ? (
                    <>
                      <td>{row.id}</td>
                      <td><strong>{row.action}</strong></td>
                      <td>{row.entity_type}</td>
                      <td>{row.entity_id || '-'}</td>
                      <td>{row.remarks}</td>
                      <td>{new Date(row.timestamp).toLocaleString()}</td>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
