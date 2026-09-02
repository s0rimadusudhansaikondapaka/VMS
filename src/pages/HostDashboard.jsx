import React, { useState, useEffect } from 'react';
import { createRegistration, updateRegistration, getHostRegistrations, updateApproval, getVisitHistory, generateQrCode, generateInviteToken, getResidentFamilyMembers, addResidentFamilyMember, deleteResidentFamilyMember } from '../services/api';
import CameraCaptureModal from '../components/CameraCaptureModal';
import DashboardHeader from '../components/DashboardHeader';
import FormFieldGuide from '../components/FormFieldGuide';
import { useTablePagination, PaginationControls } from '../components/TablePagination';
import { UserPlus, CheckCircle, XCircle, Clock, Plus, Trash2, Camera, CreditCard, Users, Car, Calendar, ShieldCheck, KeyRound, Pencil, History, QrCode, Share2, Copy, Upload, RefreshCw } from 'lucide-react';

export default function HostDashboard({ user }) {
  const [registrations, setRegistrations] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [activeField, setActiveField] = useState('');
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [editingRegistrationId, setEditingRegistrationId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [visitHistory, setVisitHistory] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeShareToken, setActiveShareToken] = useState('');
  const [qrModalData, setQrModalData] = useState(null);
  const [isExpandedQr, setIsExpandedQr] = useState(false);

  // Family Members Management state
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
  const [fmName, setFmName] = useState('');
  const [fmRelationship, setFmRelationship] = useState('Spouse');
  const [fmPhone, setFmPhone] = useState('');
  const [fmEmail, setFmEmail] = useState('');
  const [fmPassword, setFmPassword] = useState('password123');
  const [fmAge, setFmAge] = useState('');
  const [fmGender, setFmGender] = useState('Female');
  const [fmError, setFmError] = useState('');
  const [fmMsg, setFmMsg] = useState('');

  const handleAddFamilyMemberSubmit = async (e) => {
    e.preventDefault();
    setFmError('');
    setFmMsg('');
    try {
      const res = await addResidentFamilyMember({
        full_name: fmName,
        relationship: fmRelationship,
        phone: fmPhone,
        email: fmEmail,
        password: fmPassword,
        age: fmAge,
        gender: fmGender,
      });

      if (res.success) {
        setFmMsg(`Family member '${fmName}' added successfully! Host login account created (Email: ${res.credentials?.email}).`);
        setFmName('');
        setFmPhone('');
        setFmEmail('');
        setFmAge('');
        fetchFamilyMembers();
        setTimeout(() => setShowAddFamilyModal(false), 2500);
      }
    } catch (err) {
      setFmError(err.response?.data?.message || 'Failed to add family member.');
    }
  };

  const handleDeleteFamilyMember = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove family member '${name}'? Their host login account will be suspended.`)) return;
    try {
      const res = await deleteResidentFamilyMember(id);
      if (res.success) {
        setMsg(res.message);
        fetchFamilyMembers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove family member.');
    }
  };

  const {
    searchTerm: regSearch,
    setSearchTerm: setRegSearch,
    currentPage: regPage,
    setCurrentPage: setRegPage,
    totalPages: regTotalPages,
    totalItems: regTotalItems,
    paginatedData: paginatedRegistrations,
  } = useTablePagination(registrations, ['visitor_name', 'visitor_phone', 'pass_code', 'visitor_category', 'purpose'], 10);

  const {
    searchTerm: histSearch,
    setSearchTerm: setHistSearch,
    currentPage: histPage,
    setCurrentPage: setHistPage,
    totalPages: histTotalPages,
    totalItems: histTotalItems,
    paginatedData: paginatedHistory,
  } = useTablePagination(visitHistory, ['visitor_name', 'pass_code', 'visitor_category'], 10);

  const handleOpenShareModal = async () => {
    try {
      const res = await generateInviteToken();
      if (res.success && res.token) {
        setActiveShareToken(res.token);
      }
    } catch (e) {
      console.error('Failed to generate invite token:', e);
    }
    setShowShareModal(true);
  };

  const handleGenerateQr = async (reg) => {
    try {
      const res = await generateQrCode(reg.id);
      if (res.success) {
        setQrModalData({
          pass_code: res.pass_code,
          qr_code_url: res.qr_code_url,
          visitor_name: reg.visitor_name,
          is_single_use: res.is_single_use,
        });
      } else {
        alert(res.message || 'Failed to generate QR Code.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error generating QR Code.');
    }
  };

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('Male');
  const [photoUrl, setPhotoUrl] = useState('');
  const [idType, setIdType] = useState('Aadhaar');
  const [idCardNumber, setIdCardNumber] = useState('');
  const [idCardImageUrl, setIdCardImageUrl] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [visitType, setVisitType] = useState('HOME');
  const [purpose, setPurpose] = useState('');
  const [stayRequired, setStayRequired] = useState(false);
  const [isVvip, setIsVvip] = useState(false);
  const [cameraTarget, setCameraTarget] = useState('photo'); // 'photo' or 'idCard'

  // PPTX Requirements: Registration Mode (Single/Group), Type & Permanent Pass
  const [registrationMode, setRegistrationMode] = useState('Single');
  const [registrationType, setRegistrationType] = useState('PRE_APPROVAL');
  const [isPermanentPass, setIsPermanentPass] = useState(false);
  const [hasSmartphone, setHasSmartphone] = useState(true);

  // Visit Window (Arrival: Now, Departure: Tomorrow 9:00 PM)
  const getDefaultFrom = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const getDefaultUntil = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(21, 0, 0, 0); // Tomorrow 9:00 PM
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const hours = String(tomorrow.getHours()).padStart(2, '0');
    const minutes = String(tomorrow.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [validFrom, setValidFrom] = useState(getDefaultFrom());
  const [validUntil, setValidUntil] = useState(getDefaultUntil());
  const [relationship, setRelationship] = useState('Spouse');

  // Role capability checks for visit_type filtering
  const isUserResident = user?.role === 'RESIDENT' || user?.residency_status === 'Resident' || user?.role === 'ADMIN';
  const isUserEmployee = user?.role === 'EMPLOYEE' || user?.role === 'HOD' || user?.residency_status === 'Employee' || user?.role === 'ADMIN';
  const isVipHostOnly = user?.user_type === 'VIP_HOST' || user?.role === 'VIP_HOST';

  // Personal Host Gate Pass & QR Code calculation for bottom of screen
  const hostPassCode = user?.pass_code || (
    user?.role === 'RESIDENT' ? `RESIDENT-${1000 + (parseInt(user?.id) || 1)}` :
    user?.role === 'EMPLOYEE' || user?.role === 'HOD' ? `EMP-${1000 + (parseInt(user?.id) || 1)}` :
    `HOST-${1000 + (parseInt(user?.id) || 1)}`
  );

  const hostQrPayload = JSON.stringify({
    passCode: hostPassCode,
    userId: user?.id,
    name: user?.name,
    role: user?.role,
    residency: user?.residency_status || 'RESIDENT',
    type: 'HOST_PERMANENT_PASS'
  });

  const hostQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(hostQrPayload)}`;

  // Referrer Review & Approval Modal State (Screenshot 2)
  const [reviewModalData, setReviewModalData] = useState(null);
  const [reviewVisitType, setReviewVisitType] = useState('HOME');
  const [reviewCategory, setReviewCategory] = useState('GENERAL');
  const [reviewPriority, setReviewPriority] = useState('P3');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [reviewValidFrom, setReviewValidFrom] = useState('');
  const [reviewValidUntil, setReviewValidUntil] = useState('');

  const openReviewModal = (reg) => {
    setReviewModalData(reg);
    const initialVisit = reg.visit_type || (isUserResident ? 'HOME' : isUserEmployee ? 'OFFICE' : 'BHAJAN');
    setReviewVisitType(initialVisit);
    setReviewCategory(reg.visitor_category || 'GENERAL');
    setReviewPriority(reg.priority || 'P3');
    setReviewRemarks(reg.remarks || '');
    setReviewValidFrom(reg.valid_from ? new Date(reg.valid_from).toISOString().slice(0, 16) : getDefaultFrom());
    setReviewValidUntil(reg.valid_until ? new Date(reg.valid_until).toISOString().slice(0, 16) : getDefaultUntil());
  };

  const handleReviewAction = async (action) => {
    if (!reviewModalData) return;
    try {
      const res = await updateApproval(
        reviewModalData.id,
        action,
        reviewRemarks || `Action ${action} by Referrer ${user.name}`,
        {
          priority: reviewPriority,
          visit_type: reviewVisitType,
          visitor_category: reviewCategory,
          valid_from: reviewValidFrom,
          valid_until: reviewValidUntil,
        }
      );
      if (res.success) {
        alert(res.message || `Registration #${reviewModalData.id} updated!`);
        setReviewModalData(null);
        fetchRegistrations();
        fetchVisitHistory();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed.');
    }
  };

  // Accompanying Breakdown
  const [adultMen, setAdultMen] = useState(1);
  const [adultWomen, setAdultWomen] = useState(0);
  const [boysCount, setBoysCount] = useState(0);
  const [girlsCount, setGirlsCount] = useState(0);

  // Multiple Vehicles Array
  const [vehicles, setVehicles] = useState([
    { plate_number: '', vehicle_type: 'Car', driver_name: '', driver_phone: '' }
  ]);

  useEffect(() => {
    fetchRegistrations();
    fetchVisitHistory();
    fetchFamilyMembers();

    const handleRealtimeSync = (e) => {
      console.log('[HostDashboard] Realtime Sync Event received:', e.detail);
      fetchRegistrations();
      fetchVisitHistory();
      fetchFamilyMembers();
    };

    window.addEventListener('vms_realtime_sync', handleRealtimeSync);
    return () => window.removeEventListener('vms_realtime_sync', handleRealtimeSync);
  }, []);

  const fetchFamilyMembers = async () => {
    try {
      const res = await getResidentFamilyMembers();
      if (res.success) setFamilyMembers(res.family_members || []);
    } catch (err) {
      console.error('Failed to fetch resident family members:', err);
    }
  };

  const fetchRegistrations = async () => {
    try {
      const res = await getHostRegistrations();
      if (res.success) setRegistrations(res.registrations);
    } catch (err) {
      console.error('Failed to fetch host registrations:', err);
    }
  };

  const fetchVisitHistory = async () => {
    try {
      const res = await getVisitHistory();
      if (res.success) setVisitHistory(res.history);
    } catch (err) {
      console.error(err);
    }
  };

  const addVehicleField = () => {
    setVehicles([...vehicles, { plate_number: '', vehicle_type: 'Car', driver_name: '', driver_phone: '' }]);
  };

  const removeVehicleField = (index) => {
    setVehicles(vehicles.filter((_, i) => i !== index));
  };

  const handleVehicleChange = (index, field, value) => {
    const updated = [...vehicles];
    updated[index][field] = value;
    setVehicles(updated);
  };

  const handleTypeChange = (typeVal) => {
    setRegistrationType(typeVal);
    if (typeVal === 'FREQUENT_VISITOR') {
      setIsPermanentPass(true);
      setCategory('MAID');
    } else if (typeVal === 'DELIVERY_COURIER') {
      setCategory('DELIVERY');
    } else if (typeVal === 'NO_SMARTPHONE') {
      setHasSmartphone(false);
    } else if (typeVal === 'SPOT_UNFAMILIAR') {
      setCategory('GENERAL');
      setPurpose('General Ashram Unfamiliar Visitor');
    } else {
      setIsPermanentPass(false);
      setHasSmartphone(true);
    }
  };

  const handlePhotoCaptured = (dataUrl) => {
    if (cameraTarget === 'idCard') {
      setIdCardImageUrl(dataUrl);
    } else {
      setPhotoUrl(dataUrl);
    }
  };

  const handlePhotoFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleIdFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setIdCardImageUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleStartEdit = (reg) => {
    setEditingRegistrationId(reg.id);
    setFullName(reg.visitor_name || '');
    setPhone(reg.visitor_phone || '');
    setEmail(reg.visitor_email || '');
    setGender(reg.visitor_gender || 'Male');
    setPhotoUrl(reg.photo_url || '');
    setIdType(reg.id_type || 'Aadhaar');
    setIdCardNumber(reg.id_card_number || '');
    setIdCardImageUrl(reg.id_card_image_url || '');
    setCategory(reg.visitor_category || 'GENERAL');
    setVisitType(reg.visit_type || 'HOME');
    setPurpose(reg.purpose || '');
    setStayRequired(reg.stay_required || false);
    setIsVvip(reg.is_vvip || false);
    setRegistrationMode(reg.registration_mode || 'Single');
    setRegistrationType(reg.registration_type || 'PRE_APPROVAL');
    setIsPermanentPass(reg.is_permanent_pass || false);
    setHasSmartphone(reg.has_smartphone !== undefined ? reg.has_smartphone : true);
    if (reg.valid_from) setValidFrom(new Date(reg.valid_from).toISOString().slice(0, 16));
    if (reg.valid_until) setValidUntil(new Date(reg.valid_until).toISOString().slice(0, 16));
    setAdultMen(reg.adult_men_count || 1);
    setAdultWomen(reg.adult_women_count || 0);
    setBoysCount(reg.boys_count || 0);
    setGirlsCount(reg.girls_count || 0);
    setVehicles(reg.vehicles && reg.vehicles.length > 0 ? reg.vehicles : [{ plate_number: '', vehicle_type: 'Car', driver_name: '', driver_phone: '' }]);
    setShowModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    try {
      const isSingle = registrationMode === 'Single';
      const computedMen = isSingle ? (gender === 'Female' ? 0 : 1) : (parseInt(adultMen) || 0);
      const computedWomen = isSingle ? (gender === 'Female' ? 1 : 0) : (parseInt(adultWomen) || 0);
      const computedBoys = isSingle ? 0 : (parseInt(boysCount) || 0);
      const computedGirls = isSingle ? 0 : (parseInt(girlsCount) || 0);

      const payload = {
        full_name: fullName,
        phone,
        email,
        gender,
        relationship: category === 'FAMILY_MEMBER' ? relationship : null,
        is_family_member: category === 'FAMILY_MEMBER',
        photo_url: photoUrl,
        id_type: idType,
        id_number: idCardNumber,
        id_card_number: idCardNumber,
        id_card_image_url: idCardImageUrl,
        visitor_category: category,
        visit_type: visitType,
        purpose,
        stay_required: stayRequired,
        is_vvip: isVvip,
        registration_mode: registrationMode,
        registration_type: registrationType,
        is_permanent_pass: category === 'FAMILY_MEMBER' || isPermanentPass,
        has_smartphone: hasSmartphone,
        valid_from: validFrom,
        valid_until: validUntil,
        adult_men_count: computedMen,
        adult_women_count: computedWomen,
        boys_count: computedBoys,
        girls_count: computedGirls,
        children_count: computedBoys + computedGirls,
        vehicles: vehicles.filter((v) => v.plate_number.trim() !== ''),
        host_id: user.id,
      };

      if (editingRegistrationId) {
        const res = await updateRegistration(editingRegistrationId, payload);
        if (res.success) {
          setMsg(`Registration #${editingRegistrationId} updated successfully!`);
          setShowModal(false);
          resetForm();
          fetchRegistrations();
        }
      } else {
        const res = await createRegistration(payload);
        if (res.success) {
          setMsg(`Registration created! Pass Code: ${res.registration.pass_code} (${isPermanentPass ? 'PERMANENT PASSCODE' : 'Single Use'})`);
          setShowModal(false);
          resetForm();
          fetchRegistrations();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save registration.');
    }
  };

  const handleAction = async (id, action) => {
    try {
      const res = await updateApproval(id, action, `Action ${action} by Host ${user.name}`);
      if (res.success) {
        fetchRegistrations();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed.');
    }
  };

  const resetForm = () => {
    setEditingRegistrationId(null);
    setFullName('');
    setPhone('');
    setEmail('');
    setPhotoUrl('');
    setIdType('Aadhaar');
    setIdCardNumber('');
    setIdCardImageUrl('');
    setPurpose('');
    setAdultMen(1);
    setAdultWomen(0);
    setBoysCount(0);
    setGirlsCount(0);
    setRegistrationMode('Single');
    setRegistrationType('PRE_APPROVAL');
    setIsPermanentPass(false);
    setVehicles([{ plate_number: '', vehicle_type: 'Car', driver_name: '', driver_phone: '' }]);
    setIsVvip(false);
    setValidFrom(getDefaultFrom());
    setValidUntil(getDefaultUntil());
  };

  const getHostTypeInfo = () => {
    const type = user?.user_type || user?.role || 'RESIDENT';
    switch (type) {
      case 'RESIDENT':
        return {
          title: 'Resident Host',
          desc: "Can invite guests to one's respective Residence",
          badgeBg: '#e0f2fe', badgeColor: '#0369a1', borderColor: '#7dd3fc',
          capabilities: ['🏠 Residence Invitations', '👨‍👩‍👧 Family Member Passes']
        };
      case 'EMPLOYEE':
        return {
          title: 'Employee Host',
          desc: "Can invite guests to one's respective Office (PBMT, Annapoorna, etc.)",
          badgeBg: '#dcfce7', badgeColor: '#15803d', borderColor: '#86efac',
          capabilities: ['💼 Office & Departmental Invites', '📄 Institutional Meetings']
        };
      case 'VIP_HOST':
        return {
          title: 'VIP Host',
          desc: "Can invite VIP Guests who are Ashram's guests and not specific to someone's office (e.g. CSR leaders from Hyd, Deepak brother)",
          badgeBg: '#fef3c7', badgeColor: '#b45309', borderColor: '#fde68a',
          capabilities: ['🌟 Ashram VIP Guest Invites', '🏆 Priority Escort Passes']
        };
      case 'PRO':
        return {
          title: 'Public Relations Office (PRO Host)',
          desc: "Acts as Host for walk-in visitors, approves non-specific visitors & Ashram Tour visitors",
          badgeBg: '#f3e8ff', badgeColor: '#7e22ce', borderColor: '#d8b4fe',
          capabilities: ['🏛️ Walk-in Visitor Approval', '🚌 Ashram Tour Approval', '📋 Non-Specific Guest Host']
        };
      case 'RESIDENT_EMPLOYEE':
        return {
          title: 'Resident + Employee Host',
          desc: "Dual host privileges: Residence & Office invitations",
          badgeBg: '#e0f2fe', badgeColor: '#0284c7', borderColor: '#38bdf8',
          capabilities: ['🏠 Residence Invitations', '💼 Office & Departmental Invites']
        };
      case 'RESIDENT_VIP_HOST':
        return {
          title: 'Resident + VIP Host',
          desc: "Dual host privileges: Residence & Ashram VIP Guest invitations",
          badgeBg: '#fffbeb', badgeColor: '#d97706', borderColor: '#fcd34d',
          capabilities: ['🏠 Residence Invitations', '🌟 Ashram VIP Guest Invites']
        };
      case 'EMPLOYEE_VIP_HOST':
        return {
          title: 'Employee + VIP Host',
          desc: "Dual host privileges: Office & Ashram VIP Guest invitations",
          badgeBg: '#f0fdf4', badgeColor: '#16a34a', borderColor: '#4ade80',
          capabilities: ['💼 Office & Departmental Invites', '🌟 Ashram VIP Guest Invites']
        };
      case 'RESIDENT_EMPLOYEE_VIP_HOST':
        return {
          title: 'Resident + Employee + VIP Host',
          desc: "Full host privileges: Residence, Office, & Ashram VIP Guest invitations",
          badgeBg: '#faf5ff', badgeColor: '#9333ea', borderColor: '#c084fc',
          capabilities: ['🏠 Residence Invitations', '💼 Office & Dept Invites', '🌟 VIP Guest Invites']
        };
      default:
        return {
          title: `${user?.role || 'Host'} Portal`,
          desc: 'Ashram Host Invitation Management',
          badgeBg: '#f1f5f9', badgeColor: '#475569', borderColor: '#cbd5e1',
          capabilities: ['🤝 General Host Privileges']
        };
    }
  };

  const getHostPermissions = () => {
    const type = (user?.user_type || user?.role || 'RESIDENT').toUpperCase();
    const role = (user?.role || '').toUpperCase();

    if (['ADMIN', 'SUPERVISOR', 'SECURITY_HEAD', 'GUARD'].includes(role)) {
      return {
        canInviteResidence: true, canInviteOffice: true, canInviteVip: true,
        allowedCategories: ['GENERAL', 'FAMILY_MEMBER', 'VIP', 'VVIP', 'MAID', 'FREQUENT_VISITOR', 'DELIVERY', 'VENDOR', 'FOREIGN_NATIONAL'],
        allowedVisitTypes: ['HOME', 'OFFICE', 'BHAJAN', 'EVENT', 'TOUR'],
      };
    }

    switch (type) {
      case 'VIP_HOST':
        return {
          canInviteResidence: false, canInviteOffice: false, canInviteVip: true,
          allowedCategories: ['VIP', 'VVIP'],
          allowedVisitTypes: ['BHAJAN', 'EVENT', 'TOUR', 'OFFICE'],
        };
      case 'EMPLOYEE':
        return {
          canInviteResidence: false, canInviteOffice: true, canInviteVip: false,
          allowedCategories: ['GENERAL', 'DELIVERY', 'VENDOR', 'CONTRACTOR', 'FOREIGN_NATIONAL'],
          allowedVisitTypes: ['OFFICE', 'BHAJAN', 'EVENT'],
        };
      case 'RESIDENT':
        return {
          canInviteResidence: true, canInviteOffice: false, canInviteVip: false,
          allowedCategories: ['GENERAL', 'FAMILY_MEMBER', 'MAID', 'FREQUENT_VISITOR', 'FOREIGN_NATIONAL'],
          allowedVisitTypes: ['HOME', 'BHAJAN', 'EVENT'],
        };
      case 'PRO':
        return {
          canInviteResidence: true, canInviteOffice: true, canInviteVip: true,
          allowedCategories: ['GENERAL', 'VIP', 'VVIP', 'VENDOR', 'FOREIGN_NATIONAL'],
          allowedVisitTypes: ['TOUR', 'OFFICE', 'HOME', 'BHAJAN', 'EVENT'],
        };
      case 'RESIDENT_EMPLOYEE':
        return {
          canInviteResidence: true, canInviteOffice: true, canInviteVip: false,
          allowedCategories: ['GENERAL', 'FAMILY_MEMBER', 'MAID', 'FREQUENT_VISITOR', 'DELIVERY', 'VENDOR', 'FOREIGN_NATIONAL'],
          allowedVisitTypes: ['HOME', 'OFFICE', 'BHAJAN', 'EVENT'],
        };
      case 'RESIDENT_VIP_HOST':
        return {
          canInviteResidence: true, canInviteOffice: false, canInviteVip: true,
          allowedCategories: ['GENERAL', 'FAMILY_MEMBER', 'VIP', 'VVIP', 'MAID', 'FREQUENT_VISITOR', 'FOREIGN_NATIONAL'],
          allowedVisitTypes: ['HOME', 'BHAJAN', 'EVENT', 'TOUR'],
        };
      case 'EMPLOYEE_VIP_HOST':
        return {
          canInviteResidence: false, canInviteOffice: true, canInviteVip: true,
          allowedCategories: ['GENERAL', 'VIP', 'VVIP', 'DELIVERY', 'VENDOR', 'FOREIGN_NATIONAL'],
          allowedVisitTypes: ['OFFICE', 'BHAJAN', 'EVENT', 'TOUR'],
        };
      case 'RESIDENT_EMPLOYEE_VIP_HOST':
        return {
          canInviteResidence: true, canInviteOffice: true, canInviteVip: true,
          allowedCategories: ['GENERAL', 'FAMILY_MEMBER', 'VIP', 'VVIP', 'MAID', 'FREQUENT_VISITOR', 'DELIVERY', 'VENDOR', 'FOREIGN_NATIONAL'],
          allowedVisitTypes: ['HOME', 'OFFICE', 'BHAJAN', 'EVENT', 'TOUR'],
        };
      default:
        return {
          canInviteResidence: true, canInviteOffice: true, canInviteVip: true,
          allowedCategories: ['GENERAL', 'FAMILY_MEMBER', 'VIP', 'VVIP', 'MAID', 'FREQUENT_VISITOR', 'DELIVERY', 'VENDOR', 'FOREIGN_NATIONAL'],
          allowedVisitTypes: ['HOME', 'OFFICE', 'BHAJAN', 'EVENT', 'TOUR'],
        };
    }
  };

  const hostTypeDetails = getHostTypeInfo();
  const hostPerms = getHostPermissions();

  return (
    <div className="container">
      <DashboardHeader
        title={`Host Portal (${hostTypeDetails.title})`}
        subtitle={`Welcome back, ${user.name} | Residency Status: ${user.residency_status || 'Resident'}`}
        roleBadge={hostTypeDetails.title.toUpperCase()}
        actionButton={
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleOpenShareModal}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#2563eb', borderColor: '#2563eb', color: 'white', fontWeight: 'bold', fontSize: '0.85rem' }}
            >
              <Share2 size={16} /> Share Guest Invite Link
            </button>
            <button
              onClick={() => setShowModal(!showModal)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#d97706', borderColor: '#d97706', color: 'white', fontWeight: 'bold', fontSize: '0.85rem' }}
            >
              <UserPlus size={16} /> Invite / Pre-Register Guest
            </button>
          </div>
        }
      />

      {/* Host Type & Capability Summary Banner */}
      <div style={{
        background: hostTypeDetails.badgeBg,
        border: `1px solid ${hostTypeDetails.borderColor}`,
        borderRadius: '10px',
        padding: '0.85rem 1.2rem',
        marginBottom: '1.2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.8rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', color: hostTypeDetails.badgeColor }}>
              YOUR HOST PROFILE TYPE:
            </span>
            <strong style={{ fontSize: '1rem', color: '#1e293b' }}>
              {hostTypeDetails.title}
            </strong>
          </div>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#334155' }}>
            📌 <strong>Invitation Scope:</strong> {hostTypeDetails.desc}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {hostTypeDetails.capabilities.map((cap, idx) => (
            <span key={idx} style={{
              background: '#ffffff',
              color: hostTypeDetails.badgeColor,
              border: `1px solid ${hostTypeDetails.borderColor}`,
              fontSize: '0.75rem',
              fontWeight: '700',
              padding: '0.25rem 0.6rem',
              borderRadius: '6px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              {cap}
            </span>
          ))}
        </div>
      </div>

      {msg && <div style={{ background: '#def7ec', color: '#03543f', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem' }}>{msg}</div>}
      {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem' }}>{error}</div>}

      {showCameraModal && (
        <CameraCaptureModal
          onPhotoCaptured={handlePhotoCaptured}
          onClose={() => setShowCameraModal(false)}
        />
      )}

      {showModal && (
        <div className="card" style={{ border: '2px solid #3b82f6' }}>
          <h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', color: '#1e293b' }}>
            {editingRegistrationId ? `✏️ Edit Visitor Invite #${editingRegistrationId} (Before Approval)` : 'Guest Pre-Registration & Visitor Workflow Form'}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '1.5rem', alignItems: 'start' }}>
            <form onSubmit={handleCreate}>
              {/* Registration Workflow Selector (5 Types & Sub-workflows) */}
              <div style={{ background: '#eff6ff', padding: '0.85rem', borderRadius: '8px', border: '1px solid #bfdbfe', marginBottom: '1rem' }} onFocus={() => setActiveField('regType')}>
              <strong style={{ fontSize: '0.9rem', color: '#1e40af', display: 'block', marginBottom: '0.4rem' }}>
                Select Registration Type (5 Application Workflows):
              </strong>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <div style={{ background: '#ffffff', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#1e293b', display: 'block', marginBottom: '0.2rem' }}>
                    1. Pre-Approval Registration
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingLeft: '0.5rem' }}>
                    <label style={{ fontSize: '0.78rem', cursor: 'pointer' }}>
                      <input type="radio" name="regType" value="PRE_APPROVAL" checked={registrationType === 'PRE_APPROVAL'} onChange={() => handleTypeChange('PRE_APPROVAL')} />
                      1b. Referrer fills form on behalf of Guest
                    </label>
                    <span style={{ fontSize: '0.72rem', color: '#2563eb', cursor: 'pointer', fontStyle: 'italic', paddingLeft: '1.2rem' }} onClick={() => { setShowModal(false); setShowShareModal(true); }}>
                      🔗 Or click here for 1a: Guest fills form via Share Link
                    </span>
                  </div>
                </div>

                <div style={{ background: '#ffffff', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#1e293b', display: 'block', marginBottom: '0.2rem' }}>
                    2. Spot Registration (At Gate / Entry)
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingLeft: '0.5rem' }}>
                    <label style={{ fontSize: '0.78rem', cursor: 'pointer' }}>
                      <input type="radio" name="regType" value="SPOT_REGISTRATION" checked={registrationType === 'SPOT_REGISTRATION'} onChange={() => handleTypeChange('SPOT_REGISTRATION')} />
                      2a. Visitor familiar with Ashram Resident
                    </label>
                    <label style={{ fontSize: '0.78rem', cursor: 'pointer' }}>
                      <input type="radio" name="regType" value="SPOT_UNFAMILIAR" checked={registrationType === 'SPOT_UNFAMILIAR'} onChange={() => handleTypeChange('SPOT_UNFAMILIAR')} />
                      2b. Visitor unfamiliar with Ashram individuals
                    </label>
                  </div>
                </div>

                <div style={{ background: '#ffffff', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#1e293b', cursor: 'pointer' }}>
                    <input type="radio" name="regType" value="NO_SMARTPHONE" checked={registrationType === 'NO_SMARTPHONE'} onChange={() => handleTypeChange('NO_SMARTPHONE')} />
                    3. Visitor without Smartphone / Phone
                  </label>
                  <p style={{ margin: '0.2rem 0 0 1.2rem', fontSize: '0.72rem', color: '#64748b' }}>Generates printable pass slip & numeric passcode.</p>
                </div>

                <div style={{ background: '#ffffff', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#057a55', cursor: 'pointer' }}>
                    <input type="radio" name="regType" value="FREQUENT_VISITOR" checked={registrationType === 'FREQUENT_VISITOR'} onChange={() => handleTypeChange('FREQUENT_VISITOR')} />
                    4. Frequent Visitor / Maid (Permanent Pass)
                  </label>
                  <p style={{ margin: '0.2rem 0 0 1.2rem', fontSize: '0.72rem', color: '#057a55' }}>Resets to APPROVED upon exit for repeated daily entry.</p>
                </div>

                <div style={{ background: '#ffffff', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#b45309', cursor: 'pointer' }}>
                    <input type="radio" name="regType" value="DELIVERY_COURIER" checked={registrationType === 'DELIVERY_COURIER'} onChange={() => handleTypeChange('DELIVERY_COURIER')} />
                    5. Delivery, Courier boys, Cab Drivers
                  </label>
                  <p style={{ margin: '0.2rem 0 0 1.2rem', fontSize: '0.72rem', color: '#b45309' }}>Quick phone number lookup and instant gate pass.</p>
                </div>
              </div>
            </div>

            {/* PPTX Requirement 2: Registration Mode (Single vs Group) */}
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', background: '#f8fafc', padding: '0.5rem 1rem', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Registration Mode:</span>
              <label style={{ cursor: 'pointer', fontSize: '0.85rem' }}>
                <input type="radio" name="regMode" value="Single" checked={registrationMode === 'Single'} onChange={(e) => setRegistrationMode(e.target.value)} />
                Single Visitor
              </label>
              <label style={{ cursor: 'pointer', fontSize: '0.85rem' }}>
                <input type="radio" name="regMode" value="Group" checked={registrationMode === 'Group'} onChange={(e) => setRegistrationMode(e.target.value)} />
                Group Visit
              </label>
            </div>

            {/* Section 1: Demographics */}
            <h4 style={{ fontSize: '0.9rem', color: '#2563eb', marginTop: '0.5rem' }}>1. Visitor Demographics & Identity</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem' }}>
              <label>
                Full Name *
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onFocus={() => setActiveField('fullName')}
                  className={activeField === 'fullName' ? 'field-highlighted' : ''}
                />
              </label>
              <label>
                Phone Number *
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onFocus={() => setActiveField('phone')}
                  className={activeField === 'phone' ? 'field-highlighted' : ''}
                />
              </label>
              <label>
                Email Address
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setActiveField('email')}
                  className={activeField === 'email' ? 'field-highlighted' : ''}
                />
              </label>
              <label>
                Gender Selection *
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  onFocus={() => setActiveField('gender')}
                  className={activeField === 'gender' ? 'field-highlighted' : ''}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              {/* Simplified Visitor Photo Attachment Control */}
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <label style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                    📷 Visitor Photo Attachment
                  </label>
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <label className="button" style={{ margin: 0, padding: '0.45rem 1rem', fontSize: '0.82rem', background: '#2563eb', borderColor: '#2563eb', color: 'white', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 'bold' }}>
                      <Upload size={15} /> Select Photo File
                      <input type="file" accept="image/*" onChange={handlePhotoFileUpload} style={{ display: 'none' }} />
                    </label>
                    <button
                      type="button"
                      onClick={() => { setCameraTarget('photo'); setShowCameraModal(true); }}
                      style={{ margin: 0, padding: '0.45rem 1rem', fontSize: '0.82rem', background: '#7c3aed', borderColor: '#7c3aed', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 'bold' }}
                    >
                      <Camera size={15} /> Snap Live Camera
                    </button>
                  </div>
                  {photoUrl && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.6rem', padding: '0.5rem', background: '#ffffff', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                      <img src={photoUrl} alt="Photo Preview" style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #057a55' }} />
                      <span style={{ fontSize: '0.8rem', color: '#057a55', fontWeight: 'bold' }}>✓ Visitor Photo Attached</span>
                      <button type="button" onClick={() => setPhotoUrl('')} className="secondary outline" style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', marginLeft: 'auto' }}>
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <label>
                Category
                <select
                  value={category}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCategory(val);
                    if (val === 'VVIP') setIsVvip(true);
                    else if (val === 'VIP') setIsVvip(false);
                    if (val === 'FOREIGN_NATIONAL' && idType === 'Aadhaar') {
                      setIdType('Foreign Passport');
                    }
                  }}
                >
                  {hostPerms.allowedCategories.includes('GENERAL') && <option value="GENERAL">General Guest</option>}
                  {hostPerms.allowedCategories.includes('FAMILY_MEMBER') && <option value="FAMILY_MEMBER">Resident Family Member (Pre-Approved)</option>}
                  {hostPerms.allowedCategories.includes('VIP') && <option value="VIP">VIP (Very Important Person)</option>}
                  {hostPerms.allowedCategories.includes('VVIP') && <option value="VVIP">VVIP (High Priority VVIP Guest)</option>}
                  {hostPerms.allowedCategories.includes('MAID') && <option value="MAID">Domestic Helper / Maid</option>}
                  {hostPerms.allowedCategories.includes('FREQUENT_VISITOR') && <option value="FREQUENT_VISITOR">Frequent Visitor</option>}
                  {hostPerms.allowedCategories.includes('DELIVERY') && <option value="DELIVERY">Delivery / Courier</option>}
                  {hostPerms.allowedCategories.includes('VENDOR') && <option value="VENDOR">Vendor</option>}
                  {hostPerms.allowedCategories.includes('FOREIGN_NATIONAL') && <option value="FOREIGN_NATIONAL">Foreign National</option>}
                </select>
              </label>

              {category === 'FAMILY_MEMBER' && (
                <label style={{ marginTop: '0.6rem' }}>
                  Relationship to Resident (Pre-Approved Family Member) *
                  <select value={relationship} onChange={(e) => setRelationship(e.target.value)}>
                    <option value="Spouse">Spouse</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Son-in-law">Son-in-law</option>
                    <option value="Daughter-in-law">Daughter-in-law</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Brother-in-law">Brother-in-law</option>
                    <option value="Sister-in-law">Sister-in-law</option>
                    <option value="Grandfather">Grandfather</option>
                    <option value="Grandmother">Grandmother</option>
                    <option value="Grandchild">Grandchild</option>
                    <option value="Dependent Relative">Dependent Relative</option>
                  </select>
                </label>
              )}
            </div>

            {/* Section 2: Identity & Document Proof Attachment */}
            <h4 style={{ fontSize: '0.9rem', color: '#2563eb', marginTop: '1rem' }}>2. Identity & Document Proof Attachment</h4>
            <div style={{ marginTop: '0.5rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <label style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#334155', display: 'block', marginBottom: '0.4rem' }}>
                📄 Upload Document or Snap Photo
              </label>
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <label className="button" style={{ margin: 0, padding: '0.45rem 1rem', fontSize: '0.82rem', background: '#2563eb', borderColor: '#2563eb', color: 'white', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 'bold' }}>
                  <Upload size={15} /> Select Document / Photo File
                  <input type="file" accept="image/*,.pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={handleIdFileUpload} style={{ display: 'none' }} />
                </label>
                <button
                  type="button"
                  onClick={() => { setCameraTarget('idCard'); setShowCameraModal(true); }}
                  style={{ margin: 0, padding: '0.45rem 1rem', fontSize: '0.82rem', background: '#7c3aed', borderColor: '#7c3aed', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 'bold' }}
                >
                  <Camera size={15} /> Snap Photo / Document
                </button>
              </div>

              {idCardImageUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.6rem', padding: '0.5rem', background: '#ffffff', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  {idCardImageUrl.startsWith('data:image') || idCardImageUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) || idCardImageUrl.startsWith('http') ? (
                    <img src={idCardImageUrl} alt="Document Preview" style={{ maxWidth: '100px', maxHeight: '60px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                  ) : (
                    <div style={{ padding: '0.5rem 0.8rem', background: '#eff6ff', borderRadius: '4px', fontSize: '0.8rem', color: '#1e40af', fontWeight: 'bold' }}>📄 Document File</div>
                  )}
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.85rem', color: '#057a55', fontWeight: 'bold' }}>✓ Document / Proof Attached</span>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Ready for security verification.</p>
                  </div>
                  <button type="button" onClick={() => setIdCardImageUrl('')} className="secondary outline" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                    Remove Attachment
                  </button>
                </div>
              )}
            </div>

            {/* Section 3: Visit Window & Accompanying Breakdown */}
            <h4 style={{ fontSize: '0.9rem', color: '#2563eb', marginTop: '1rem' }}>3. Scheduled Visit Window & Accompanying Breakdown</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              <label>
                Arrival Date/Time (`validFrom`)
                <input type="datetime-local" required value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
              </label>
              <label>
                Departure Date/Time (`validUntil`)
                <input type="datetime-local" required value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
              </label>
            </div>

            {registrationMode === 'Group' || registrationMode === 'group' ? (
              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '0.5rem' }}>
                <strong style={{ fontSize: '0.85rem', color: '#334155' }}>Group Accompanying Breakdown:</strong>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.8rem', marginTop: '0.4rem' }}>
                  <label>
                    Adult Men (👨)
                    <input type="number" min="0" value={adultMen} onChange={(e) => setAdultMen(e.target.value)} />
                  </label>
                  <label>
                    Adult Women (👩)
                    <input type="number" min="0" value={adultWomen} onChange={(e) => setAdultWomen(e.target.value)} />
                  </label>
                  <label>
                    Boys (👦)
                    <input type="number" min="0" value={boysCount} onChange={(e) => setBoysCount(e.target.value)} />
                  </label>
                  <label>
                    Girls (👧)
                    <input type="number" min="0" value={girlsCount} onChange={(e) => setGirlsCount(e.target.value)} />
                  </label>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.4rem', fontWeight: 'bold' }}>
                  Total People: {(parseInt(adultMen) || 0) + (parseInt(adultWomen) || 0) + (parseInt(boysCount) || 0) + (parseInt(girlsCount) || 0)} (Children: {(parseInt(boysCount) || 0) + (parseInt(girlsCount) || 0)})
                </div>
              </div>
            ) : (
              <div style={{ background: '#eff6ff', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #bfdbfe', marginTop: '0.5rem', fontSize: '0.82rem', color: '#1e40af', fontWeight: 'bold' }}>
                ⚡ Single Visitor Mode: Auto-calculated breakdown for 1 Visitor ({gender === 'Female' ? '1 Adult Woman' : '1 Adult Man'}).
              </div>
            )}

            {/* Section 4: Multiple Registered Vehicles */}
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#2563eb', margin: 0 }}>4. Multiple Registered Vehicles</h4>
                <button type="button" onClick={addVehicleField} className="secondary outline" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                  <Plus size={14} /> Add Vehicle
                </button>
              </div>

              {vehicles.map((v, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr 1.2fr 0.4fr', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
                  <input type="text" placeholder="Plate Number (e.g. KA-01-AB-1234)" value={v.plate_number} onChange={(e) => handleVehicleChange(idx, 'plate_number', e.target.value)} />
                  <select value={v.vehicle_type} onChange={(e) => handleVehicleChange(idx, 'vehicle_type', e.target.value)}>
                    <option value="Car">Car</option>
                    <option value="SUV">SUV</option>
                    <option value="Two Wheeler">Two Wheeler</option>
                    <option value="Truck">Truck / Supply</option>
                  </select>
                  <input type="text" placeholder="Driver Name" value={v.driver_name} onChange={(e) => handleVehicleChange(idx, 'driver_name', e.target.value)} />
                  <input type="text" placeholder="Driver Phone" value={v.driver_phone} onChange={(e) => handleVehicleChange(idx, 'driver_phone', e.target.value)} />
                  {vehicles.length > 1 && (
                    <button type="button" onClick={() => removeVehicleField(idx)} className="secondary" style={{ padding: '0.4rem', color: '#dc2626' }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <label style={{ marginTop: '1rem' }}>
              Purpose of Visit *
              <textarea rows="2" required value={purpose} onChange={(e) => setPurpose(e.target.value)}></textarea>
            </label>

            <div style={{ display: 'flex', gap: '2rem', margin: '0.5rem 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#057a55', fontWeight: 'bold' }}>
                <input type="checkbox" checked={isPermanentPass} onChange={(e) => setIsPermanentPass(e.target.checked)} />
                Generate Permanent Passcode (Frequent Visitor / Maid - Can be reused every time)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#99154b', fontWeight: 'bold' }}>
                <input type="checkbox" checked={isVvip} onChange={(e) => setIsVvip(e.target.checked)} />
                Important VVIP Request
              </label>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" style={{ background: editingRegistrationId ? '#2563eb' : undefined, borderColor: editingRegistrationId ? '#2563eb' : undefined }} data-tooltip="Submit visitor pass registration">
                {editingRegistrationId ? 'Save Changes' : 'Submit Registration'}
              </button>
              <button type="button" className="secondary" onClick={() => { setShowModal(false); resetForm(); }} data-tooltip="Cancel and close form">Cancel</button>
            </div>
          </form>

          {/* Right-side Interactive Field Guide */}
          <FormFieldGuide activeField={activeField} />
        </div>
      </div>
      )}

      {/* My Linked Family Members & Pass Statuses Card */}
      {isUserResident && (
        <div className="card" style={{ borderTop: '4px solid #7c3aed', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
            <div>
              <h3 style={{ margin: 0, color: '#6d28d9', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} color="#7c3aed" /> My Linked Family Members & Pass Statuses ({familyMembers.length})
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                First-time family member passes require one-time PRO Team verification (`PENDING_L2`). Once approved, Resident Hosts enjoy direct 1-click renewals (`APPROVED`).
              </p>
            </div>
            <button
              onClick={() => {
                setCategory('FAMILY_MEMBER');
                setIsPermanentPass(true);
                setShowModal(true);
              }}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem', background: '#7c3aed', borderColor: '#7c3aed', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 'bold' }}
            >
              <UserPlus size={16} /> Add Family Member Pass
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table role="grid" style={{ fontSize: '0.83rem', margin: 0 }}>
              <thead>
                <tr style={{ background: '#4c1d95', color: '#ffffff' }}>
                  <th>Family Member Name</th>
                  <th>Relationship to Resident</th>
                  <th>Phone / Identity</th>
                  <th>PRO Verification Status</th>
                  <th>Active Pass Code & Window</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {familyMembers.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: '#64748b', padding: '1rem' }}>
                      No linked family members registered yet. Click <strong>"Add Family Member Pass"</strong> to register your spouse, children, or relatives.
                    </td>
                  </tr>
                ) : (
                  familyMembers.map((fam) => (
                    <tr key={fam.id}>
                      <td>
                        <strong>{fam.full_name}</strong>
                      </td>
                      <td>
                        <span className="badge badge-inside" style={{ background: '#f3e8ff', color: '#6b21a8', border: '1px solid #d8b4fe' }}>
                          🔗 {fam.relationship}
                        </span>
                      </td>
                      <td>
                        <div>{fam.phone || 'N/A'}</div>
                        {fam.id_card_number && <div style={{ fontSize: '0.72rem', color: '#64748b' }}>ID: {fam.id_card_number}</div>}
                      </td>
                      <td>
                        {fam.is_pro_approved ? (
                          <span style={{ color: '#15803d', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', background: '#dcfce7', padding: '0.2rem 0.6rem', borderRadius: '12px', border: '1px solid #86efac' }}>
                            <CheckCircle size={14} /> Verified (Direct Renewals Active)
                          </span>
                        ) : (
                          <span style={{ color: '#c2410c', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', background: '#fff7ed', padding: '0.2rem 0.6rem', borderRadius: '12px', border: '1px solid #fed7aa' }}>
                            <Clock size={14} /> ⏳ First-Time: Pending PRO Team Approval
                          </span>
                        )}
                      </td>
                      <td>
                        {fam.latest_pass_code ? (
                          <div>
                            <strong style={{ color: '#4c1d95' }}>{fam.latest_pass_code}</strong>{' '}
                            <span className={`badge badge-${(fam.latest_pass_status || 'PENDING').toLowerCase()}`}>
                              {fam.latest_pass_status}
                            </span>
                            {fam.latest_valid_until && (
                              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                Valid Until: {new Date(fam.latest_valid_until).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>No Pass Issued Yet</span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => {
                            setFullName(fam.full_name);
                            setPhone(fam.phone || '');
                            setCategory('FAMILY_MEMBER');
                            setRelationship(fam.relationship);
                            setIdCardNumber(fam.id_card_number || '');
                            setIsPermanentPass(true);
                            setShowModal(true);
                          }}
                          style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem', background: '#6d28d9', borderColor: '#6d28d9', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <RefreshCw size={12} /> {fam.is_pro_approved ? '🔄 Renew Family Pass' : 'Re-Submit Request'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invited Visitors List */}
      <div className="card">
        <h3>My Invited Visitors ({registrations.length})</h3>
        
        <PaginationControls
          searchTerm={regSearch}
          setSearchTerm={setRegSearch}
          currentPage={regPage}
          setCurrentPage={setRegPage}
          totalPages={regTotalPages}
          totalItems={regTotalItems}
          pageSize={10}
          placeholder="Filter visitors by Name, Phone, Passcode, Category..."
        />

        <table role="grid">
          <thead>
            <tr>
              <th>Pass / Photo</th>
              <th>Visitor Name</th>
              <th>Type / Passcode</th>
              <th>Visit Window</th>
              <th>Breakdown</th>
              <th>Vehicles</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRegistrations.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', color: '#64748b' }}>No registrations found matching search filter.</td>
              </tr>
            ) : (
              paginatedRegistrations.map((reg) => (
                <tr key={reg.id}>
                  <td>
                    {reg.photo_url ? (
                      <img src={reg.photo_url} alt="Visitor" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
                        No Pic
                      </div>
                    )}
                  </td>
                  <td>
                    <strong>{reg.visitor_name}</strong><br/>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{reg.visitor_phone}</span>
                  </td>
                  <td>
                    <strong>{reg.pass_code}</strong><br/>
                    {reg.is_permanent_pass ? (
                      <span className="badge badge-approved" style={{ fontSize: '0.65rem' }}>PERMANENT PASS</span>
                    ) : (
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{reg.registration_type}</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.75rem' }}>
                    From: {new Date(reg.valid_from).toLocaleString()}<br/>
                    Until: {new Date(reg.valid_until).toLocaleString()}
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>
                    👨 {reg.adult_men_count || 1} | 👩 {reg.adult_women_count || 0} | 👦 {reg.boys_count || 0} | 👧 {reg.girls_count || 0}
                  </td>
                  <td style={{ fontSize: '0.75rem' }}>
                    {reg.vehicles && reg.vehicles.length > 0 ? (
                      reg.vehicles.map((v, i) => <div key={i}>🚘 {v.plate_number} ({v.vehicle_type})</div>)
                    ) : (
                      <span style={{ color: '#94a3b8' }}>None</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge badge-${reg.status.toLowerCase()}`}>{reg.status}</span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                      {reg.status === 'PENDING_L1' && (
                        <>
                          <button className="outline" onClick={() => openReviewModal(reg)} style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', background: '#057a55', borderColor: '#057a55', color: 'white', fontWeight: 'bold' }}>
                            <CheckCircle size={14} /> Review & Approve
                          </button>
                          <button className="secondary outline" onClick={() => openReviewModal(reg)} style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                            <Pencil size={14} /> Edit Details
                          </button>
                        </>
                      )}
                      {(reg.status === 'APPROVED' || reg.status === 'INSIDE_CAMPUS' || reg.status === 'ADMIN_BYPASSED') && (
                        <button
                          type="button"
                          onClick={() => handleGenerateQr(reg)}
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', background: '#7c3aed', borderColor: '#7c3aed', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                          title="Generate QR Code and Passcode for Guest"
                        >
                          <QrCode size={14} /> {reg.qr_code_url ? 'View QR Pass' : 'Generate QR Code'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Visit History Section */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={20} /> Visit History
          </h3>
          <button
            onClick={() => { setShowHistory(!showHistory); if (!showHistory) fetchVisitHistory(); }}
            className="secondary outline"
            style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}
          >
            {showHistory ? 'Hide History' : 'Show Visit History'}
          </button>
        </div>
        {showHistory && (
          <div>
            <PaginationControls
              searchTerm={histSearch}
              setSearchTerm={setHistSearch}
              currentPage={histPage}
              setCurrentPage={setHistPage}
              totalPages={histTotalPages}
              totalItems={histTotalItems}
              pageSize={10}
              placeholder="Search history by Visitor Name, Passcode, Category..."
            />

            <table role="grid" style={{ marginTop: '1rem' }}>
              <thead>
                <tr>
                  <th>Pass Code</th>
                  <th>Visitor Name</th>
                  <th>Category</th>
                  <th>Entry Time</th>
                  <th>Exit Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedHistory.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: '#64748b' }}>No visit history found.</td>
                  </tr>
                ) : (
                  paginatedHistory.map((visit) => (
                  <tr key={visit.id}>
                    <td><strong>{visit.pass_code}</strong></td>
                    <td>{visit.visitor_name}</td>
                    <td>{visit.visitor_category}</td>
                    <td style={{ fontSize: '0.8rem' }}>
                      {visit.entry_time ? new Date(visit.entry_time).toLocaleString() : '—'}
                      {visit.entry_gate && <span style={{ fontSize: '0.7rem', color: '#64748b' }}><br/>{visit.entry_gate}</span>}
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>
                      {visit.exit_time ? new Date(visit.exit_time).toLocaleString() : '—'}
                      {visit.exit_gate && <span style={{ fontSize: '0.7rem', color: '#64748b' }}><br/>{visit.exit_gate}</span>}
                    </td>
                    <td>
                      <span className={`badge badge-${visit.status.toLowerCase()}`}>{visit.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Personal Host Gate Pass & QR Code Section (Bottom of Screen) */}
      <div className="card" style={{ marginTop: '1.5rem', border: '2px solid #7c3aed', background: 'linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.1)' }}>
        {/* Card Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '2px solid #f3e8ff', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ margin: 0, color: '#4c1d95', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.25rem', fontWeight: '800' }}>
              <QrCode size={24} color="#7c3aed" /> My Personal Host Gate Pass & QR Code
            </h3>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#6b21a8' }}>
              Your active permanent digital pass for Sathya Sai Grama campus entry and gate verification.
            </p>
          </div>
          <span style={{ background: '#7c3aed', color: 'white', padding: '0.4rem 0.9rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: '800', letterSpacing: '0.04em', boxShadow: '0 2px 6px rgba(124, 58, 237, 0.3)' }}>
            ✓ ACTIVE PERMANENT HOST PASS
          </span>
        </div>

        {/* Responsive Two-Column Layout */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'stretch' }}>
          {/* Left Column: Host Details */}
          <div style={{ flex: '1 1 340px', minWidth: 0, background: 'white', padding: '1.4rem', borderRadius: '12px', border: '1px solid #e9d5ff', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #f3e8ff', marginBottom: '1rem' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#7c3aed', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1.4rem', boxShadow: '0 4px 10px rgba(124, 58, 237, 0.25)', flexShrink: 0 }}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'H'}
              </div>
              <div style={{ minWidth: 0 }}>
                <h4 style={{ margin: 0, color: '#1e293b', fontSize: '1.15rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'Host User'}</h4>
                <span style={{ fontSize: '0.8rem', color: '#6b21a8', fontWeight: '600', display: 'inline-block', marginTop: '0.15rem' }}>
                  {user?.role || 'RESIDENT'} • {user?.residency_status || 'Resident'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem', background: '#faf5ff', borderRadius: '6px' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Permanent Passcode:</span>
                <span style={{ fontWeight: '800', color: '#7c3aed', fontSize: '1.05rem', letterSpacing: '0.05em' }}>{hostPassCode}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Department / Residence:</span>
                <span style={{ color: '#1e293b', fontWeight: '600', textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>{user?.department_name || user?.flat_info || 'Sathya Sai Grama'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem', background: '#faf5ff', borderRadius: '6px' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Registered Mobile:</span>
                <span style={{ color: '#1e293b', fontWeight: '600' }}>{user?.phone || 'Registered Phone'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Pass Validity:</span>
                <span style={{ color: '#057a55', fontWeight: '800', background: '#dcfce7', padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.8rem' }}>Unlimited / Lifetime</span>
              </div>
            </div>
          </div>

          {/* Right Column: QR Code & Share Buttons */}
          <div style={{ flex: '1 1 300px', minWidth: 0, background: 'white', padding: '1.4rem', borderRadius: '12px', border: '1px solid #e9d5ff', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div
              onClick={() => setIsExpandedQr(true)}
              title="Click to expand QR Code for easy gate scanning"
              style={{ background: '#faf5ff', padding: '0.8rem', borderRadius: '14px', border: '2px solid #7c3aed', display: 'inline-block', marginBottom: '0.8rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.15)', transition: 'transform 0.2s ease' }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <img
                src={hostQrImageUrl}
                alt="Personal Host QR Code Pass"
                style={{ width: '180px', height: '180px', display: 'block', borderRadius: '8px', border: '1px solid #7c3aed', background: 'white' }}
              />
              <span style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', marginTop: '0.5rem' }}>
                🔍 Click to Expand for Scanning
              </span>
            </div>

            <span style={{ fontSize: '0.78rem', color: '#6b21a8', fontWeight: '800', letterSpacing: '0.05em', display: 'block', marginBottom: '1rem' }}>
              SCAN AT GATE TERMINAL FOR INGRESS / EGRESS
            </span>

            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap', width: '100%' }}>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Jay Sai Ram! Here is my official Sathya Sai Grama Personal Host Gate Pass:\n\nHost: ${user?.name}\nRole: ${user?.role}\nPasscode: ${hostPassCode}\nStatus: Active Permanent Pass`)}`}
                target="_blank"
                rel="noreferrer"
                style={{ flex: 1, textDecoration: 'none', minWidth: '130px' }}
              >
                <button type="button" style={{ width: '100%', background: '#25d366', borderColor: '#25d366', color: 'white', fontWeight: 'bold', fontSize: '0.82rem', padding: '0.55rem 0.8rem', borderRadius: '8px' }}>
                  📲 Share WhatsApp
                </button>
              </a>

              <button
                type="button"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = hostQrImageUrl;
                  link.download = `HostPass_${hostPassCode}.png`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                style={{ flex: 1, background: '#7c3aed', borderColor: '#7c3aed', color: 'white', fontWeight: 'bold', fontSize: '0.82rem', padding: '0.55rem 0.8rem', borderRadius: '8px', minWidth: '130px' }}
              >
                ⬇️ Download QR
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Household Family Members & Host Logins Card */}
      <div className="card" style={{ borderTop: '4px solid #0d9488', marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.8rem' }}>
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f766e', margin: 0 }}>
              <Users size={22} color="#0f766e" /> Household Family Members & Family Host Logins
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
              Family members linked to your residence get their own login accounts to issue and approve visitor passes under your household.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddFamilyModal(true)}
            style={{ background: '#0d9488', borderColor: '#0d9488', color: 'white', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem' }}
          >
            <UserPlus size={16} /> + Add Family Member & Host Account
          </button>
        </div>

        {familyMembers.length === 0 ? (
          <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', textAlign: 'center', color: '#64748b', border: '1px dashed #cbd5e1' }}>
            <Users size={32} color="#94a3b8" style={{ marginBottom: '0.5rem' }} />
            <p style={{ margin: 0, fontWeight: 'bold' }}>No family members registered yet.</p>
            <span style={{ fontSize: '0.8rem' }}>Click "+ Add Family Member & Host Account" to give your family members login access to issue guest passes.</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table role="grid">
              <thead>
                <tr>
                  <th>Family Member Name</th>
                  <th>Relationship</th>
                  <th>Contact Phone</th>
                  <th>Login Email</th>
                  <th>Host Access Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {familyMembers.map((fm) => (
                  <tr key={fm.id}>
                    <td>
                      <strong>{fm.full_name}</strong>
                    </td>
                    <td>
                      <span className="badge badge-vvip" style={{ background: '#0f766e' }}>
                        {fm.relationship}
                      </span>
                    </td>
                    <td>{fm.phone || 'N/A'}</td>
                    <td>
                      <code style={{ fontSize: '0.82rem', color: '#2563eb' }}>{fm.email || 'No Email'}</code>
                    </td>
                    <td>
                      <span style={{ background: '#dcfce7', color: '#065f46', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 'bold' }}>
                        ● Active Host Login
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleDeleteFamilyMember(fm.id, fm.full_name)}
                        style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', padding: '0.25rem 0.6rem', fontSize: '0.75rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', borderRadius: '4px' }}
                      >
                        <Trash2 size={13} /> Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Family Member Modal */}
      {showAddFamilyModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '520px', width: '100%', padding: '1.6rem', borderRadius: '12px' }}>
            <div style={{ borderBottom: '2px solid #0d9488', paddingBottom: '0.6rem', marginBottom: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#0f766e', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={20} color="#0d9488" /> Add Household Family Member & Host Account
              </h3>
              <button type="button" onClick={() => setShowAddFamilyModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            {fmError && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.7rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>{fmError}</div>}
            {fmMsg && <div style={{ background: '#def7ec', color: '#03543f', padding: '0.7rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>{fmMsg}</div>}

            <form onSubmit={handleAddFamilyMemberSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
                <label style={{ gridColumn: 'span 2' }}>
                  Full Name *
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sunita Rao"
                    value={fmName}
                    onChange={(e) => setFmName(e.target.value)}
                    style={{ marginTop: '0.3rem' }}
                  />
                </label>

                <label>
                  Relationship to Resident *
                  <select value={fmRelationship} onChange={(e) => setFmRelationship(e.target.value)} style={{ marginTop: '0.3rem', fontWeight: 'bold' }}>
                    <option value="Spouse">Spouse (Wife / Husband)</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Dependent">Other Dependent</option>
                  </select>
                </label>

                <label>
                  Phone Number
                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    value={fmPhone}
                    onChange={(e) => setFmPhone(e.target.value)}
                    style={{ marginTop: '0.3rem' }}
                  />
                </label>

                <label style={{ gridColumn: 'span 2' }}>
                  Login Email Address * (Family Member Host Login)
                  <input
                    type="email"
                    required
                    placeholder="e.g. sunita@ashram.org"
                    value={fmEmail}
                    onChange={(e) => setFmEmail(e.target.value)}
                    style={{ marginTop: '0.3rem' }}
                  />
                </label>

                <label>
                  Default Login Password
                  <input
                    type="text"
                    value={fmPassword}
                    onChange={(e) => setFmPassword(e.target.value)}
                    style={{ marginTop: '0.3rem' }}
                  />
                </label>

                <label>
                  Gender
                  <select value={fmGender} onChange={(e) => setFmGender(e.target.value)} style={{ marginTop: '0.3rem' }}>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.2rem' }}>
                <button
                  type="submit"
                  style={{ flex: 1, background: '#0d9488', borderColor: '#0d9488', color: 'white', fontWeight: 'bold', padding: '0.6rem' }}
                >
                  ✓ Add Family Member & Create Host Account
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setShowAddFamilyModal(false)}
                  style={{ padding: '0.6rem 1rem' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Guest Invite Link Modal */}
      {showShareModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '1.5rem', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 0.8rem 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Share2 size={20} color="#2563eb" /> Share Pre-Approval Guest Invite Link
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#475569', margin: '0 0 1.5rem 0', lineHeight: '1.4' }}>
              Share this invite link directly with your guest via WhatsApp. They can fill out their details and choose <strong>Single</strong> or <strong>Group Visit</strong> on their smartphone prior to arrival.
            </p>

            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Jay Sai Ram! Please fill out your visitor pre-approval registration form for Sathya Sai Grama using this single-use link: ${window.location.origin}/?invite=true&${activeShareToken ? `token=${activeShareToken}` : `guid=${user.guid || user.id}`}`)}`}
                target="_blank"
                rel="noreferrer"
                style={{ flex: 1, textDecoration: 'none', minWidth: '150px' }}
              >
                <button type="button" style={{ width: '100%', background: '#25d366', borderColor: '#25d366', color: 'white', fontWeight: 'bold', fontSize: '0.85rem', padding: '0.65rem' }}>
                  📲 Share via WhatsApp
                </button>
              </a>

              <a
                href={`mailto:?subject=${encodeURIComponent('Sathya Sai Grama - Guest Visitor Pre-Approval Link')}&body=${encodeURIComponent(`Jay Sai Ram!\n\nPlease fill out your visitor pre-approval registration form for Sathya Sai Grama using the following single-use link prior to your arrival:\n\n${window.location.origin}/?invite=true&${activeShareToken ? `token=${activeShareToken}` : `guid=${user.guid || user.id}`}\n\nNote: This link is valid for a single registration submission.\n\nThank you!`)}`}
                style={{ flex: 1, textDecoration: 'none', minWidth: '150px' }}
              >
                <button type="button" style={{ width: '100%', background: '#2563eb', borderColor: '#2563eb', color: 'white', fontWeight: 'bold', fontSize: '0.85rem', padding: '0.65rem' }}>
                  ✉️ Share via Email
                </button>
              </a>

              <button type="button" className="secondary outline" onClick={() => setShowShareModal(false)} style={{ fontSize: '0.85rem', padding: '0.65rem 1rem' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Referrer Review & Approval Modal (Screenshot 2: Add below details or skip) */}
      {reviewModalData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '540px', width: '100%', padding: '1.5rem', borderRadius: '12px' }}>
            <div style={{ borderBottom: '2px solid #2563eb', paddingBottom: '0.6rem', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#1e293b' }}>Referrer Review & Approval</h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                Review guest: <strong>{reviewModalData.visitor_name}</strong> ({reviewModalData.visitor_phone})
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              <label>
                Resident / Department / Ashram Visit
                <select value={reviewVisitType} onChange={(e) => setReviewVisitType(e.target.value)}>
                  {isUserResident && <option value="HOME">Resident / Home Visit</option>}
                  {isUserEmployee && <option value="OFFICE">Department / Office Visit</option>}
                  <option value="BHAJAN">Ashram Bhajan Visit</option>
                  <option value="EVENT">Ashram Event Visit</option>
                  <option value="TOUR">Ashram Tour Visit</option>
                </select>
              </label>

              <label>
                Category (Govt., Vendors etc.)
                <select value={reviewCategory} onChange={(e) => setReviewCategory(e.target.value)}>
                  <option value="GENERAL">General Guest</option>
                  <option value="VIP">VIP</option>
                  <option value="VVIP">VVIP</option>
                  <option value="MAID">Domestic Helper / Maid</option>
                  <option value="FREQUENT_VISITOR">Frequent Visitor</option>
                  <option value="DELIVERY">Delivery / Courier</option>
                  <option value="VENDOR">Vendor</option>
                  <option value="FOREIGN_NATIONAL">Foreign National</option>
                </select>
              </label>

              <label>
                Priority (P1, P2, P3, P4)
                <select value={reviewPriority} onChange={(e) => setReviewPriority(e.target.value)}>
                  <option value="P1">P1 - Highest / VVIP</option>
                  <option value="P2">P2 - High Priority</option>
                  <option value="P3">P3 - Normal Priority</option>
                  <option value="P4">P4 - Low Priority</option>
                </select>
              </label>

              <label>
                Arrival Date / Time
                <input type="datetime-local" value={reviewValidFrom} onChange={(e) => setReviewValidFrom(e.target.value)} />
              </label>

              <label style={{ gridColumn: 'span 2' }}>
                Departure Date / Time (Date of Visit)
                <input type="datetime-local" value={reviewValidUntil} onChange={(e) => setReviewValidUntil(e.target.value)} />
              </label>

              <label style={{ gridColumn: 'span 2' }}>
                Referrer Remarks
                <textarea rows="2" value={reviewRemarks} onChange={(e) => setReviewRemarks(e.target.value)} placeholder="Add optional remarks for gate security or next level approver"></textarea>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.2rem' }}>
              <button
                type="button"
                onClick={() => handleReviewAction('APPROVE')}
                style={{ flex: 1, background: '#057a55', borderColor: '#057a55', color: 'white', fontWeight: 'bold', fontSize: '0.9rem', padding: '0.6rem' }}
              >
                ✓ Approve & Save Details
              </button>
              <button
                type="button"
                className="secondary outline"
                onClick={() => handleReviewAction('REJECT')}
                style={{ flex: 1, color: '#dc2626', borderColor: '#dc2626', fontWeight: 'bold', fontSize: '0.9rem', padding: '0.6rem' }}
              >
                ❌ Reject Entry
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => setReviewModalData(null)}
                style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generated QR Code & Passcode Modal */}
      {qrModalData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '420px', width: '100%', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 0.4rem 0', color: '#1e293b' }}>Guest QR Code & Passcode</h3>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Guest: <strong>{qrModalData.visitor_name}</strong></span>

            <div style={{ background: '#f8fafc', padding: '1.2rem', borderRadius: '8px', border: '1px solid #e2e8f0', margin: '1rem 0' }}>
              {qrModalData.qr_code_url ? (
                <img src={qrModalData.qr_code_url} alt="Authorized QR Code" style={{ width: '180px', height: '180px', margin: '0 auto 0.8rem auto', display: 'block', borderRadius: '8px', border: '2px solid #7c3aed' }} />
              ) : (
                <div style={{ width: '180px', height: '180px', background: '#e2e8f0', margin: '0 auto 0.8rem auto', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>QR Code</div>
              )}
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 'bold' }}>AUTHORIZED GATE PASSCODE</span>
              <h2 style={{ fontSize: '2rem', color: '#7c3aed', margin: '0.2rem 0', fontWeight: '800', letterSpacing: '0.05em' }}>{qrModalData.pass_code}</h2>
              <span style={{ background: '#fef3c7', color: '#92400e', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 'bold', display: 'inline-block' }}>
                ✓ {qrModalData.is_single_use ? 'Single-Use Pass (Valid Only Once)' : 'Frequent Visitor Permanent Pass'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={async () => {
                  const directImageUrl = `${window.location.origin}/api/registrations/qr-image/${qrModalData.pass_code}.png`;
                  const fullPassUrl = `${window.location.origin}/?pass=${qrModalData.pass_code}`;
                  const shareText = `Jay Sai Ram! Here is your entry Passcode and official QR Code Pass for Sathya Sai Grama:\n\nGuest: ${qrModalData.visitor_name || 'Guest'}\nPasscode: ${qrModalData.pass_code}\nStatus: Approved\n\nDirect QR Image:\n${directImageUrl}\n\nFull Gate Pass Link:\n${fullPassUrl}`;

                  try {
                    if (qrModalData.qr_code_url && navigator.canShare) {
                      const response = await fetch(qrModalData.qr_code_url);
                      const blob = await response.blob();
                      const file = new File([blob], `GatePass_${qrModalData.pass_code}.png`, { type: 'image/png' });

                      if (navigator.canShare({ files: [file] })) {
                        await navigator.share({
                          title: `Sathya Sai Grama Pass - ${qrModalData.pass_code}`,
                          text: shareText,
                          files: [file],
                        });
                        return;
                      }
                    }
                  } catch (err) {
                    console.log('Native file share fallback:', err);
                  }

                  window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
                }}
                style={{ flex: 1, background: '#25d366', borderColor: '#25d366', color: 'white', fontWeight: 'bold', fontSize: '0.8rem', padding: '0.5rem', minWidth: '110px' }}
              >
                📲 WhatsApp
              </button>

              <a
                href={`mailto:?subject=${encodeURIComponent('Sathya Sai Grama - Entry Gate Passcode & QR Code')}&body=${encodeURIComponent(`Jay Sai Ram!\n\nHere is your entry Passcode and official QR Code Pass for Sathya Sai Grama:\nGuest: ${qrModalData.visitor_name}\nPasscode: ${qrModalData.pass_code}\nStatus: Approved\n\nYou can view, save, or print your official QR Code Pass Image using this link:\n${window.location.origin}/?pass=${qrModalData.pass_code}\n\nThank you!`)}`}
                style={{ flex: 1, textDecoration: 'none', minWidth: '110px' }}
              >
                <button type="button" style={{ width: '100%', background: '#2563eb', borderColor: '#2563eb', color: 'white', fontWeight: 'bold', fontSize: '0.8rem', padding: '0.5rem' }}>
                  ✉️ Email Pass
                </button>
              </a>

              {qrModalData.qr_code_url && (
                <button
                  type="button"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = qrModalData.qr_code_url;
                    link.download = `GatePass_${qrModalData.pass_code}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  style={{ flex: 1, background: '#7c3aed', borderColor: '#7c3aed', color: 'white', fontWeight: 'bold', fontSize: '0.8rem', padding: '0.5rem', minWidth: '110px' }}
                >
                  ⬇️ Download QR
                </button>
              )}

              <button type="button" className="secondary outline" onClick={() => setQrModalData(null)} style={{ fontSize: '0.8rem', padding: '0.5rem 0.8rem' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Lightbox Modal for High-Contrast Mobile Scanning */}
      {isExpandedQr && (
        <div 
          onClick={() => setIsExpandedQr(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.92)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1.5rem', cursor: 'pointer' }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px', width: '100%', background: '#ffffff', borderRadius: '20px', padding: '1.8rem', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(124, 58, 237, 0.3)', border: '3px solid #7c3aed', cursor: 'default' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.8rem' }}>
              <div>
                <span style={{ fontSize: '0.72rem', background: '#7c3aed', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontWeight: '800', letterSpacing: '0.04em' }}>
                  ✓ ACTIVE PERMANENT HOST PASS
                </span>
                <h3 style={{ margin: '0.4rem 0 0 0', color: '#1e293b', fontSize: '1.25rem', fontWeight: '800' }}>{user?.name || 'Host User'}</h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsExpandedQr(false)}
                style={{ background: '#f1f5f9', borderColor: '#cbd5e1', color: '#475569', borderRadius: '50%', width: '36px', height: '36px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: '#ffffff', padding: '1.2rem', borderRadius: '16px', border: '3px solid #7c3aed', boxShadow: '0 8px 24px rgba(124, 58, 237, 0.15)', display: 'inline-block', margin: '0.5rem 0 1.2rem 0' }}>
              <img
                src={hostQrImageUrl}
                alt="Expanded Host Pass QR Code"
                style={{ width: '320px', height: '320px', maxWidth: '75vw', maxHeight: '75vw', display: 'block', borderRadius: '10px', background: 'white' }}
              />
            </div>

            <div style={{ background: '#faf5ff', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #e9d5ff', marginBottom: '1.2rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold', display: 'block' }}>AUTHORIZED PERMANENT PASSCODE</span>
              <h2 style={{ fontSize: '2.2rem', color: '#7c3aed', margin: '0.1rem 0', fontWeight: '900', letterSpacing: '0.08em' }}>{hostPassCode}</h2>
              <span style={{ fontSize: '0.75rem', color: '#057a55', fontWeight: 'bold' }}>✓ Maximum Brightness Mode for Gate Terminal Scanning</span>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Jay Sai Ram! Here is my official Sathya Sai Grama Personal Host Gate Pass:\n\nHost: ${user?.name}\nRole: ${user?.role}\nPasscode: ${hostPassCode}\nStatus: Active Permanent Pass`)}`}
                target="_blank"
                rel="noreferrer"
                style={{ flex: 1, textDecoration: 'none', minWidth: '130px' }}
              >
                <button type="button" style={{ width: '100%', background: '#25d366', borderColor: '#25d366', color: 'white', fontWeight: 'bold', fontSize: '0.85rem', padding: '0.6rem 0.8rem', borderRadius: '8px' }}>
                  📲 Share WhatsApp
                </button>
              </a>

              <button
                type="button"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = hostQrImageUrl;
                  link.download = `HostPass_${hostPassCode}.png`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                style={{ flex: 1, background: '#7c3aed', borderColor: '#7c3aed', color: 'white', fontWeight: 'bold', fontSize: '0.85rem', padding: '0.6rem 0.8rem', borderRadius: '8px', minWidth: '130px' }}
              >
                ⬇️ Download QR
              </button>

              <button
                type="button"
                onClick={() => setIsExpandedQr(false)}
                style={{ background: '#475569', borderColor: '#475569', color: 'white', fontWeight: 'bold', fontSize: '0.85rem', padding: '0.6rem 1rem', borderRadius: '8px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
