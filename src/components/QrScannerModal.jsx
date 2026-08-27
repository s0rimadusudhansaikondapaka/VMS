import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, X } from 'lucide-react';

export default function QrScannerModal({ isOpen, onClose, onScanSuccess }) {
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Initialize HTML5 QR Code Scanner
    const scanner = new Html5QrcodeScanner(
      'qr-reader-container',
      {
        fps: 10,
        qrbox: { width: 240, height: 240 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
      },
      /* verbose= */ false
    );

    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        // Success callback on valid QR Code scan
        if (decodedText) {
          try {
            scanner.clear().catch(console.error);
          } catch (e) {
            console.error('Error clearing scanner:', e);
          }
          onScanSuccess(decodedText);
          onClose();
        }
      },
      (error) => {
        // Suppress benign frame scanning errors
      }
    );

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear().catch(() => {});
        } catch (e) {}
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }}>
      <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '1.2rem', borderRadius: '12px', textAlign: 'center', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
          <h3 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
            <Camera size={20} color="#2563eb" /> Scan Visitor QR Code
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="secondary outline"
            style={{ padding: '0.2rem 0.5rem', margin: 0 }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 1rem 0' }}>
          Point camera at the visitor's smartphone or printed QR pass card to scan gate passcode.
        </p>

        <div id="qr-reader-container" style={{ width: '100%', borderRadius: '8px', overflow: 'hidden' }}></div>

        <button
          type="button"
          onClick={onClose}
          className="secondary outline"
          style={{ width: '100%', marginTop: '1rem', padding: '0.6rem' }}
        >
          Cancel Camera Scan
        </button>
      </div>
    </div>
  );
}
