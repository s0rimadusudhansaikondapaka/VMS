import React, { useState, useEffect } from 'react';
import { getOverstayAlerts, supervisorOverride, getVisitorsInsideCampus } from '../services/api';
import DashboardHeader from '../components/DashboardHeader';
import { AlertCircle, ShieldAlert, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function SupervisorConsole({ user }) {
  const [overstays, setOverstays] = useState([]);
  const [insideVisitors, setInsideVisitors] = useState([]);
  const [selectedReg, setSelectedReg] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [msg, setMsg] = useState('');

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

  return (
    <div className="container">
      <DashboardHeader
        title="Security Supervisor / SO Console"
        subtitle={`Operator: ${user.name} | Role: Operational Security Officer`}
        roleBadge="SECURITY SUPERVISOR"
      />

      {msg && <div style={{ background: '#def7ec', color: '#03543f', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem' }}>{msg}</div>}

      {/* Overstay Alerts Section */}
      <div className="card" style={{ border: '1px solid #f59e0b' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b45309' }}>
          <AlertCircle /> Overstay & Delayed Exit Alerts (9:00 PM / 9:30 PM Triggers)
        </h3>
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
            {overstays.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: '#057a55' }}>✓ No overstay alerts at this time. All campus visitors within scheduled limits.</td>
              </tr>
            ) : (
              overstays.map((over) => (
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
            {insideVisitors.map((vis) => (
              <tr key={vis.id}>
                <td><strong>{vis.pass_code}</strong></td>
                <td>{vis.visitor_name}</td>
                <td>{vis.visitor_category}</td>
                <td>{vis.vehicle_no || 'N/A'}</td>
                <td>{vis.host_name || 'N/A'}</td>
                <td><span className="badge badge-inside">{vis.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
