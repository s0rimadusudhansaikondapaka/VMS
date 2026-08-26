import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { bulkUploadUsers, bulkUploadVisitors } from '../services/api';
import { FileSpreadsheet, UploadCloud, Download, CheckCircle, AlertTriangle, X, Users, UserCheck } from 'lucide-react';

export default function BulkUploadModal({ isOpen, onClose, onSuccess }) {
  const [activeTab, setActiveTab] = useState('USERS'); // 'USERS' or 'VISITORS'
  const [parsedData, setParsedData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultMsg, setResultMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleReset = () => {
    setParsedData([]);
    setFileName('');
    setResultMsg(null);
    setErrorMsg('');
  };

  // Download Sample Excel Template
  const downloadSampleTemplate = (type) => {
    let headers = [];
    let sampleRows = [];
    let filename = '';

    if (type === 'USERS') {
      filename = 'VMS_Bulk_Users_Template.xlsx';
      headers = ['Name', 'Email', 'Phone', 'Role', 'Residency', 'Department', 'Password'];
      sampleRows = [
        ['Ramesh Sharma', 'ramesh@ashram.org', '+91 9876543210', 'RESIDENT', 'RESIDENT', 'Administration Office', 'password123'],
        ['Priya Guard', 'priya.guard@ashram.org', '+91 9876543211', 'GUARD', 'NON_RESIDENT', 'Security Department', 'password123'],
        ['Dr. Suresh (HOD)', 'suresh.hod@ashram.org', '+91 9876543212', 'HOD', 'RESIDENT', 'IT & Systems', 'password123'],
      ];
    } else {
      filename = 'VMS_Bulk_Visitors_Template.xlsx';
      headers = ['Visitor Name', 'Phone', 'Email', 'Gender', 'Category', 'Visit Type', 'Purpose', 'Vehicle No', 'Person Count'];
      sampleRows = [
        ['Kavitha Rao', '+91 9988776655', 'kavitha@gmail.com', 'Female', 'VIP', 'HOME', 'Spiritual Retreat Visit', 'KA-01-AB-1234', 2],
        ['Suresh Delivery (Amazon)', '+91 9988776644', 'delivery@courier.com', 'Male', 'DELIVERY', 'OFFICE', 'Admin Package Delivery', 'KA-05-EX-9999', 1],
      ];
    }

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, filename);
  };

  // Parse Excel / CSV File
  const handleFileUpload = (e) => {
    setErrorMsg('');
    setResultMsg(null);
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (json.length === 0) {
          setErrorMsg('Uploaded file is empty.');
          setParsedData([]);
          return;
        }

        setParsedData(json);
      } catch (err) {
        console.error('File parsing error:', err);
        setErrorMsg('Failed to parse file. Please upload a valid .xlsx or .csv spreadsheet.');
      }
    };

    reader.readAsBinaryString(file);
  };

  // Submit Bulk Upload
  const handleSubmitUpload = async () => {
    if (parsedData.length === 0) return;
    setLoading(true);
    setErrorMsg('');
    setResultMsg(null);

    try {
      if (activeTab === 'USERS') {
        const res = await bulkUploadUsers(parsedData);
        if (res.success) {
          setResultMsg(res);
          if (onSuccess) onSuccess();
        }
      } else {
        const res = await bulkUploadVisitors(parsedData);
        if (res.success) {
          setResultMsg(res);
          if (onSuccess) onSuccess();
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Bulk upload failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileSpreadsheet color="#2563eb" size={24} />
            <div>
              <h3 style={{ margin: 0, color: '#1e40af', fontSize: '1.2rem' }}>Bulk Excel / CSV Sheet Upload</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Import multiple Users or Visitor Registrations instantly via Excel spreadsheets</p>
            </div>
          </div>
          <button onClick={onClose} style={closeBtnStyle}><X size={20} /></button>
        </div>

        {/* Tabs: USERS vs VISITORS */}
        <div style={tabContainerStyle}>
          <button
            onClick={() => { setActiveTab('USERS'); handleReset(); }}
            style={tabButtonStyle(activeTab === 'USERS')}
          >
            <Users size={16} /> Bulk Upload Users (Staff/Residents)
          </button>
          <button
            onClick={() => { setActiveTab('VISITORS'); handleReset(); }}
            style={tabButtonStyle(activeTab === 'VISITORS')}
          >
            <UserCheck size={16} /> Bulk Upload Visitors & Passes
          </button>
        </div>

        {/* Template Download Notification Bar */}
        <div style={templateBannerStyle}>
          <div>
            <strong style={{ fontSize: '0.85rem' }}>Need the format template?</strong>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#475569' }}>
              Download our sample Excel template pre-formatted with all required columns.
            </p>
          </div>
          <button onClick={() => downloadSampleTemplate(activeTab)} style={downloadBtnStyle}>
            <Download size={14} /> Sample {activeTab === 'USERS' ? 'Users' : 'Visitors'} Template (.xlsx)
          </button>
        </div>

        {errorMsg && <div style={errorBannerStyle}>{errorMsg}</div>}

        {/* Upload Drop Zone */}
        {!resultMsg && (
          <div style={{ marginTop: '1rem' }}>
            <div style={dropzoneStyle}>
              <UploadCloud size={36} color="#3b82f6" />
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', fontWeight: 'bold' }}>
                {fileName ? `File Selected: ${fileName}` : `Drag & Drop your .xlsx or .csv file here`}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Supports Microsoft Excel (.xlsx, .xls) and CSV</p>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                style={{ marginTop: '0.5rem' }}
              />
            </div>

            {/* Parsed Rows Preview */}
            {parsedData.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#334155' }}>
                  Previewing {parsedData.length} records ready for upload:
                </h4>
                <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                  <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                        <th style={{ padding: '0.4rem' }}>#</th>
                        <th style={{ padding: '0.4rem' }}>Name</th>
                        <th style={{ padding: '0.4rem' }}>Phone</th>
                        <th style={{ padding: '0.4rem' }}>{activeTab === 'USERS' ? 'Role' : 'Category'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.slice(0, 10).map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.4rem' }}>{idx + 1}</td>
                          <td style={{ padding: '0.4rem' }}>{row.name || row.Name || row['Full Name'] || row['Visitor Name']}</td>
                          <td style={{ padding: '0.4rem' }}>{row.phone || row.Phone || row['Mobile']}</td>
                          <td style={{ padding: '0.4rem' }}>{row.role || row.Role || row.category || row.Category || 'GENERAL'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', gap: '0.5rem' }}>
                  <button onClick={handleReset} style={cancelBtnStyle}>Clear File</button>
                  <button onClick={handleSubmitUpload} disabled={loading} style={submitBtnStyle}>
                    {loading ? 'Processing Upload...' : `Import ${parsedData.length} ${activeTab === 'USERS' ? 'Users' : 'Visitors'}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results Screen */}
        {resultMsg && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#166534', fontWeight: 'bold' }}>
              <CheckCircle size={20} /> {resultMsg.message}
            </div>

            {/* Generated Passes preview for Visitors */}
            {resultMsg.generatedPasses && (
              <div style={{ marginTop: '1rem' }}>
                <h5 style={{ margin: '0 0 0.5rem 0' }}>Generated Auto-Approved Passes:</h5>
                <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {resultMsg.generatedPasses.map((p, i) => (
                    <div key={i} style={{ background: '#fff', padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span><strong>{p.visitor_name}</strong> ({p.phone})</span>
                      <span style={{ color: '#15803d', fontWeight: 'bold' }}>{p.pass_code}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {resultMsg.errors && resultMsg.errors.length > 0 && (
              <div style={{ marginTop: '1rem', background: '#fff5f5', padding: '0.5rem', borderRadius: '4px' }}>
                <h5 style={{ color: '#991b1b', margin: '0 0 0.4rem 0' }}>Skipped / Failed Rows ({resultMsg.errors.length}):</h5>
                {resultMsg.errors.map((e, idx) => (
                  <p key={idx} style={{ margin: 0, fontSize: '0.75rem', color: '#991b1b' }}>
                    Row #{e.row}: {e.name ? `${e.name} - ` : ''}{e.message}
                  </p>
                ))}
              </div>
            )}

            <button onClick={handleReset} style={{ ...submitBtnStyle, marginTop: '1rem', width: '100%' }}>
              Upload Another File
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Inline Styles
const overlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.65)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000,
  backdropFilter: 'blur(4px)',
};

const modalStyle = {
  background: '#ffffff',
  borderRadius: '12px',
  width: '90%', maxWidth: '640px',
  padding: '1.5rem',
  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
};

const headerStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
  marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem',
};

const closeBtnStyle = {
  background: 'none', border: 'none', cursor: 'pointer', color: '#64748b',
};

const tabContainerStyle = {
  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem',
};

const tabButtonStyle = (active) => ({
  padding: '0.5rem', fontSize: '0.85rem', fontWeight: 'bold',
  background: active ? '#eff6ff' : '#f8fafc',
  color: active ? '#1d4ed8' : '#64748b',
  border: active ? '2px solid #3b82f6' : '1px solid #cbd5e1',
  borderRadius: '6px', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
});

const templateBannerStyle = {
  background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px',
  border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
};

const downloadBtnStyle = {
  background: '#2563eb', color: '#ffffff', border: 'none',
  padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold',
  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem',
};

const dropzoneStyle = {
  border: '2px dashed #93c5fd', borderRadius: '8px', padding: '1.5rem',
  textAlign: 'center', background: '#eff6ff', cursor: 'pointer',
};

const errorBannerStyle = {
  background: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '6px', marginTop: '1rem', fontSize: '0.85rem',
};

const submitBtnStyle = {
  background: '#057a55', color: '#fff', border: 'none',
  padding: '0.5rem 1.2rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer',
};

const cancelBtnStyle = {
  background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1',
  padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer',
};
