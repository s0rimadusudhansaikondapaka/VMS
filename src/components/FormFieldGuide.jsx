import React from 'react';
import { Info, HelpCircle, CheckCircle, Shield, Lightbulb } from 'lucide-react';

const fieldHelpDictionary = {
  regType: {
    title: 'Registration Type Workflow',
    description: 'Selects the specific visitor entry workflow required for campus access.',
    tips: [
      'Pre-Approval: Guest or Host pre-registers prior to arrival.',
      'Spot Registration: Filled by visitor or guard at gate.',
      'Frequent Visitor / Maid: Issues a permanent reusable passcode.',
      'No Smartphone: Requires guard assisted pass creation.',
    ],
    example: 'Pre-Approval / Spot Registration',
  },
  fullName: {
    title: 'Visitor Full Name',
    description: 'The primary visitor full legal name as per government ID proof.',
    tips: [
      'Enter full first and last name.',
      'Must match Aadhaar / Driving License / Passport.',
    ],
    example: 'e.g. Srinivas Rao or Anil Kumar',
  },
  phone: {
    title: 'Phone / Mobile Number',
    description: 'Primary 10-digit mobile number of the visitor for SMS pass delivery.',
    tips: [
      'Include 10-digit number or international code.',
      'Used for single-use invite verification and lookup at gate.',
    ],
    example: '+91 9876543210',
  },
  email: {
    title: 'Email Address (Optional)',
    description: 'Visitor email address for digital passcard and confirmation copy.',
    tips: ['Optional field, useful for foreign nationals or official visitors.'],
    example: 'visitor@example.com',
  },
  gender: {
    title: 'Visitor Gender',
    description: 'Gender classification for accommodation and security counts.',
    tips: ['Select Male, Female, or Other.'],
    example: 'Male / Female',
  },
  photoUrl: {
    title: 'Visitor Photo Capture',
    description: 'Live camera snapshot or photo upload of the primary visitor.',
    tips: [
      'Ensure face is clearly visible without sunglasses or helmet.',
      'Use 📷 Live Camera Capture button to capture instantly.',
    ],
    example: 'Live Photo Capture',
  },
  idCardNumber: {
    title: 'ID Proof Number',
    description: 'Government ID card number (Aadhaar, PAN, DL, Passport).',
    tips: ['Enter valid ID number for security verification.'],
    example: 'Aadhaar: 1234-5678-9012',
  },
  address: {
    title: 'Ashram Address / Flat & Villa Location',
    description: 'The specific home address inside Ashram for Residents or office room for Employees.',
    tips: [
      'Residents: Flat No, Villa / Block Name inside Sathya Sai Grama.',
      'Employees: Department Building Name and Room Number.',
    ],
    example: 'Flat 302, Sai Residence Block A',
  },
  visitType: {
    title: 'Visit Type / Purpose Category',
    description: 'Specifies the nature of the visit within Sathya Sai Grama campus.',
    tips: [
      'HOME: Personal visit to Ashram Resident (Routes L2 to PRO).',
      'OFFICE: Official work visit (Routes L2 to Department HOD).',
      'BHAJAN / TOUR / EVENT: General Ashram visitors (Routes L2 to PRO).',
    ],
    example: 'HOME / OFFICE / BHAJAN',
  },
  stayRequired: {
    title: 'Overnight Stay / Accommodation Checkbox',
    description: 'Indicates whether the guest requires overnight room accommodation inside campus.',
    tips: [
      'Checking this automatically routes L2 approval to Accommodation Team.',
      'Requires stay start and expected checkout dates.',
    ],
    example: 'Overnight Accommodation Required',
  },
  priority: {
    title: 'Pass Priority Tier (P1 - P4)',
    description: 'Priority level assigned to the visitor pass for gate routing and notifications.',
    tips: [
      'P1: VVIP / Trustee / High Priority',
      'P2: Official Guest / Donor',
      'P3: Regular Visitor (Default)',
      'P4: Vendor / Contractor',
    ],
    example: 'P3 (Regular) / P1 (VVIP)',
  },
  vehicles: {
    title: 'Registered Vehicle Details',
    description: 'License plate numbers and driver details for vehicles entering campus.',
    tips: [
      'Enter plate number e.g. KA-01-AB-1234.',
      'Add multiple vehicle rows if entering with multiple cars.',
    ],
    example: 'KA-01-AB-1234 (Car)',
  },
  accompanying: {
    title: 'Accompanying Group Breakdown',
    description: 'Counts of adult men, adult women, boys, and girls traveling together.',
    tips: [
      'Single Visit: Default 1 Adult Man.',
      'Group Visit: Enter accurate counts for gate headcount verification.',
    ],
    example: 'Men: 2, Women: 2, Kids: 1',
  },
};

export default function FormFieldGuide({ activeField }) {
  const info = activeField && fieldHelpDictionary[activeField] ? fieldHelpDictionary[activeField] : null;

  return (
    <div
      style={{
        background: '#ffffff',
        border: '2px solid #e2e8f0',
        borderRadius: '12px',
        padding: '1.2rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        height: 'fit-content',
        position: 'sticky',
        top: '1.5rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        <Lightbulb color="#f59e0b" size={20} />
        <h4 style={{ margin: 0, color: '#1e293b', fontSize: '0.95rem' }}>
          Interactive Field Guide & Tips
        </h4>
      </div>

      {info ? (
        <div style={{ fontSize: '0.85rem' }}>
          <h5 style={{ margin: '0 0 0.4rem 0', color: '#2563eb', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Info size={16} /> {info.title}
          </h5>
          <p style={{ margin: '0 0 0.8rem 0', color: '#475569', lineHeight: 1.4 }}>
            {info.description}
          </p>

          {info.tips && (
            <div style={{ marginBottom: '0.8rem' }}>
              <strong style={{ fontSize: '0.78rem', color: '#1e293b', display: 'block', marginBottom: '0.3rem' }}>Guidelines:</strong>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#64748b', fontSize: '0.78rem' }}>
                {info.tips.map((tip, idx) => (
                  <li key={idx} style={{ marginBottom: '0.2rem' }}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {info.example && (
            <div style={{ background: '#f0f9ff', border: '1px dashed #93c5fd', borderRadius: '6px', padding: '0.4rem 0.7rem', fontSize: '0.75rem', color: '#1e40af' }}>
              <strong>Example Value:</strong> {info.example}
            </div>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '1rem 0.5rem', color: '#64748b', fontSize: '0.82rem' }}>
          <HelpCircle size={32} color="#cbd5e1" style={{ marginBottom: '0.5rem', display: 'block', margin: '0 auto 0.5rem auto' }} />
          <p style={{ margin: 0, lineHeight: 1.4 }}>
            Click or select any input field on the left form to view detailed guidelines, tips, and validation rules here.
          </p>
        </div>
      )}
    </div>
  );
}
