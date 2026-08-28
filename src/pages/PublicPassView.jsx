import React, { useState, useEffect } from 'react';
import { getPublicPassDetails } from '../services/api';
import { Shield, CheckCircle, Download, Calendar, User, Clock, AlertTriangle } from 'lucide-react';

export default function PublicPassView({ passCode }) {
  const [passData, setPassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPass();

    const handleRealtimeSync = (e) => {
      console.log('[PublicPassView] Realtime Event Received:', e.detail);
      fetchPass();
    };

    window.addEventListener('vms_realtime_sync', handleRealtimeSync);
    return () => window.removeEventListener('vms_realtime_sync', handleRealtimeSync);
  }, [passCode]);

  const fetchPass = async () => {
    setLoading(true);
    try {
      const res = await getPublicPassDetails(passCode);
      if (res.success && res.pass) {
        setPassData(res.pass);
      } else {
        setError(res.message || 'Gate pass not found.');
      }
    } catch (err) {
      setError('Invalid or expired gate pass.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQr = () => {
    if (!passData?.qr_code_url) return;
    const link = document.createElement('a');
    link.href = passData.qr_code_url;
    link.download = `GatePass_${passData.pass_code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="container" style={{ marginTop: '5rem', textAlign: 'center' }}>
        <p style={{ color: '#64748b' }}>Loading Sathya Sai Grama Gate Pass...</p>
      </div>
    );
  }

  if (error || !passData) {
    return (
      <main className="container" style={{ maxWidth: '520px', marginTop: '3rem', marginBottom: '3rem' }}>
        <div className="card" style={{ borderTop: '6px solid #dc2626', textAlign: 'center', padding: '2rem' }}>
          <AlertTriangle size={52} color="#dc2626" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ color: '#991b1b', margin: '0 0 0.5rem 0' }}>Gate Pass Not Found</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>{error || 'The requested gate pass does not exist or has expired.'}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container" style={{ maxWidth: '480px', marginTop: '1.5rem', marginBottom: '3rem' }}>
      {/* Official Passcard Header */}
      <div className="card" style={{ borderTop: '6px solid #7c3aed', padding: '1.5rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', marginBottom: '0.8rem' }}>
          <img
            src="/madhu_sudhan_sai.jpg"
            alt="Sadguru Sri Madhusudan Sai"
            style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid #f59e0b', objectFit: 'cover' }}
          />
          <div style={{ textAlign: 'left' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b', fontWeight: '800' }}>Sathya Sai Grama</h3>
            <span style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 'bold' }}>Official Gate Entry Pass</span>
          </div>
        </div>

        <div style={{ background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '1.2rem', margin: '1rem 0' }}>
          <span style={{ background: '#def7ec', color: '#03543f', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '800', display: 'inline-block', marginBottom: '0.8rem' }}>
            ✓ {passData.status === 'APPROVED' || passData.status === 'INSIDE_CAMPUS' ? 'AUTHORIZED GATE PASS' : passData.status}
          </span>

          {passData.visitor_photo && (
            <img
              src={passData.visitor_photo}
              alt={passData.visitor_name}
              style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 0.6rem auto', display: 'block', border: '3px solid #7c3aed' }}
            />
          )}

          <h3 style={{ margin: '0.2rem 0', color: '#0f172a', fontSize: '1.25rem' }}>{passData.visitor_name}</h3>
          <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Referrer / Host: <strong>{passData.host_name || 'Ashram Resident'}</strong></span>

          <div style={{ margin: '1.2rem 0 0.8rem 0' }}>
            {passData.qr_code_url ? (
              <img
                src={passData.qr_code_url}
                alt="Authorized QR Code"
                style={{ width: '200px', height: '200px', margin: '0 auto', display: 'block', borderRadius: '8px', border: '3px solid #7c3aed', background: 'white', padding: '0.4rem' }}
              />
            ) : (
              <div style={{ width: '180px', height: '180px', background: '#e2e8f0', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>QR Code</div>
            )}
          </div>

          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>AUTHORIZED GATE PASSCODE</span>
          <h1 style={{ fontSize: '2.2rem', color: '#7c3aed', margin: '0.1rem 0 0.4rem 0', fontWeight: '800', letterSpacing: '0.05em' }}>
            {passData.pass_code}
          </h1>

          <span style={{ background: '#fef3c7', color: '#92400e', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 'bold', display: 'inline-block' }}>
            ✓ {passData.is_permanent_pass ? 'Frequent Visitor Permanent Pass' : 'Single-Use Gate Pass (Valid Only Once)'}
          </span>

          <div style={{ borderTop: '1px solid #cbd5e1', marginTop: '1rem', paddingTop: '0.8rem', fontSize: '0.78rem', color: '#475569', textAlign: 'left' }}>
            <div><strong>Arrival:</strong> {new Date(passData.valid_from).toLocaleString()}</div>
            <div><strong>Valid Until:</strong> {new Date(passData.valid_until).toLocaleString()}</div>
            <div style={{ marginTop: '0.4rem', color: '#065f46', background: '#ecfdf5', padding: '0.3rem 0.5rem', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
              <strong>Approved By:</strong> {passData.approved_by_display || passData.approved_by_name || 'Authorized Sathya Sai Grama Authority'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownloadQr}
          style={{ width: '100%', background: '#7c3aed', borderColor: '#7c3aed', color: 'white', fontWeight: 'bold', fontSize: '0.92rem', padding: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <Download size={18} /> Download QR Pass Image
        </button>
      </div>
    </main>
  );
}
