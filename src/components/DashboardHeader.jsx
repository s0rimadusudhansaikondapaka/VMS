import React from 'react';

export default function DashboardHeader({ title, subtitle, roleBadge, actionButton, user }) {
  return (
    <div
      className="card"
      style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)',
        border: '1px solid #fef3c7',
        borderLeft: '6px solid #f59e0b',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.2rem',
        boxShadow: '0 4px 14px rgba(245, 158, 11, 0.08)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', flex: '1 1 300px' }}>
        {/* Sadguru Sri Madhusudan Sai Photo Frame */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img
            src="/madhu_sudhan_sai.jpg"
            alt="Sadguru Sri Madhusudan Sai"
            style={{
              width: '76px',
              height: '76px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid #f59e0b',
              boxShadow: '0 0 15px rgba(245, 158, 11, 0.4), 0 4px 8px rgba(0,0,0,0.1)',
              display: 'block'
            }}
          />
          <span
            style={{
              position: 'absolute',
              bottom: '-6px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#d97706',
              color: '#ffffff',
              fontSize: '0.6rem',
              fontWeight: 'bold',
              padding: '0.1rem 0.4rem',
              borderRadius: '9999px',
              whiteSpace: 'nowrap',
              letterSpacing: '0.03em',
              boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
            }}
          >
            DIVINE GRACE
          </span>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.4rem', fontWeight: '800', lineHeight: 1.2 }}>
              {title}
            </h2>
            {roleBadge && (
              <span
                style={{
                  background: '#fef3c7',
                  color: '#b45309',
                  border: '1px solid #fcd34d',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px'
                }}
              >
                {roleBadge}
              </span>
            )}
          </div>

          <p style={{ margin: '0.3rem 0 0 0', color: '#d97706', fontSize: '0.82rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            ✨ Under the Divine Guidance & Blessings of Sadguru Sri Madhusudan Sai
          </p>

          {subtitle && (
            <p style={{ margin: '0.2rem 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {actionButton && (
        <div style={{ flexShrink: 0 }}>
          {actionButton}
        </div>
      )}
    </div>
  );
}
