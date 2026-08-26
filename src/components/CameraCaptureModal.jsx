import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

export default function CameraCaptureModal({ onPhotoCaptured, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraError, setCameraError] = useState('');

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Camera access denied or unavailable. Please check browser permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirmPhoto = () => {
    if (capturedImage) {
      onPhotoCaptured(capturedImage);
      stopCamera();
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div
        className="card"
        style={{
          width: '90%',
          maxWidth: '560px',
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b' }}>
            <Camera color="#2563eb" /> Live Camera Photo Capture
          </h3>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="secondary outline"
            style={{ padding: '0.2rem 0.5rem', margin: 0 }}
          >
            <XCircle size={18} />
          </button>
        </div>

        {cameraError ? (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '8px', margin: '1rem 0' }}>
            {cameraError}
          </div>
        ) : (
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            {!capturedImage ? (
              <div style={{ position: 'relative', background: '#000', borderRadius: '8px', overflow: 'hidden', minHeight: '320px' }}>
                <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '320px', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={takeSnapshot}
                  style={{
                    position: 'absolute',
                    bottom: '15px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#2563eb',
                    borderColor: '#2563eb',
                    color: 'white',
                    padding: '0.6rem 1.5rem',
                    fontWeight: 'bold',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
                  }}
                >
                  <Camera size={20} /> Snap Photo
                </button>
              </div>
            ) : (
              <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <img src={capturedImage} alt="Captured Visitor Snapshot" style={{ width: '100%', maxHeight: '320px', objectFit: 'contain', borderRadius: '6px' }} />
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" onClick={retakePhoto} className="secondary outline" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                    <RefreshCw size={16} /> Retake Photo
                  </button>
                  <button type="button" onClick={confirmPhoto} style={{ flex: 1, background: '#057a55', borderColor: '#057a55', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                    <CheckCircle size={16} /> Use Captured Photo
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
}
