import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, X, CheckCircle, Info, AlertTriangle, ArrowRightLeft } from 'lucide-react';

export default function NotificationBell({ user }) {
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(`vms_notifications_${user?.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isOpen, setIsOpen] = useState(false);
  const wsRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!user) return;

    // Connect to WebSocket server
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}`;

    let socket;
    try {
      socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        console.log('[NotificationBell] Connected to WebSocket sync server');
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const { type, payload } = data;

          // Dispatch global custom event for all open dashboards to auto-refresh data
          window.dispatchEvent(new CustomEvent('vms_realtime_sync', { detail: data }));

          // Determine targeted notification for this specific user
          let notifTitle = '';
          let notifBody = '';
          let notifIcon = 'info';

          const isMyGuest = payload && (String(payload.host_id) === String(user.id) || String(payload.host_id) === String(user.guid));
          const isSecurityRole = ['SECURITY_HEAD', 'SUPERVISOR', 'ADMIN', 'GUARD', 'HOD'].includes(user.role);

          if (type === 'GATE_MOVEMENT') {
            if (isMyGuest) {
              notifTitle = `Gate Movement (${payload.direction})`;
              notifBody = `Your invited guest ${payload.visitor_name} (${payload.pass_code}) checked ${payload.direction} at ${payload.gate_name.replace('_', ' ')}. Status: ${payload.status}`;
              notifIcon = payload.direction === 'IN' ? 'success' : 'info';
            } else if (isSecurityRole) {
              notifTitle = `Gate Movement (${payload.direction})`;
              notifBody = `Visitor ${payload.visitor_name} (${payload.pass_code}) checked ${payload.direction} at ${payload.gate_name.replace('_', ' ')}.`;
              notifIcon = 'movement';
            }
          } else if (type === 'PUBLIC_VISITOR_SUBMITTED') {
            if (isMyGuest || isSecurityRole) {
              notifTitle = 'New Guest Registration';
              notifBody = `Guest ${payload.visitor_name} submitted a pre-approval registration form for your review!`;
              notifIcon = 'alert';
            }
          } else if (type === 'REGISTRATION_UPDATED') {
            if (isMyGuest) {
              notifTitle = 'Approval Status Changed';
              notifBody = `Your guest ${payload.visitor_name} (${payload.pass_code}) status was updated to '${payload.status}'.`;
              notifIcon = 'info';
            }
          }

          if (notifTitle) {
            const newNotif = {
              id: Date.now() + Math.random(),
              title: notifTitle,
              body: notifBody,
              icon: notifIcon,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              read: false,
            };

            setNotifications((prev) => {
              const updated = [newNotif, ...prev].slice(0, 30);
              try {
                localStorage.setItem(`vms_notifications_${user.id}`, JSON.stringify(updated));
              } catch (e) {}
              return updated;
            });
          }
        } catch (err) {
          console.error('Error handling WS sync message:', err);
        }
      };

      socket.onerror = (e) => {
        console.log('[NotificationBell] WS error:', e);
      };

      socket.onclose = () => {
        console.log('[NotificationBell] WS connection closed');
      };
    } catch (err) {
      console.error('Failed to connect to WS server:', err);
    }

    return () => {
      if (socket) socket.close();
    };
  }, [user]);

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    try {
      localStorage.setItem(`vms_notifications_${user.id}`, JSON.stringify(updated));
    } catch (e) {}
  };

  const clearAll = () => {
    setNotifications([]);
    try {
      localStorage.removeItem(`vms_notifications_${user.id}`);
    } catch (e) {}
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: 'white',
          padding: '0.45rem',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyInContent: 'center',
          margin: 0,
        }}
        title="Targeted Live Notifications"
      >
        <Bell size={18} color={unreadCount > 0 ? '#f59e0b' : '#cbd5e1'} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#ef4444',
              color: 'white',
              fontSize: '0.65rem',
              fontWeight: 'bold',
              borderRadius: '9999px',
              padding: '0.1rem 0.35rem',
              lineHeight: 1,
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '42px',
            width: '320px',
            background: '#ffffff',
            color: '#1e293b',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            zIndex: 99999,
            border: '1px solid #cbd5e1',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              background: '#1e293b',
              color: 'white',
              padding: '0.65rem 0.9rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h4 style={{ margin: 0, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'white' }}>
              <Bell size={16} color="#f59e0b" /> Targeted Notifications
            </h4>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '0.72rem', cursor: 'pointer', padding: 0, margin: 0 }}
                  title="Mark all as read"
                >
                  Mark Read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  style={{ background: 'transparent', border: 'none', color: '#f87171', fontSize: '0.72rem', cursor: 'pointer', padding: 0, margin: 0 }}
                  title="Clear notifications"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.82rem' }}>
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderBottom: '1px solid #f1f5f9',
                    background: n.read ? '#ffffff' : '#f0f9ff',
                    fontSize: '0.8rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#0f172a', marginBottom: '0.2rem' }}>
                    <span>{n.title}</span>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'normal' }}>{n.time}</span>
                  </div>
                  <p style={{ margin: 0, color: '#475569', fontSize: '0.78rem', lineHeight: 1.35 }}>{n.body}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
