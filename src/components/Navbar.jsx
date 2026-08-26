import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, LogOut, User } from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  return (
    <nav className="container-fluid" style={{ background: '#1e293b', color: 'white', padding: '0.8rem 2rem', marginBottom: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.15)' }}>
      <ul>
        <li>
          <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <div style={{ position: 'relative' }}>
              <img 
                src="/madhu_sudhan_sai.jpg" 
                alt="Sadguru Sri Madhusudan Sai" 
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  border: '2px solid #f59e0b',
                  objectFit: 'cover',
                  boxShadow: '0 0 10px rgba(245, 158, 11, 0.5)',
                  display: 'block'
                }} 
                title="Sadguru Sri Madhusudan Sai"
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ffffff' }}>
                <Shield size={20} color="#f59e0b" /> Sathya Sai Grama VMS
              </span>
              <span style={{ fontSize: '0.72rem', color: '#fbbf24', fontStyle: 'italic', fontWeight: '500' }}>
                Under the Divine Guidance of Sadguru Sri Madhusudan Sai
              </span>
            </div>
          </Link>
        </li>
      </ul>
      {user && (
        <ul>
          <li>
            <span style={{ fontSize: '0.9rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.08)', padding: '0.3rem 0.8rem', borderRadius: '20px' }}>
              <User size={16} color="#38bdf8" /> <strong>{user.name}</strong> <span style={{ opacity: 0.7 }}>({user.role})</span>
            </span>
          </li>
          <li>
            <button
              onClick={() => {
                onLogout();
                navigate('/login');
              }}
              className="secondary outline"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.9rem', cursor: 'pointer', borderColor: '#64748b', color: '#e2e8f0' }}
            >
              <LogOut size={14} /> Logout
            </button>
          </li>
        </ul>
      )}
    </nav>
  );
}
