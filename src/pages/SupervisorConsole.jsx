import React, { useState, useEffect } from 'react';
import { getOverstayAlerts, supervisorOverride, getVisitorsInsideCampus, getIncidents, resolveIncident } from '../services/api';
import DashboardHeader from '../components/DashboardHeader';
import { useTablePagination, PaginationControls } from '../components/TablePagination';
import { AlertCircle, ShieldAlert, CheckCircle, XCircle, Clock, Camera, AlertTriangle, Check, Eye } from 'lucide-react';

export default function SupervisorConsole({ user }) {
  const [overstays, setOverstays] = useState([]);
  const [insideVisitors, setInsideVisitors] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [selectedReg, setSelectedReg] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [incidentStatusFilter, setIncidentStatusFilter] = useState('ALL');
  const [incidentSeverityFilter, setIncidentSeverityFilter] = useState('ALL');
  const [remarks, setRemarks] = useState('');
  const [msg, setMsg] = useState('');

  const filteredIncidents = incidents.filter((inc) => {
    if (incidentStatusFilter !== 'ALL' && inc.status !== incidentStatusFilter) return false;
    if (incidentSeverityFilter !== 'ALL' && inc.severity !== incidentSeverityFilter) return false;
    return true;
  });

  const {
    searchTerm: incSearch,
    setSearchTerm: setIncSearch,
    currentPage: incPage,
    setCurrentPage: setIncPage,
    totalPages: incTotalPages,
    totalItems: incTotalItems,
    paginatedData: paginatedIncidents,
  } = useTablePagination(filteredIncidents, ['incident_id', 'incident_type', 'description', 'gate_name', 'guard_name', 'pass_code', 'vehicle_no'], 10);

  const {
    searchTerm: overSearch,
    setSearchTerm: setOverSearch,
    currentPage: overPage,
    setCurrentPage: setOverPage,
    totalPages: overTotalPages,
    totalItems: overTotalItems,
    paginatedData: paginatedOverstays,
  } = useTablePagination(overstays, ['visitor_name', 'visitor_phone', 'pass_code', 'host_name'], 10);

  const {
    searchTerm: inSearch,
    setSearchTerm: setInSearch,
    currentPage: inPage,
    setCurrentPage: setInPage,
    totalPages: inTotalPages,
    totalItems: inTotalItems,
    paginatedData: paginatedInsideVisitors,
  } = useTablePagination(insideVisitors, ['visitor_name', 'pass_code', 'host_name', 'vehicle_no', 'visitor_category'], 10);

  useEffect(() => {
    fetchData();

    const handleRealtimeSync = () => {
      fetchData();
    };

    window.addEventListener('vms_realtime_sync', handleRealtimeSync);
    return () => window.removeEventListener('vms_realtime_sync', handleRealtimeSync);
  }, []);

  const fetchData = async () => {
    try {
      const overRes = await getOverstayAlerts();
      if (overRes.success) setOverstays(overRes.overstays);

      const inRes = await getVisitorsInsideCampus();
      if (inRes.success) setInsideVisitors(inRes.visitors);

      const incRes = await getIncidents();
      if (incRes.success) setIncidents(incRes.incidents);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOverrideAction = async (action) => {
    if (!selectedReg || !remarks.trim()) {
      alert('Please select a registration and enter mandatory supervisor remarks.');
      return;
    }

    try {
      const res = await supervisorOverride(selectedReg.id, action, remarks);
      if (res.success) {
        setMsg(`Supervisor override executed: ${action}`);
        setSelectedReg(null);
        setRemarks('');
        fetchData();
      }
    } catch (err) {
      alert('Override failed.');
    }
  };

  const handleResolveIncident = async () => {
    if (!selectedIncident || !resolutionNotes.trim()) {
      alert('Please provide supervisor resolution remarks explaining action taken.');
      return;
    }
    try {
      const res = await resolveIncident(selectedIncident.id, resolutionNotes);
      if (res.success) {
        setMsg(`Incident ${selectedIncident.incident_id || '#' + selectedIncident.id} successfully marked as RESOLVED.`);
        setSelectedIncident(null);
        setResolutionNotes('');
        fetchData();
      }
    } catch (err) {
      alert('Failed to resolve incident: ' + (err.response?.data?.message || err.message));
    }
  };

  const openIncidentsCount = incidents.filter(i => i.status === 'OPEN').length;

  return (
    <div className="container">
      <DashboardHeader
        title="Security Supervisor / SO Console"
        subtitle={`Operator: ${user.name} | Role: Operational Security Officer`}
        roleBadge="SECURITY SUPERVISOR"
      />

      {msg && <div style={{ background: '#def7ec', color: '#03543f', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem' }}>{msg}</div>}

      {/* Real-Time Gate Security Incident Alert Banner */}
      {openIncidentsCount > 0 && (
        <div style={{
          background: '#fef2f2',
          border: '2px solid #ef4444',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: '#dc2626', color: '#fff', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <h4 style={{ margin: 0, color: '#991b1b', fontSize: '1rem' }}>
                {openIncidentsCount} Active Gate Security Incident{openIncidentsCount > 1 ? 's' : ''} Pending Action
              </h4>
              <p style={{ margin: 0, color: '#b91c1c', fontSize: '0.85rem' }}>
                Gate security guards have logged incident reports requiring supervisor intervention and resolution notes.
              </p>
            </div>
          </div>
          <span className="badge" style={{ background: '#dc2626', color: '#fff', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
            ACTION REQUIRED
          </span>
        </div>
      )}

      {/* Gate Security Incidents Section */}
      <div className="card" style={{ border: openIncidentsCount > 0 ? '2px solid #dc2626' : '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: '#1e293b' }}>
            <ShieldAlert color="#dc2626" /> Gate Security Incidents & Guard Escalations
            <span className="badge" style={{ background: openIncidentsCount > 0 ? '#dc2626' : '#64748b', color: '#fff', marginLeft: '0.5rem' }}>
              {openIncidentsCount} Open
            </span>
          </h3>

          {/* Filter Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b' }}>Status:</span>
              {['ALL', 'OPEN', 'RESOLVED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setIncidentStatusFilter(st)}
                  style={{
                    fontSize: '0.72rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    background: incidentStatusFilter === st ? '#1e293b' : 'transparent',
                    color: incidentStatusFilter === st ? '#fff' : '#64748b',
                    fontWeight: incidentStatusFilter === st ? 'bold' : 'normal'
                  }}
                >
                  {st}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b' }}>Severity:</span>
              {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setIncidentSeverityFilter(sev)}
                  style={{
                    fontSize: '0.72rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    background: incidentSeverityFilter === sev ? (sev === 'HIGH' ? '#dc2626' : sev === 'MEDIUM' ? '#d97706' : '#2563eb') : 'transparent',
                    color: incidentSeverityFilter === sev ? '#fff' : '#64748b',
                    fontWeight: incidentSeverityFilter === sev ? 'bold' : 'normal'
                  }}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>
        </div>

        <PaginationControls
          searchTerm={incSearch}
          setSearchTerm={setIncSearch}
          currentPage={incPage}
          setCurrentPage={setIncPage}
          totalPages={incTotalPages}
          totalItems={incTotalItems}
          pageSize={10}
          placeholder="Filter incidents by ID, Gate, Guard, Type, Description, Pass, Vehicle..."
        />

        <div style={{ overflowX: 'auto' }}>
          <table role="grid">
            <thead>
              <tr>
                <th>Incident ID</th>
                <th>Gate & Guard</th>
                <th>Type & Severity</th>
                <th>Description / Details</th>
                <th>Evidence Photo</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedIncidents.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: '#057a55', padding: '1.5rem' }}>
                    ✓ No incident records matching filter.
                  </td>
                </tr>
              ) : (
                paginatedIncidents.map((inc) => {
                  const isHigh = inc.severity === 'HIGH';
                  const isMed = inc.severity === 'MEDIUM';
                  const sevBg = isHigh ? '#fee2e2' : isMed ? '#fef3c7' : '#dbeafe';
                  const sevColor = isHigh ? '#dc2626' : isMed ? '#d97706' : '#2563eb';
                  const isOpen = inc.status === 'OPEN';

                  return (
                    <tr key={inc.id} style={{ background: isOpen && isHigh ? '#fff5f5' : 'transparent' }}>
                      <td>
                        <strong>{inc.incident_id || `INC-${inc.id}`}</strong>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {new Date(inc.created_at).toLocaleString()}
                        </div>
                      </td>
                      <td>
                        <strong>{inc.gate_name || 'N/A'}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                          Guard: {inc.guard_name || inc.guard_id || 'On-Duty Guard'}
                        </div>
                        {inc.device_id && (
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                            Device: {inc.device_id}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.2rem' }}>
                          {inc.incident_type}
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
                          {inc.severity}
                        </span>
                      </td>
                      <td>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#1e293b', maxWidth: '280px', wordBreak: 'break-word' }}>
                          {inc.description}
                        </p>
                        {(inc.vehicle_no || inc.pass_code) && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                            {inc.vehicle_no && <span>Vehicle: <strong>{inc.vehicle_no}</strong> </span>}
                            {inc.pass_code && <span>Pass: <strong>{inc.pass_code}</strong></span>}
                          </div>
                        )}
                      </td>
                      <td>
                        {inc.photo_url ? (
                          <div
                            onClick={() => setPreviewPhoto(inc.photo_url)}
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
                              src={inc.photo_url}
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
                            {inc.resolved_by && (
                              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>
                                By: {inc.resolved_by}
                              </div>
                            )}
                            {inc.resolution_notes && (
                              <div style={{ fontSize: '0.7rem', color: '#047857', maxWidth: '180px', fontStyle: 'italic' }}>
                                "{inc.resolution_notes}"
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td>
                        {isOpen ? (
                          <button
                            onClick={() => {
                              setSelectedIncident(inc);
                              setResolutionNotes('');
                            }}
                            style={{
                              padding: '0.3rem 0.6rem',
                              fontSize: '0.75rem',
                              background: '#057a55',
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incident Resolution Modal */}
      {selectedIncident && (
        <div className="card" style={{ border: '2px solid #057a55', background: '#f0fdf4', marginBottom: '1.5rem' }}>
          <h3 style={{ color: '#065f46', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle /> Resolve Incident: {selectedIncident.incident_id || `INC-${selectedIncident.id}`}
          </h3>
          <div style={{ fontSize: '0.85rem', color: '#1f2937', marginBottom: '0.75rem' }}>
            <strong>Type:</strong> {selectedIncident.incident_type} ({selectedIncident.severity} Severity) |{' '}
            <strong>Gate:</strong> {selectedIncident.gate_name} |{' '}
            <strong>Reported by:</strong> {selectedIncident.guard_name || 'Guard'}
          </div>
          <div style={{ background: '#fff', padding: '0.6rem', borderRadius: '4px', border: '1px solid #d1fae5', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
            <strong>Incident Description:</strong> {selectedIncident.description}
          </div>

          <label style={{ fontWeight: 'bold', color: '#065f46' }}>
            Supervisor Resolution Notes & Action Taken (Mandatory):
            <textarea
              rows="3"
              placeholder="e.g. Dispatched patrol team to North Gate, trespasser escorted off-campus, vehicle cleared, and gate secured..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              required
              style={{ marginTop: '0.3rem' }}
            ></textarea>
          </label>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
            <button onClick={handleResolveIncident} style={{ background: '#057a55', color: '#fff' }}>
              <CheckCircle size={16} /> Mark Incident as RESOLVED
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

      {/* Overstay Alerts Section */}
      <div className="card" style={{ border: '1px solid #f59e0b' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b45309' }}>
          <AlertCircle /> Overstay & Delayed Exit Alerts (9:00 PM / 9:30 PM Triggers)
        </h3>

        <PaginationControls
          searchTerm={overSearch}
          setSearchTerm={setOverSearch}
          currentPage={overPage}
          setCurrentPage={setOverPage}
          totalPages={overTotalPages}
          totalItems={overTotalItems}
          pageSize={10}
          placeholder="Search overstays by Visitor Name, Phone, Passcode..."
        />

        <table role="grid">
          <thead>
            <tr>
              <th>Pass Code</th>
              <th>Visitor Name</th>
              <th>Host Name</th>
              <th>Valid Until</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedOverstays.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: '#057a55' }}>✓ No overstay alerts matching filter. All campus visitors within scheduled limits.</td>
              </tr>
            ) : (
              paginatedOverstays.map((over) => (
                <tr key={over.id}>
                  <td><strong>{over.pass_code}</strong></td>
                  <td>{over.visitor_name}<br/><span style={{ fontSize: '0.75rem' }}>{over.visitor_phone}</span></td>
                  <td>{over.host_name}</td>
                  <td><span style={{ color: '#dc2626', fontWeight: 'bold' }}>{new Date(over.valid_to).toLocaleTimeString()}</span></td>
                  <td><span className="badge badge-pending">OVERSTAY</span></td>
                  <td>
                    <button className="secondary outline" onClick={() => setSelectedReg(over)} style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                      Supervisor Intervention
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Supervisor Override Modal */}
      {selectedReg && (
        <div className="card" style={{ border: '2px solid #d97706' }}>
          <h3>Supervisor Exception & Override Action</h3>
          <p>Overriding Registration: <strong>{selectedReg.pass_code}</strong> ({selectedReg.visitor_name})</p>
          
          <label>
            Mandatory Decision Remarks (Logged to Audit Trail):
            <textarea
              rows="3"
              placeholder="Record reason for override / host escalation decision..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              required
            ></textarea>
          </label>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button onClick={() => handleOverrideAction('APPROVE')} style={{ background: '#057a55' }}>
              <CheckCircle size={16} /> Force Approve Entry
            </button>
            <button onClick={() => handleOverrideAction('REJECT')} style={{ background: '#c81e1e' }}>
              <XCircle size={16} /> Force Reject Entry
            </button>
            <button className="secondary" onClick={() => setSelectedReg(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Active Campus Visitors */}
      <div className="card">
        <h3>Current Visitors Inside Campus ({insideVisitors.length})</h3>

        <PaginationControls
          searchTerm={inSearch}
          setSearchTerm={setInSearch}
          currentPage={inPage}
          setCurrentPage={setInPage}
          totalPages={inTotalPages}
          totalItems={inTotalItems}
          pageSize={10}
          placeholder="Filter inside visitors by Name, Passcode, Vehicle, Host..."
        />

        <table role="grid">
          <thead>
            <tr>
              <th>Pass Code</th>
              <th>Visitor Name</th>
              <th>Category</th>
              <th>Vehicle No</th>
              <th>Host Name</th>
              <th>State</th>
            </tr>
          </thead>
          <tbody>
            {paginatedInsideVisitors.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: '#64748b' }}>No active visitors inside campus matching filter.</td>
              </tr>
            ) : (
              paginatedInsideVisitors.map((vis) => (
                <tr key={vis.id}>
                  <td><strong>{vis.pass_code}</strong></td>
                  <td>{vis.visitor_name}</td>
                  <td>{vis.visitor_category}</td>
                  <td>{vis.vehicle_no || 'N/A'}</td>
                  <td>{vis.host_name || 'N/A'}</td>
                  <td><span className="badge badge-inside">{vis.status}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
