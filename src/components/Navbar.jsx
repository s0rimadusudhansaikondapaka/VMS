import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, LogOut, User } from 'lucide-react';
import NotificationBell from './NotificationBell';
import OneWorldOneFamilyLogo from './OneWorldOneFamilyLogo';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  return (
    <nav className="container-fluid" style={{ background: '#4e081d', color: 'white', padding: '0.7rem 2rem', marginBottom: '1.5rem', boxShadow: '0 4px 15px rgba(78, 8, 29, 0.3)', borderBottom: '3px solid #df6f06' }}>
      <ul>
        <li>
          <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* 360° Rotating One World One Family Emblem */}
            <OneWorldOneFamilyLogo size={46} showText={false} variant="navbar" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ffffff' }}>
                <Shield size={20} color="#fcb900" /> Sathya Sai Grama
              </span>
              <span style={{ fontSize: '0.72rem', color: '#fcb900', fontStyle: 'italic', fontWeight: '500' }}>
                ONE WORLD ONE FAMILY • Under Guidance of Sadguru Sri Madhusudan Sai
              </span>
            </div>
          </Link>
        </li>
      </ul>
      {user && (
        <ul>
          <li style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <NotificationBell user={user} />
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
