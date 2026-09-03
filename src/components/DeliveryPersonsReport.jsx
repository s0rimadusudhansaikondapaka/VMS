import React, { useState, useEffect } from 'react';
import { 
  getDeliveryPersons, 
  createDeliveryPerson, 
  updateDeliveryPerson, 
  approveOrRejectDeliveryPerson, 
  markDeliveryIn, 
  markDeliveryOut 
} from '../services/api';
import { Truck, LogIn, LogOut, CheckCircle, XCircle, Edit, Plus, AlertTriangle, Clock, RefreshCw, User, Shield, Info } from 'lucide-react';

export default function DeliveryPersonsReport({ user }) {
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInModal, setShowInModal] = useState(false);
  const [showMissedInModal, setShowMissedInModal] = useState(false);

  // Active Item for Operations
  const [selectedPerson, setSelectedPerson] = useState(null);

  // Form Data States
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    company_name: 'Amazon',
    id_type: 'Aadhaar',
    id_number: '',
    photo_url: '',
    vehicle_type: 'Two Wheeler',
    vehicle_number: '',
  });

  // Delivery Visit IN Editable Vehicle Form Data
  const [inVehicleData, setInVehicleData] = useState({
    vehicle_type: 'Two Wheeler',
    vehicle_number: '',
    gate_name: 'NORTH_GATE',
  });

  const userRole = (user?.role || 'GUARD').toUpperCase();
  const isSupervisorOrAbove = ['SUPERVISOR', 'SECURITY_HEAD', 'ADMIN'].includes(userRole);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getDeliveryPersons();
      if (res.success) {
        setDeliveryPersons(res.delivery_persons || []);
      }
    } catch (err) {
      setError('Failed to load delivery persons report.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      full_name: '',
      phone: '',
      company_name: 'Amazon',
      id_type: 'Aadhaar',
      id_number: '',
      photo_url: '',
      vehicle_type: 'Two Wheeler',
      vehicle_number: '',
    });
    setError(''); setSuccessMsg('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (person) => {
    setSelectedPerson(person);
    setFormData({
      full_name: person.full_name,
      phone: person.phone,
      company_name: person.company_name,
      id_type: person.id_type || 'Aadhaar',
      id_number: person.id_number || '',
      photo_url: person.photo_url || '',
      vehicle_type: person.vehicle_type || 'Two Wheeler',
      vehicle_number: person.vehicle_number || '',
    });
    setError(''); setSuccessMsg('');
    setShowEditModal(true);
  };

  const handleSavePerson = async (e) => {
    e.preventDefault();
    setError(''); setSuccessMsg('');
    try {
      if (showEditModal && selectedPerson) {
        const res = await updateDeliveryPerson(selectedPerson.id, formData);
        if (res.success) {
          setSuccessMsg('Delivery person details updated successfully.');
          setShowEditModal(false);
          fetchData();
        }
      } else {
        const res = await createDeliveryPerson(formData);
        if (res.success) {
          setSuccessMsg(res.message);
          setShowAddModal(false);
          fetchData();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save delivery person record.');
    }
  };

  const handleApproval = async (id, action) => {
    setError(''); setSuccessMsg('');
    try {
      const res = await approveOrRejectDeliveryPerson(id, action);
      if (res.success) {
        setSuccessMsg(res.message);
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update approval status.');
    }
  };

  // Open "Delivery Visit" Stateless Form for Mark IN
  const handleOpenInModal = (person) => {
    setSelectedPerson(person);
    setInVehicleData({
      vehicle_type: person.vehicle_type || 'Two Wheeler',
      vehicle_number: person.vehicle_number || '',
      gate_name: 'NORTH_GATE',
    });
    setError(''); setSuccessMsg('');
    setShowInModal(true);
  };

  const handleSubmitIn = async (e) => {
    e.preventDefault();
    if (!selectedPerson) return;
    setError(''); setSuccessMsg('');
    try {
      const res = await markDeliveryIn(selectedPerson.id, inVehicleData);
      if (res.success) {
        setSuccessMsg(res.message);
        setShowInModal(false);
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark delivery IN.');
    }
  };

  // Handle Mark OUT with Missed Entry Auto-IN Handling
  const handleMarkOut = async (person, autoIn = false) => {
    setError(''); setSuccessMsg('');
    try {
      const res = await markDeliveryOut(person.id, { auto_in: autoIn, gate_name: 'NORTH_GATE' });
      if (res.success) {
        setSuccessMsg(res.message);
        setShowMissedInModal(false);
        fetchData();
      }
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.missed_entry) {
        setSelectedPerson(person);
        setShowMissedInModal(true);
      } else {
        setError(err.response?.data?.message || 'Failed to mark delivery OUT.');
      }
    }
  };

  const overstayCount = deliveryPersons.filter(p => p.is_overstay).length;
  const inCampusCount = deliveryPersons.filter(p => p.current_visit_status === 'IN').length;
  const pendingApprovalCount = deliveryPersons.filter(p => p.status === 'PENDING').length;

  return (
    <div style={{ marginTop: '1rem' }}>
      {/* Header Banner */}
      <div 
        className="card" 
        style={{ 
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', 
          color: 'white', 
          padding: '1.25rem 1.5rem', 
          borderRadius: '12px',
          marginBottom: '1.2rem',
          boxShadow: '0 4px 14px rgba(49, 46, 129, 0.25)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '0.6rem', borderRadius: '50%' }}>
              <Truck size={28} color="#a5b4fc" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.35rem', color: '#ffffff', fontWeight: '800' }}>
                Delivery Persons Report & Tracking
              </h2>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#c7d2fe' }}>
                Track delivery entries, vehicle details, supervisor approvals & 2-hour overstay alerts
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button 
              type="button" 
              onClick={fetchData} 
              className="secondary outline"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', color: '#e0e7ff', borderColor: '#6366f1' }}
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <button 
              type="button" 
              onClick={handleOpenAdd}
              style={{ background: '#4f46e5', borderColor: '#4f46e5', fontWeight: 'bold', fontSize: '0.85rem', padding: '0.45rem 0.9rem' }}
            >
              <Plus size={16} /> Register Delivery Person
            </button>
          </div>
        </div>

        {/* Summary Badges Bar */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem' }}>
            🚚 Registered Delivery: <strong>{deliveryPersons.length}</strong>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem' }}>
            🟢 Currently Inside Campus: <strong>{inCampusCount}</strong>
          </div>
          {pendingApprovalCount > 0 && (
            <div style={{ background: '#f59e0b', color: '#78350f', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold' }}>
              ⏳ Pending Approval: {pendingApprovalCount}
            </div>
          )}
          {overstayCount > 0 && (
            <div style={{ background: '#ef4444', color: '#ffffff', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', animation: 'pulse 2s infinite' }}>
              ⚠️ OVERSTAY (&gt;2 Hours): {overstayCount} Delivery Persons!
            </div>
          )}
        </div>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.7rem 1rem', borderRadius: '8px', marginBottom: '1rem', borderLeft: '4px solid #dc2626', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}
      {successMsg && (
        <div style={{ background: '#def7ec', color: '#03543f', padding: '0.7rem 1rem', borderRadius: '8px', marginBottom: '1rem', borderLeft: '4px solid #057a55', fontSize: '0.85rem' }}>
          {successMsg}
        </div>
      )}

      {/* Delivery Persons Report Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading delivery report records...</p>
        ) : deliveryPersons.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            <Truck size={40} color="#cbd5e1" style={{ marginBottom: '0.5rem' }} />
            <p style={{ margin: 0, fontSize: '0.95rem' }}>No delivery person records registered yet.</p>
            <button type="button" onClick={handleOpenAdd} style={{ marginTop: '0.8rem', fontSize: '0.85rem' }}>
              Register First Delivery Person
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Delivery Person & Company</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Contact & ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Vehicle Details</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Approval Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Campus Visit Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Gate Actions</th>
                </tr>
              </thead>
              <tbody>
                {deliveryPersons.map(dp => {
                  const isApproved = dp.status === 'APPROVED';
                  const isPending = dp.status === 'PENDING';
                  const isIn = dp.current_visit_status === 'IN';

                  return (
                    <tr 
                      key={dp.id} 
                      style={{ 
                        borderBottom: '1px solid #f1f5f9',
                        background: dp.is_overstay ? '#fef2f2' : isIn ? '#f0fdf4' : 'transparent' 
                      }}
                    >
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{ 
                            width: '38px', height: '38px', borderRadius: '50%', background: '#e0e7ff', color: '#4338ca', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem' 
                          }}>
                            {dp.full_name?.charAt(0) || 'D'}
                          </div>
                          <div>
                            <strong style={{ color: '#1e293b', fontSize: '0.9rem' }}>{dp.full_name}</strong>
                            <div style={{ fontSize: '0.76rem', color: '#4f46e5', fontWeight: '600' }}>
                              🏢 {dp.company_name}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div>📞 <strong>{dp.phone}</strong></div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {dp.id_type}: {dp.id_number || 'N/A'}
                        </div>
                      </td>

                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span className="badge" style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }}>
                          🚗 {dp.vehicle_type}
                        </span>
                        <div style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#0f172a', marginTop: '2px' }}>
                          {dp.vehicle_number || 'No Plate Registered'}
                        </div>
                      </td>

                      <td style={{ padding: '0.75rem 1rem' }}>
                        {isApproved ? (
                          <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                            <CheckCircle size={12} /> Approved
                          </span>
                        ) : isPending ? (
                          <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                            <Clock size={12} /> Pending Supervisor
                          </span>
                        ) : (
                          <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                            <XCircle size={12} /> Rejected
                          </span>
                        )}
                        {dp.approved_by_name && (
                          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                            by {dp.approved_by_name}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '0.75rem 1rem' }}>
                        {dp.is_overstay ? (
                          <span style={{ background: '#ef4444', color: '#ffffff', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <AlertTriangle size={13} /> OVERSTAY ({dp.stay_duration_minutes} mins)
                          </span>
                        ) : isIn ? (
                          <div>
                            <span style={{ background: '#22c55e', color: '#ffffff', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                              🟢 INSIDE CAMPUS
                            </span>
                            <div style={{ fontSize: '0.72rem', color: '#15803d', marginTop: '2px' }}>
                              In for {dp.stay_duration_minutes} mins
                            </div>
                          </div>
                        ) : (
                          <span style={{ background: '#f1f5f9', color: '#64748b', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem' }}>
                            ⚪ OUTSIDE
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {/* IN / OUT Action Buttons for Security Guard */}
                          <button
                            type="button"
                            disabled={!isApproved || isIn}
                            onClick={() => handleOpenInModal(dp)}
                            style={{
                              fontSize: '0.78rem',
                              padding: '0.3rem 0.65rem',
                              background: isApproved && !isIn ? '#16a34a' : '#cbd5e1',
                              borderColor: isApproved && !isIn ? '#16a34a' : '#cbd5e1',
                              color: 'white',
                              cursor: isApproved && !isIn ? 'pointer' : 'not-allowed'
                            }}
                            title={!isApproved ? 'Approval required before IN' : isIn ? 'Already Checked IN' : 'Mark IN'}
                          >
                            <LogIn size={13} /> IN
                          </button>

                          <button
                            type="button"
                            disabled={!isApproved}
                            onClick={() => handleMarkOut(dp)}
                            style={{
                              fontSize: '0.78rem',
                              padding: '0.3rem 0.65rem',
                              background: isApproved && isIn ? '#dc2626' : '#ea580c',
                              borderColor: isApproved && isIn ? '#dc2626' : '#ea580c',
                              color: 'white',
                              cursor: isApproved ? 'pointer' : 'not-allowed'
                            }}
                            title="Mark OUT"
                          >
                            <LogOut size={13} /> OUT
                          </button>

                          {/* Supervisor Action Buttons (Approve / Reject / Edit) */}
                          {isSupervisorOrAbove && (
                            <>
                              {isPending && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleApproval(dp.id, 'APPROVE')}
                                    style={{ fontSize: '0.75rem', padding: '0.28rem 0.5rem', background: '#057a55', borderColor: '#057a55', color: 'white' }}
                                    title="Supervisor Approve"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleApproval(dp.id, 'REJECT')}
                                    style={{ fontSize: '0.75rem', padding: '0.28rem 0.5rem', background: '#b91c1c', borderColor: '#b91c1c', color: 'white' }}
                                    title="Supervisor Reject"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                              {/* Security Supervisor Can Edit Delivery Details Anytime */}
                              <button
                                type="button"
                                className="secondary outline"
                                onClick={() => handleOpenEdit(dp)}
                                style={{ fontSize: '0.75rem', padding: '0.28rem 0.5rem', color: '#475569' }}
                                title="Supervisor Edit Details"
                              >
                                <Edit size={13} /> Edit
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Delivery Person Modal */}
      {(showAddModal || showEditModal) && (
        <dialog open style={{ border: 'none', background: 'transparent' }}>
          <article className="card" style={{ maxWidth: '600px', width: '90vw', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b', fontWeight: '800' }}>
                {showEditModal ? 'Edit Delivery Person Details' : 'Register New Delivery Person'}
              </h3>
              <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="secondary outline" style={{ padding: '0.2rem 0.5rem' }}>
                ✕
              </button>
            </div>

            <div style={{ background: '#f0fdf4', padding: '0.6rem 0.8rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.8rem', color: '#166534' }}>
              ℹ️ {isSupervisorOrAbove ? 'Supervisor Registration: Status will be APPROVED automatically.' : 'Guard Registration: Status will be PENDING for Supervisor approval.'}
            </div>

            <form onSubmit={handleSavePerson}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <label style={{ fontWeight: '600', fontSize: '0.82rem' }}>
                  Full Name *
                  <input 
                    type="text" 
                    required 
                    value={formData.full_name} 
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} 
                    placeholder="Delivery Agent Name" 
                    style={{ padding: '0.45rem' }} 
                  />
                </label>

                <label style={{ fontWeight: '600', fontSize: '0.82rem' }}>
                  Mobile / Phone Number *
                  <input 
                    type="tel" 
                    required 
                    value={formData.phone} 
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                    placeholder="+91 9876543210" 
                    style={{ padding: '0.45rem' }} 
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginTop: '0.4rem' }}>
                <label style={{ fontWeight: '600', fontSize: '0.82rem' }}>
                  Delivery Company / Agency
                  <select 
                    value={formData.company_name} 
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    style={{ padding: '0.45rem' }}
                  >
                    <option value="Amazon">Amazon</option>
                    <option value="Flipkart">Flipkart</option>
                    <option value="Swiggy / Zomato">Swiggy / Zomato</option>
                    <option value="Dunzo / Zepto">Dunzo / Zepto</option>
                    <option value="FedEx / Courier">FedEx / BlueDart Courier</option>
                    <option value="Gas / Milk Supplier">Gas / Milk / Grocery</option>
                    <option value="Other Delivery Service">Other Delivery</option>
                  </select>
                </label>

                <label style={{ fontWeight: '600', fontSize: '0.82rem' }}>
                  ID Proof Type
                  <select 
                    value={formData.id_type} 
                    onChange={(e) => setFormData({ ...formData, id_type: e.target.value })}
                    style={{ padding: '0.45rem' }}
                  >
                    <option value="Aadhaar">Aadhaar Card</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Voter ID">Voter ID</option>
                    <option value="Company Badge">Company ID Badge</option>
                  </select>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginTop: '0.4rem' }}>
                <label style={{ fontWeight: '600', fontSize: '0.82rem' }}>
                  Vehicle Type
                  <select 
                    value={formData.vehicle_type} 
                    onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                    style={{ padding: '0.45rem' }}
                  >
                    <option value="Two Wheeler">Two Wheeler (Bike / Scooter)</option>
                    <option value="Auto / 3 Wheeler">Auto / 3 Wheeler</option>
                    <option value="Van / Tempo">Van / Tempo</option>
                    <option value="Truck / Lorry">Truck / Lorry</option>
                    <option value="On Foot / Bicycle">On Foot / Bicycle</option>
                  </select>
                </label>

                <label style={{ fontWeight: '600', fontSize: '0.82rem' }}>
                  Vehicle Plate Number
                  <input 
                    type="text" 
                    value={formData.vehicle_number} 
                    onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })} 
                    placeholder="e.g. KA-05-EX-9999" 
                    style={{ padding: '0.45rem' }} 
                  />
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '1.2rem' }}>
                <button 
                  type="button" 
                  className="secondary outline" 
                  onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                >
                  Cancel
                </button>
                <button type="submit" style={{ background: '#4f46e5', borderColor: '#4f46e5', fontWeight: 'bold' }}>
                  {showEditModal ? 'Save Details' : 'Submit Registration'}
                </button>
              </div>
            </form>
          </article>
        </dialog>
      )}

      {/* Stateless Modal: "Delivery Visit" for Mark IN (Editable Vehicle Details Only) */}
      {showInModal && selectedPerson && (
        <dialog open style={{ border: 'none', background: 'transparent' }}>
          <article className="card" style={{ maxWidth: '520px', width: '90vw', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#16a34a', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <LogIn size={20} /> Delivery Visit (Mark IN)
              </h3>
              <button type="button" onClick={() => setShowInModal(false)} className="secondary outline" style={{ padding: '0.2rem 0.5rem' }}>
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 0, marginBottom: '0.8rem' }}>
              Delivery Person details are auto-populated and disabled (read-only). Vehicle details remain enabled for editing.
            </p>

            <form onSubmit={handleSubmitIn}>
              {/* Disabled Auto-populated Delivery Person Details */}
              <div style={{ background: '#f8fafc', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Delivery Person Name</span>
                    <strong style={{ fontSize: '0.88rem', color: '#1e293b' }}>{selectedPerson.full_name}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Company / Agency</span>
                    <strong style={{ fontSize: '0.88rem', color: '#4f46e5' }}>{selectedPerson.company_name}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Mobile Phone</span>
                    <span style={{ fontSize: '0.82rem', color: '#334155' }}>{selectedPerson.phone}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>ID Proof</span>
                    <span style={{ fontSize: '0.82rem', color: '#334155' }}>{selectedPerson.id_type}: {selectedPerson.id_number || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Enabled Editable Vehicle Details */}
              <div style={{ background: '#f0fdf4', padding: '0.8rem', borderRadius: '8px', border: '1px solid #bbf7d0', marginBottom: '1rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.82rem', color: '#15803d', fontWeight: 'bold' }}>
                  ✏️ Verify / Edit Vehicle Details for this Entry:
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                  <label style={{ fontWeight: '600', fontSize: '0.8rem' }}>
                    Vehicle Type
                    <select 
                      value={inVehicleData.vehicle_type} 
                      onChange={(e) => setInVehicleData({ ...inVehicleData, vehicle_type: e.target.value })}
                      style={{ padding: '0.45rem', marginTop: '0.2rem' }}
                    >
                      <option value="Two Wheeler">Two Wheeler (Bike / Scooter)</option>
                      <option value="Auto / 3 Wheeler">Auto / 3 Wheeler</option>
                      <option value="Van / Tempo">Van / Tempo</option>
                      <option value="Truck / Lorry">Truck / Lorry</option>
                      <option value="On Foot / Bicycle">On Foot / Bicycle</option>
                    </select>
                  </label>

                  <label style={{ fontWeight: '600', fontSize: '0.8rem' }}>
                    Vehicle Plate Number *
                    <input 
                      type="text" 
                      required 
                      value={inVehicleData.vehicle_number} 
                      onChange={(e) => setInVehicleData({ ...inVehicleData, vehicle_number: e.target.value })} 
                      placeholder="e.g. KA-05-EX-9999" 
                      style={{ padding: '0.45rem', marginTop: '0.2rem' }} 
                    />
                  </label>
                </div>

                <label style={{ fontWeight: '600', fontSize: '0.8rem', marginTop: '0.6rem', display: 'block' }}>
                  Security Gate
                  <select 
                    value={inVehicleData.gate_name} 
                    onChange={(e) => setInVehicleData({ ...inVehicleData, gate_name: e.target.value })}
                    style={{ padding: '0.45rem', marginTop: '0.2rem' }}
                  >
                    <option value="NORTH_GATE">North Gate (Main Entrance)</option>
                    <option value="SOUTH_GATE">South Gate (Service Entry)</option>
                    <option value="EAST_GATE">East Gate</option>
                    <option value="STAFF_GATE">Staff & Delivery Gate</option>
                  </select>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
                <button type="button" className="secondary outline" onClick={() => setShowInModal(false)}>
                  Cancel
                </button>
                <button type="submit" style={{ background: '#16a34a', borderColor: '#16a34a', fontWeight: 'bold' }}>
                  Confirm IN (Mark IN)
                </button>
              </div>
            </form>
          </article>
        </dialog>
      )}

      {/* Missed Entry Auto-IN Confirmation Modal */}
      {showMissedInModal && selectedPerson && (
        <dialog open style={{ border: 'none', background: 'transparent' }}>
          <article className="card" style={{ maxWidth: '480px', width: '90vw', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', borderTop: '6px solid #d97706' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
              <AlertTriangle size={24} color="#d97706" />
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#92400e', fontWeight: '800' }}>
                Human Error: Missed IN Record Detected
              </h3>
            </div>

            <div style={{ background: '#fffbeb', padding: '0.8rem', borderRadius: '8px', color: '#b45309', fontSize: '0.85rem', marginBottom: '1.2rem', lineHeight: '1.4' }}>
              There is <strong>no record of IN</strong> for <strong>{selectedPerson.full_name} ({selectedPerson.company_name})</strong>.
              <br /><br />
              Would you like to mark <strong>Auto-IN (with MISSED Entry remark)</strong> along with OUT?
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
              <button type="button" className="secondary outline" onClick={() => setShowMissedInModal(false)}>
                Cancel
              </button>
              <button 
                type="button" 
                onClick={() => handleMarkOut(selectedPerson, true)}
                style={{ background: '#d97706', borderColor: '#d97706', color: 'white', fontWeight: 'bold' }}
              >
                Auto-IN along with OUT
              </button>
            </div>
          </article>
        </dialog>
      )}
    </div>
  );
}
