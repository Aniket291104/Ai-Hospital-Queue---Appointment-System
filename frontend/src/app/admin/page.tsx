'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { 
  Search, Bell, Settings, ChevronDown, LayoutDashboard, Activity, 
  ShieldAlert, LogOut, Calendar, FlaskConical, FileText, Users, Database, 
  Plus, RefreshCw, Loader2, Upload, Eye
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'outdoor' | 'lab' | 'prescription' | 'users' | 'master'>('dashboard');

  // General Counts
  const [doctorsCount, setDoctorsCount] = useState(0);
  const [hospitalsCount, setHospitalsCount] = useState(0);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Notifications and Settings popover state
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([
    'System Update: Core database successfully synchronized.',
    'System Alert: 2 database collections backed up successfully.',
    'API Status: Gemini AI triage engine is operational.',
  ]);
  const [settingsSound, setSettingsSound] = useState(true);
  const [settingsLiveAI, setSettingsLiveAI] = useState(true);

  // Appointments (Outdoor tab)
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState('');

  // Doctor Queue State
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctorForQueue, setSelectedDoctorForQueue] = useState('');
  const [doctorQueue, setDoctorQueue] = useState<any>(null);
  const [loadingQueue, setLoadingQueue] = useState(false);

  // Lab Module state (Mocked patient tests database)
  const [labTests, setLabTests] = useState<any[]>([
    { id: 'LT-101', patientName: 'Jane Patient', testName: 'Complete Blood Count (CBC)', status: 'Pending', result: 'Pending collection' },
    { id: 'LT-102', patientName: 'John Doe', testName: 'Lipid Profile', status: 'Processing', result: 'In lab analysis' },
    { id: 'LT-103', patientName: 'Robert Smith', testName: 'Thyroid Function Test (TSH)', status: 'Completed', result: 'TSH: 2.4 uIU/mL (Normal)' },
    { id: 'LT-104', patientName: 'Mary Johnson', testName: 'Liver Panel', status: 'Completed', result: 'ALT: 25 U/L (Normal), AST: 22 U/L (Normal)' },
  ]);
  const [labSearch, setLabSearch] = useState('');
  const [editingLabId, setEditingLabId] = useState('');
  const [editLabStatus, setEditLabStatus] = useState('');
  const [editLabResult, setEditLabResult] = useState('');

  // OCR state
  const [ocrImageBase64, setOcrImageBase64] = useState<string>('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);

  // Edit Doctor profile states & handlers
  const [editingDoctor, setEditingDoctor] = useState<any>(null);
  const [editDocSpecialization, setEditDocSpecialization] = useState('');
  const [editDocExperience, setEditDocExperience] = useState(0);
  const [editDocFees, setEditDocFees] = useState(0);
  const [editDocBio, setEditDocBio] = useState('');
  const [editDocHospital, setEditDocHospital] = useState('');
  const [editDocDepartment, setEditDocDepartment] = useState('');
  const [editDocDeptsList, setEditDocDeptsList] = useState<any[]>([]);

  const handleStartEditDoctor = async (doc: any) => {
    setEditingDoctor(doc);
    setEditDocSpecialization(doc.specialization || '');
    setEditDocExperience(doc.experience || 0);
    setEditDocFees(doc.fees || 0);
    setEditDocBio(doc.bio || '');
    setEditDocHospital(doc.hospital?._id || '');
    setEditDocDepartment(doc.department?._id || '');
    
    if (doc.hospital?._id) {
      try {
        const response = await api.get(`/hospitals/${doc.hospital._id}/departments`);
        setEditDocDeptsList(response.data.data || []);
      } catch (err) {
        console.error('Failed to load departments');
      }
    }
  };

  const handleHospitalChangeForEdit = async (hospitalId: string) => {
    setEditDocHospital(hospitalId);
    try {
      const response = await api.get(`/hospitals/${hospitalId}/departments`);
      const depts = response.data.data || [];
      setEditDocDeptsList(depts);
      if (depts.length > 0) {
        setEditDocDepartment(depts[0]._id);
      } else {
        setEditDocDepartment('');
      }
    } catch (err) {
      console.error('Failed to load departments');
    }
  };

  const handleUpdateDoctorProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;

    try {
      await api.put(`/doctors/${editingDoctor._id}`, {
        specialization: editDocSpecialization,
        experience: Number(editDocExperience),
        fees: Number(editDocFees),
        bio: editDocBio,
        hospital: editDocHospital,
        department: editDocDepartment,
      });

      toast.success('Doctor profile updated successfully!');
      setEditingDoctor(null);
      fetchDoctors();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update doctor profile');
    }
  };

  // Master Data state
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [selectedHospitalForDept, setSelectedHospitalForDept] = useState('');
  const [hospitalDepartments, setHospitalDepartments] = useState<any[]>([]);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');
  const [loadingDepts, setLoadingDepts] = useState(false);

  // User tab toggle
  const [userTabToggle, setUserTabToggle] = useState<'doctors' | 'patients'>('doctors');

  useEffect(() => {
    if (!user || (user.role !== 'Admin' && user.role !== 'SuperAdmin')) {
      router.push('/login');
      return;
    }

    fetchCounts();
    fetchAppointments();
    fetchDoctors();
    fetchHospitals();
  }, [user]);

  const fetchCounts = async () => {
    try {
      const docRes = await api.get('/doctors');
      const hospRes = await api.get('/hospitals');
      setDoctorsCount(docRes.data.count);
      setHospitalsCount(hospRes.data.count);
    } catch (err) {
      console.error('Failed to load counts');
    }
  };

  const fetchAppointments = async () => {
    setLoadingAppointments(true);
    try {
      const res = await api.get('/appointments');
      setAppointments(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch appointments');
    } finally {
      setLoadingAppointments(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/doctors');
      const docs = res.data.data || [];
      setDoctors(docs);
      if (docs.length > 0) {
        setSelectedDoctorForQueue(docs[0]._id);
        fetchDoctorQueue(docs[0]._id);
      }
    } catch (err) {
      console.error('Failed to fetch doctors');
    }
  };

  const fetchHospitals = async () => {
    try {
      const res = await api.get('/hospitals');
      const hosps = res.data.data || [];
      setHospitals(hosps);
      if (hosps.length > 0) {
        setSelectedHospitalForDept(hosps[0]._id);
        fetchDepartments(hosps[0]._id);
      }
    } catch (err) {
      console.error('Failed to fetch hospitals');
    }
  };

  const fetchDepartments = async (hospitalId: string) => {
    if (!hospitalId) return;
    setLoadingDepts(true);
    try {
      const res = await api.get(`/hospitals/${hospitalId}/departments`);
      setHospitalDepartments(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch departments');
    } finally {
      setLoadingDepts(false);
    }
  };

  const fetchDoctorQueue = async (docId: string) => {
    if (!docId) return;
    setLoadingQueue(true);
    try {
      const res = await api.get(`/queues/doctor/${docId}`);
      setDoctorQueue(res.data.data || null);
    } catch (err) {
      console.error('Failed to fetch doctor queue');
    } finally {
      setLoadingQueue(false);
    }
  };

  const handleUpdateAppointmentStatus = async (apptId: string, status: string) => {
    try {
      await api.put(`/appointments/${apptId}/status`, { status });
      toast.success(`Appointment marked as ${status}`);
      fetchAppointments();
      if (selectedDoctorForQueue) {
        fetchDoctorQueue(selectedDoctorForQueue);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleCheckIn = async (apptId: string) => {
    try {
      await api.post('/queues/check-in', { appointmentId: apptId });
      toast.success('Patient checked in & token generated successfully!');
      fetchAppointments();
      if (selectedDoctorForQueue) {
        fetchDoctorQueue(selectedDoctorForQueue);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim() || !selectedHospitalForDept) return;
    try {
      await api.post(`/hospitals/${selectedHospitalForDept}/departments`, {
        name: newDeptName,
        description: newDeptDesc,
      });
      toast.success('Department added successfully!');
      setNewDeptName('');
      setNewDeptDesc('');
      fetchDepartments(selectedHospitalForDept);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create department');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setOcrImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRunOcr = async () => {
    if (!ocrImageBase64) {
      toast.error('Please upload an image first');
      return;
    }
    setOcrLoading(true);
    setOcrResult(null);
    try {
      const res = await api.post('/ai/ocr', { image: ocrImageBase64 });
      setOcrResult(res.data.data);
      toast.success('OCR Prescription analysis complete!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'OCR request failed');
    } finally {
      setOcrLoading(false);
    }
  };

  const updateOcrMedicineRow = (index: number, field: string, value: string) => {
    if (!ocrResult) return;
    setOcrResult((prev: any) => {
      const updatedMedicines = prev.medicines.map((med: any, idx: number) => {
        if (idx === index) {
          return { ...med, [field]: value };
        }
        return med;
      });
      return { ...prev, medicines: updatedMedicines };
    });
  };

  const handleSaveOcrEdits = async () => {
    if (!ocrResult?._id) return;
    try {
      await api.put(`/prescriptions/${ocrResult._id}`, {
        medicines: ocrResult.medicines,
        instructions: ocrResult.instructions,
      });
      toast.success('OCR Prescription updates saved to database!');
    } catch (err) {
      toast.error('Failed to save prescription updates');
    }
  };

  const handleUpdateLabTest = (id: string) => {
    setLabTests(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, status: editLabStatus, result: editLabResult };
      }
      return t;
    }));
    setEditingLabId('');
    toast.success('Lab test updated successfully!');
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Filtered Appointments
  const filteredAppointments = appointments.filter(appt => {
    if (!selectedDoctorFilter) return true;
    return appt.doctor?._id === selectedDoctorFilter;
  });

  // Extract unique patients from appointments list
  const patientUsers = appointments.reduce((acc: any[], appt: any) => {
    const pat = appt.patient;
    if (pat && !acc.some(p => p._id === pat._id)) {
      acc.push(pat);
    }
    return acc;
  }, []);

  return (
    <div className="min-h-screen bg-[#DAE3EE] text-[#2C3137] font-urbanist relative overflow-x-hidden p-6 md:p-10 flex flex-col justify-between w-full max-w-[1380px] mx-auto select-none">
      {/* Main Container content wrapper */}
      <div className="flex-grow flex flex-col space-y-8 w-full z-10 relative">
        
        {/* DNA Helix Background SVG */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.25] z-0 flex items-center justify-center overflow-hidden">
          <svg className="w-full h-full min-w-[1200px]" viewBox="0 0 1200 600" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="dnaGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6AB8FF" />
                <stop offset="100%" stopColor="#CFA3F6" />
              </linearGradient>
              <linearGradient id="dnaGrad2" x1="100%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#CFA3F6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#6AB8FF" stopOpacity="0.4" />
              </linearGradient>
            </defs>
            <path
              d="M-50,300 C150,150 250,450 450,300 C650,150 750,450 950,300 C1150,150 1200,300 1300,300"
              stroke="url(#dnaGrad1)"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d="M-50,300 C150,450 250,150 450,300 C650,450 750,150 950,300 C1150,450 1200,300 1300,300"
              stroke="url(#dnaGrad2)"
              strokeWidth="4"
              strokeDasharray="2 8"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Top Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-30 relative">
          {/* User Profile */}
          <div className="relative">
            <button 
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-3 bg-[#FCFDFF] hover:bg-[#FCFDFF]/90 transition-all px-4 py-2 rounded-full border border-white/40 shadow-sm"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#6AB8FF] to-[#CFA3F6] flex items-center justify-center text-white font-bold text-sm">
                {user?.firstName?.[0] || 'A'}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold leading-tight">{user?.firstName} {user?.lastName || 'User'}</p>
                <p className="text-[10px] text-[#7C7C7C] font-semibold">{user?.role || 'Administrator'}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-[#7C7C7C]" />
            </button>

            {/* Profile Dropdown */}
            {showProfileDropdown && (
              <div className="absolute left-0 mt-2 w-48 bg-[#FCFDFF] rounded-2xl shadow-xl border border-white/50 py-2 z-50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 font-bold transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Title Branding */}
          <div className="text-center">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-wide text-[#2C3137]">HOSPITAL ERP</h1>
            <p className="text-[10px] md:text-xs text-[#7C7C7C] font-semibold tracking-wider">Hospital & Laboratory Management System</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search"
                className="bg-[#FCFDFF] pl-9 pr-4 py-2 rounded-full text-xs font-semibold text-[#2C3137] placeholder-[#7C7C7C] border border-white/50 focus:outline-none w-40 sm:w-56 shadow-sm transition-all focus:ring-2 focus:ring-[#6AB8FF]/50"
              />
              <Search className="w-4 h-4 text-[#7C7C7C] absolute left-3" />
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowSettings(false);
                  setShowProfileDropdown(false);
                }}
                className="p-2.5 bg-[#FCFDFF] hover:bg-[#FCFDFF]/90 transition-all rounded-full border border-white/40 shadow-sm relative cursor-pointer flex items-center justify-center"
              >
                <Bell className="w-4 h-4 text-[#2C3137]" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-100 p-4 rounded-2xl shadow-xl z-50 space-y-3 text-xs text-[#2C3137] animate-fade-in">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-extrabold text-sm">Notifications</span>
                    {notifications.length > 0 && (
                      <button 
                        onClick={() => setNotifications([])}
                        className="text-[10px] text-[#6AB8FF] hover:underline font-bold cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <p className="text-gray-400 italic text-center py-4">No new notifications.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {notifications.map((notif, idx) => (
                        <div key={idx} className="p-2.5 bg-[#DAE3EE]/20 rounded-xl font-semibold leading-normal">
                          {notif}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Settings */}
            <div className="relative">
              <button 
                onClick={() => {
                  setShowSettings(!showSettings);
                  setShowNotifications(false);
                  setShowProfileDropdown(false);
                }}
                className="p-2.5 bg-[#FCFDFF] hover:bg-[#FCFDFF]/90 transition-all rounded-full border border-white/40 shadow-sm cursor-pointer flex items-center justify-center"
              >
                <Settings className="w-4 h-4 text-[#2C3137]" />
              </button>

              {showSettings && (
                <div className="absolute right-0 mt-3 w-72 bg-white border border-gray-100 p-5 rounded-2xl shadow-xl z-50 space-y-4 text-xs text-[#2C3137] animate-fade-in">
                  <h4 className="font-extrabold text-sm border-b pb-2">Account Settings</h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#7C7C7C]">Sound Alerts</span>
                      <input 
                        type="checkbox" 
                        checked={settingsSound} 
                        onChange={() => setSettingsSound(!settingsSound)}
                        className="w-4 h-4 text-[#6AB8FF] rounded border-gray-300 focus:ring-[#6AB8FF] cursor-pointer"
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#7C7C7C]">Live AI Triage</span>
                      <input 
                        type="checkbox" 
                        checked={settingsLiveAI} 
                        onChange={() => setSettingsLiveAI(!settingsLiveAI)}
                        className="w-4 h-4 text-[#6AB8FF] rounded border-gray-300 focus:ring-[#6AB8FF] cursor-pointer"
                      />
                    </div>

                    <div className="pt-2 border-t text-[10px] text-gray-500 font-semibold space-y-1">
                      <p>Console Role: <strong className="text-gray-700">{user?.role}</strong></p>
                      <p>Active ID: <strong className="text-gray-700">{user?.id?.substring(0, 8)}...</strong></p>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setShowSettings(false);
                      toast.success('Settings saved successfully!');
                    }}
                    className="w-full py-2 bg-gradient-to-r from-[#6AB8FF] to-[#CFA3F6] text-white text-xs font-bold rounded-lg hover:opacity-95 shadow-sm cursor-pointer"
                  >
                    Save & Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Welcome Section & Tab Navigation */}
        <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 z-10 relative">
          <div>
            <p className="text-sm text-[#7C7C7C] font-semibold">Hi, {user?.firstName || 'Admin'}!</p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#2C3137] mt-1">Welcome Back</h2>
          </div>

          {/* Navigation Pill Menu */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none max-w-full z-20 relative">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all border whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-[#6AB8FF] to-[#CFA3F6] text-white border-transparent shadow-md'
                  : 'bg-[#FCFDFF] hover:bg-[#FCFDFF]/90 text-[#2C3137] border-white/40 shadow-sm'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            {[
              { id: 'outdoor', label: 'Outdoor', icon: Calendar },
              { id: 'lab', label: 'Lab Module', icon: FlaskConical },
              { id: 'prescription', label: 'Prescription', icon: FileText },
              { id: 'users', label: 'App Users', icon: Users },
              { id: 'master', label: 'Master Data', icon: Database }
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold border whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-[#6AB8FF] to-[#CFA3F6] text-white border-transparent shadow-md'
                      : 'bg-[#FCFDFF] hover:bg-[#FCFDFF]/90 text-[#2C3137] border-white/40 shadow-sm'
                  }`}
                >
                  <IconComponent className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Dynamic Content Panel */}
        <div className="flex-1 overflow-y-auto max-h-[52vh] my-4 pr-1 scrollbar-none z-10 relative">
          
          {/* 1. Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Patients Today */}
              <div className="bg-[#FCFDFF] rounded-[24px] p-6 border border-white/50 shadow-md flex flex-col justify-between min-h-[160px] hover:shadow-lg transition-all">
                <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-3">
                  <span className="text-xs font-bold text-[#7C7C7C] uppercase tracking-wider">Patients Today</span>
                  <Activity className="w-4 h-4 text-[#6AB8FF]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-4xl font-extrabold text-[#2C3137] tracking-tight">05</span>
                    <p className="text-[10px] text-[#7C7C7C] font-semibold mt-1">Patient Admission</p>
                  </div>
                  <div className="space-y-1 text-right self-end">
                    <p className="text-[10px] text-[#7C7C7C] font-semibold">Patient Under Treatment <span className="font-extrabold text-[#2C3137] ml-1">08</span></p>
                    <p className="text-[10px] text-[#7C7C7C] font-semibold">Patient Discharge <span className="font-extrabold text-[#2C3137] ml-1">02</span></p>
                  </div>
                </div>
              </div>

              {/* Expense Today */}
              <div className="bg-[#FCFDFF] rounded-[24px] p-6 border border-white/50 shadow-md flex flex-col justify-between min-h-[160px] hover:shadow-lg transition-all">
                <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-3">
                  <span className="text-xs font-bold text-[#7C7C7C] uppercase tracking-wider">Expense Today</span>
                  <span className="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-bold">Today</span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-2xl font-extrabold text-[#2C3137] tracking-tight">4270.00</span>
                    <p className="text-[10px] text-[#7C7C7C] font-semibold mt-1">Expense</p>
                  </div>
                  <div className="w-20 h-10 mb-2">
                    <svg className="w-full h-full" viewBox="0 0 100 40">
                      <path
                        d="M0,35 Q15,10 30,28 T60,8 T90,25 T100,10"
                        fill="none"
                        stroke="#FF7B89"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <path
                        d="M0,35 Q15,10 30,28 T60,8 T90,25 T100,10 L100,40 L0,40 Z"
                        fill="url(#sparkGrad)"
                        opacity="0.1"
                      />
                      <defs>
                        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FF7B89" />
                          <stop offset="100%" stopColor="#FF7B89" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-extrabold text-[#2C3137] tracking-tight">80430.00</span>
                    <p className="text-[10px] text-[#7C7C7C] font-semibold mt-1">This Month</p>
                  </div>
                </div>
              </div>

              {/* Collection Today */}
              <div className="bg-[#FCFDFF] rounded-[24px] p-6 border border-white/50 shadow-md flex flex-col justify-between min-h-[160px] hover:shadow-lg transition-all">
                <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-3">
                  <span className="text-xs font-bold text-[#7C7C7C] uppercase tracking-wider">Collection Today</span>
                  <span className="text-[10px] bg-green-50 text-green-500 px-2 py-0.5 rounded-full font-bold">Total</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] text-[#7C7C7C] font-semibold">Clinic <span className="font-extrabold text-[#2C3137] ml-1">6200.00</span></p>
                    <p className="text-[10px] text-[#7C7C7C] font-semibold">Lab <span className="font-extrabold text-[#2C3137] ml-1">4500.00</span></p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-[#2C3137] tracking-tight">10700.00</span>
                    <p className="text-[10px] text-[#7C7C7C] font-semibold mt-1">Total</p>
                  </div>
                </div>
              </div>

              {/* Due (Not Collected) */}
              <div className="bg-[#FCFDFF] rounded-[24px] p-6 border border-white/50 shadow-md flex flex-col justify-between min-h-[160px] hover:shadow-lg transition-all">
                <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-3">
                  <span className="text-xs font-bold text-[#7C7C7C] uppercase tracking-wider">Due (Not Collected)</span>
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] text-[#7C7C7C] font-semibold">Clinic <span className="font-extrabold text-[#2C3137] ml-1">60200.00</span></p>
                    <p className="text-[10px] text-[#7C7C7C] font-semibold">Lab <span className="font-extrabold text-[#2C3137] ml-1">72910.00</span></p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-[#2C3137] tracking-tight">133110.00</span>
                    <p className="text-[10px] text-[#7C7C7C] font-semibold mt-1">Total</p>
                  </div>
                </div>
              </div>

              {/* Lab Reports Today */}
              <div className="bg-[#FCFDFF] rounded-[24px] p-6 border border-white/50 shadow-md flex flex-col justify-between min-h-[160px] hover:shadow-lg transition-all">
                <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-3">
                  <span className="text-xs font-bold text-[#7C7C7C] uppercase tracking-wider">Lab Reports Today</span>
                  <span className="text-[10px] text-[#6AB8FF] font-bold">Analytics</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-0.5">
                    {[
                      { label: 'Pending', count: '05' },
                      { label: 'Sample collection', count: '06' },
                      { label: 'Processing', count: '08' },
                      { label: 'Completed', count: '06' },
                      { label: 'Delivered', count: '15' },
                    ].map((row) => (
                      <p key={row.label} className="text-[9px] text-[#7C7C7C] font-semibold flex justify-between">
                        <span>{row.label}</span>
                        <span className="font-extrabold text-[#2C3137]">{row.count}</span>
                      </p>
                    ))}
                  </div>
                  <div className="text-right self-end">
                    <span className="text-3xl font-extrabold text-[#2C3137] tracking-tight">40</span>
                    <p className="text-[10px] text-[#7C7C7C] font-semibold mt-1">Total</p>
                  </div>
                </div>
              </div>

              {/* Available Bed */}
              <div className="bg-[#FCFDFF] rounded-[24px] p-6 border border-white/50 shadow-md flex flex-col justify-between min-h-[160px] hover:shadow-lg transition-all">
                <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-3">
                  <span className="text-xs font-bold text-[#7C7C7C] uppercase tracking-wider">Available Bed</span>
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">Dynamic Status</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] text-[#7C7C7C] font-semibold">Cabin <span className="font-extrabold text-[#2C3137] ml-1">02</span></p>
                    <p className="text-[10px] text-[#7C7C7C] font-semibold">Bed <span className="font-extrabold text-[#2C3137] ml-1">03</span></p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-extrabold text-[#2C3137] tracking-tight">05</span>
                    <p className="text-[10px] text-[#7C7C7C] font-semibold mt-1">Total</p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 2. Outdoor Tab */}
          {activeTab === 'outdoor' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fade-in">
              {/* Appointments List */}
              <div className="xl:col-span-2 bg-[#FCFDFF] rounded-[24px] p-6 border border-white/50 shadow-md space-y-4">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <h3 className="text-base font-bold text-[#2C3137]">Hospital Appointments ({filteredAppointments.length})</h3>
                  <select
                    value={selectedDoctorFilter}
                    onChange={(e) => setSelectedDoctorFilter(e.target.value)}
                    className="p-1.5 rounded-lg border border-border bg-[#DAE3EE]/40 text-xs font-semibold"
                  >
                    <option value="">All Doctors</option>
                    {doctors.map(d => (
                      <option key={d._id} value={d._id}>Dr. {d.user?.firstName} {d.user?.lastName}</option>
                    ))}
                  </select>
                </div>

                <div className="overflow-x-auto">
                  {loadingAppointments ? (
                    <div className="flex items-center justify-center py-12 text-sm text-gray-500 gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#6AB8FF]" /> Loading appointments...
                    </div>
                  ) : filteredAppointments.length === 0 ? (
                    <p className="text-center py-10 text-xs text-[#7C7C7C] font-semibold">No appointments found.</p>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100 text-[#7C7C7C] font-bold uppercase text-[10px] tracking-wider">
                          <th className="pb-3 pr-2">Patient</th>
                          <th className="pb-3 pr-2">Doctor</th>
                          <th className="pb-3 pr-2">Time</th>
                          <th className="pb-3 pr-2">Payment</th>
                          <th className="pb-3 pr-2">Status</th>
                          <th className="pb-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAppointments.map((appt) => (
                          <tr key={appt._id} className="border-b border-gray-50 hover:bg-[#DAE3EE]/10">
                            <td className="py-3 pr-2 font-bold text-[#2C3137]">
                              {appt.patient?.firstName} {appt.patient?.lastName}
                            </td>
                            <td className="py-3 pr-2 font-semibold">
                              Dr. {appt.doctor?.user?.firstName} {appt.doctor?.user?.lastName}
                            </td>
                            <td className="py-3 pr-2 text-gray-500">
                              {new Date(appt.date).toLocaleDateString()} at {appt.timeSlot}
                            </td>
                            <td className="py-3 pr-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                appt.paymentStatus === 'Paid' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                              }`}>
                                {appt.paymentStatus}
                              </span>
                            </td>
                            <td className="py-3 pr-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                appt.status === 'Pending' ? 'bg-amber-50 text-amber-600' :
                                appt.status === 'Approved' ? 'bg-blue-50 text-blue-600' :
                                appt.status === 'CheckedIn' ? 'bg-indigo-50 text-indigo-600' :
                                'bg-green-50 text-green-600'
                              }`}>
                                {appt.status}
                              </span>
                            </td>
                            <td className="py-3 text-right space-x-1.5 whitespace-nowrap">
                              {appt.status === 'Pending' && (
                                <button
                                  onClick={() => handleUpdateAppointmentStatus(appt._id, 'Approved')}
                                  className="px-2 py-1 bg-[#6AB8FF] hover:bg-[#6AB8FF]/95 text-white rounded text-[10px] font-bold shadow-sm"
                                >
                                  Approve
                                </button>
                              )}
                              {appt.status === 'Approved' && appt.paymentStatus === 'Paid' && (
                                <button
                                  onClick={() => handleCheckIn(appt._id)}
                                  className="px-2 py-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded text-[10px] font-bold shadow-sm"
                                >
                                  Check In
                                </button>
                              )}
                              {appt.status !== 'Completed' && appt.status !== 'Cancelled' && (
                                <button
                                  onClick={() => handleUpdateAppointmentStatus(appt._id, 'Cancelled')}
                                  className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-[10px] font-bold"
                                >
                                  Cancel
                                </button>
                              )}
                              {appt.queueToken && (
                                <span className="font-bold text-[10px] bg-[#DAE3EE] px-2 py-0.5 rounded text-[#2C3137]">
                                  {appt.queueToken}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Live Queue state view */}
              <div className="bg-[#FCFDFF] rounded-[24px] p-6 border border-white/50 shadow-md flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <h3 className="text-base font-bold text-[#2C3137]">Live Queue Panel</h3>
                    <select
                      value={selectedDoctorForQueue}
                      onChange={(e) => {
                        setSelectedDoctorForQueue(e.target.value);
                        fetchDoctorQueue(e.target.value);
                      }}
                      className="p-1 rounded-lg border border-border bg-[#DAE3EE]/40 text-xs font-semibold max-w-[150px]"
                    >
                      {doctors.map(d => (
                        <option key={d._id} value={d._id}>Dr. {d.user?.firstName} {d.user?.lastName}</option>
                      ))}
                    </select>
                  </div>

                  {loadingQueue ? (
                    <div className="flex justify-center items-center py-10">
                      <Loader2 className="w-5 h-5 animate-spin text-[#CFA3F6]" />
                    </div>
                  ) : doctorQueue ? (
                    <div className="space-y-4 text-xs animate-fade-in">
                      <div className="grid grid-cols-2 gap-3 bg-[#DAE3EE]/30 p-3 rounded-2xl">
                        <div>
                          <p className="text-[10px] text-[#7C7C7C] font-semibold">Active Doctor</p>
                          <span className="font-bold text-[#2C3137]">
                            Dr. {doctors.find(d => d._id === selectedDoctorForQueue)?.user?.firstName || 'Doe'}
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#7C7C7C] font-semibold">Current Calling Token</p>
                          <span className="font-extrabold text-[#6AB8FF] text-sm">
                            {doctorQueue.currentToken || 'None'}
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#7C7C7C] font-semibold">Queue Status</p>
                          <span className="px-2 py-0.5 rounded font-bold bg-green-50 text-green-600 text-[10px]">
                            {doctorQueue.status}
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#7C7C7C] font-semibold">Estimated delay</p>
                          <span className="font-bold text-red-500">{doctorQueue.estimatedDelay} mins</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="font-bold text-[#7C7C7C] uppercase tracking-wider text-[10px] border-b pb-1">Queue Patients ({doctorQueue.patients?.length || 0})</p>
                        <div className="max-h-[150px] overflow-y-auto space-y-1.5 pr-1 scrollbar-none">
                          {(!doctorQueue.patients || doctorQueue.patients.length === 0) ? (
                            <p className="text-[#7C7C7C] italic py-2 text-center text-[11px]">No patients checked in yet today.</p>
                          ) : (
                            doctorQueue.patients.map((pat: any, index: number) => (
                              <div key={index} className="flex justify-between items-center p-2 border border-white/50 bg-[#FCFDFF] rounded-xl hover:bg-[#DAE3EE]/10">
                                <div>
                                  <p className="font-bold">{pat.user?.firstName} {pat.user?.lastName || 'Patient'}</p>
                                  <span className="text-[10px] text-gray-500">Token: <strong className="text-gray-700">{pat.token}</strong> • Pos: {pat.position}</span>
                                </div>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                  pat.status === 'Waiting' ? 'bg-amber-100 text-amber-700' :
                                  pat.status === 'In-Consultation' ? 'bg-indigo-100 text-indigo-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {pat.status}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center py-6 italic text-[#7C7C7C]">Please select a doctor to load the live queue details.</p>
                  )}
                </div>

                <button 
                  onClick={() => selectedDoctorForQueue && fetchDoctorQueue(selectedDoctorForQueue)}
                  className="mt-4 w-full py-2 bg-gradient-to-r from-[#6AB8FF] to-[#CFA3F6] hover:opacity-95 text-white font-bold rounded-xl shadow-sm text-xs flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh Queue State
                </button>
              </div>
            </div>
          )}

          {/* 3. Lab Module Tab */}
          {activeTab === 'lab' && (
            <div className="bg-[#FCFDFF] rounded-[24px] p-6 border border-white/50 shadow-md space-y-6 animate-fade-in">
              {/* Top stats info */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: 'Pending', count: labTests.filter(t => t.status === 'Pending').length, bg: 'bg-amber-50 text-amber-500' },
                  { label: 'Sample collection', count: labTests.filter(t => t.status === 'Sample collection').length, bg: 'bg-blue-50 text-blue-500' },
                  { label: 'Processing', count: labTests.filter(t => t.status === 'Processing').length, bg: 'bg-indigo-50 text-indigo-500' },
                  { label: 'Completed', count: labTests.filter(t => t.status === 'Completed').length, bg: 'bg-green-50 text-green-500' },
                  { label: 'Delivered', count: 15, bg: 'bg-emerald-50 text-emerald-500' },
                ].map((s, idx) => (
                  <div key={idx} className={`${s.bg} rounded-2xl p-4 text-center border border-white/40 shadow-sm flex flex-col justify-center`}>
                    <span className="text-2xl font-extrabold">{s.count < 10 ? `0${s.count}` : s.count}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider mt-1 text-gray-500">{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Lab search and table */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 border-b pb-3">
                  <h3 className="text-base font-bold text-[#2C3137]">Diagnostic Test Orders</h3>
                  <div className="relative w-full sm:w-64">
                    <input
                      type="text"
                      placeholder="Search patient or test..."
                      value={labSearch}
                      onChange={(e) => setLabSearch(e.target.value)}
                      className="w-full bg-[#DAE3EE]/40 border border-white/50 pl-8 pr-3 py-1.5 rounded-full text-xs font-semibold focus:outline-none"
                    />
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b text-gray-400 uppercase text-[10px] font-bold tracking-wider">
                        <th className="pb-2">Test ID</th>
                        <th className="pb-2">Patient</th>
                        <th className="pb-2">Test Name</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2">Results & Values</th>
                        <th className="pb-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {labTests
                        .filter(t => t.patientName.toLowerCase().includes(labSearch.toLowerCase()) || t.testName.toLowerCase().includes(labSearch.toLowerCase()))
                        .map((test) => (
                          <tr key={test.id} className="border-b hover:bg-[#DAE3EE]/5">
                            <td className="py-3 font-bold text-gray-600">{test.id}</td>
                            <td className="py-3 font-bold text-[#2C3137]">{test.patientName}</td>
                            <td className="py-3 font-semibold text-gray-700">{test.testName}</td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                test.status === 'Pending' ? 'bg-amber-50 text-amber-500' :
                                test.status === 'Processing' ? 'bg-indigo-50 text-indigo-500' :
                                'bg-green-50 text-green-500'
                              }`}>
                                {test.status}
                              </span>
                            </td>
                            <td className="py-3 text-gray-500 italic max-w-[200px] truncate">{test.result}</td>
                            <td className="py-3 text-right">
                              {editingLabId === test.id ? (
                                <div className="flex flex-col gap-1.5 items-end">
                                  <select
                                    value={editLabStatus}
                                    onChange={(e) => setEditLabStatus(e.target.value)}
                                    className="p-1 rounded border text-[10px] bg-white font-semibold"
                                  >
                                    <option value="Pending">Pending</option>
                                    <option value="Sample collection">Sample collection</option>
                                    <option value="Processing">Processing</option>
                                    <option value="Completed">Completed</option>
                                  </select>
                                  <input
                                    type="text"
                                    value={editLabResult}
                                    onChange={(e) => setEditLabResult(e.target.value)}
                                    placeholder="Enter result..."
                                    className="p-1 rounded border text-[10px] bg-white max-w-[140px]"
                                  />
                                  <div className="flex gap-1.5">
                                    <button 
                                      onClick={() => handleUpdateLabTest(test.id)}
                                      className="px-2 py-0.5 bg-green-500 hover:bg-green-600 text-white rounded text-[9px] font-bold"
                                    >
                                      Save
                                    </button>
                                    <button 
                                      onClick={() => setEditingLabId('')}
                                      className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-[9px] font-bold"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingLabId(test.id);
                                    setEditLabStatus(test.status);
                                    setEditLabResult(test.result);
                                  }}
                                  className="px-2 py-1 bg-[#DAE3EE] hover:bg-[#DAE3EE]/90 text-gray-700 rounded text-[10px] font-bold"
                                >
                                  Process & Edit
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 4. Prescription Tab (Gemini OCR) */}
          {activeTab === 'prescription' && (
            <div className="bg-[#FCFDFF] rounded-[24px] p-6 border border-white/50 shadow-md space-y-6 animate-fade-in">
              <div className="border-b pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-[#2C3137]">Prescription Handwriting OCR Reader</h3>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Powered by Google Gemini Vision. Upload a prescription image to extract medical instructions.</p>
                </div>
                <Activity className="w-5 h-5 text-[#CFA3F6]" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Upload Section */}
                <div className="space-y-4 flex flex-col justify-between">
                  <div className="border-2 border-dashed border-[#DAE3EE] hover:border-[#6AB8FF]/50 transition-all rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-3 bg-[#DAE3EE]/10 cursor-pointer min-h-[180px] relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <Upload className="w-8 h-8 text-[#7C7C7C]" />
                    <div>
                      <p className="text-xs font-bold text-gray-700">Choose prescription file or drag here</p>
                      <p className="text-[10px] text-gray-400 mt-1 font-semibold">Supports PNG, JPG, JPEG</p>
                    </div>
                  </div>

                  {ocrImageBase64 && (
                    <div className="p-3 bg-[#DAE3EE]/20 rounded-2xl flex items-center justify-between border">
                      <div className="flex items-center gap-2.5">
                        <img src={ocrImageBase64} alt="Preview" className="w-10 h-10 object-cover rounded-lg border shadow-sm" />
                        <span className="text-[11px] font-bold text-gray-700">Prescription image selected</span>
                      </div>
                      <button 
                        onClick={() => setOcrImageBase64('')}
                        className="text-[10px] text-red-500 hover:underline font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  <button
                    disabled={ocrLoading || !ocrImageBase64}
                    onClick={handleRunOcr}
                    className="w-full py-3 bg-gradient-to-r from-[#6AB8FF] to-[#CFA3F6] hover:opacity-95 text-white font-bold rounded-2xl shadow-sm text-xs disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {ocrLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Analyzing with Gemini Vision...
                      </>
                    ) : (
                      <>
                        <FileText className="w-3.5 h-3.5" />
                        Extract Prescription Details
                      </>
                    )}
                  </button>
                </div>

                {/* Results Section */}
                <div className="bg-[#DAE3EE]/20 rounded-3xl p-6 border border-white/30 flex flex-col justify-between min-h-[260px]">
                  <div>
                    <h4 className="text-xs font-extrabold text-[#7C7C7C] uppercase tracking-wider mb-3">Extracted Medicines & Dosage</h4>
                    {ocrLoading ? (
                      <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <Loader2 className="w-7 h-7 animate-spin text-[#6AB8FF]" />
                        <p className="text-[10px] text-gray-500 font-semibold animate-pulse">Parsing prescription handwriting structure...</p>
                      </div>
                    ) : ocrResult ? (
                      <div className="space-y-4">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                                <th className="pb-2">Medicine</th>
                                <th className="pb-2">Dosage</th>
                                <th className="pb-2">Timing</th>
                                <th className="pb-2">Duration</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Array.isArray(ocrResult.medicines) ? (
                                ocrResult.medicines.map((m: any, i: number) => (
                                  <tr key={i} className="border-b border-gray-100 hover:bg-[#DAE3EE]/10">
                                    <td className="py-1">
                                      <input
                                        type="text"
                                        value={m.name}
                                        onChange={(e) => updateOcrMedicineRow(i, 'name', e.target.value)}
                                        className="p-1.5 bg-transparent border-0 text-xs focus:ring-1 focus:ring-primary rounded font-bold text-[#2C3137] w-full"
                                      />
                                    </td>
                                    <td className="py-1">
                                      <input
                                        type="text"
                                        value={m.dosage}
                                        onChange={(e) => updateOcrMedicineRow(i, 'dosage', e.target.value)}
                                        className="p-1.5 bg-transparent border-0 text-xs focus:ring-1 focus:ring-primary rounded font-semibold text-gray-700 w-full"
                                      />
                                    </td>
                                    <td className="py-1">
                                      <input
                                        type="text"
                                        value={m.timing}
                                        onChange={(e) => updateOcrMedicineRow(i, 'timing', e.target.value)}
                                        className="p-1.5 bg-transparent border-0 text-xs focus:ring-1 focus:ring-primary rounded text-gray-500 w-full"
                                      />
                                    </td>
                                    <td className="py-1">
                                      <input
                                        type="text"
                                        value={m.duration}
                                        onChange={(e) => updateOcrMedicineRow(i, 'duration', e.target.value)}
                                        className="p-1.5 bg-transparent border-0 text-xs focus:ring-1 focus:ring-primary rounded font-semibold text-gray-500 w-full"
                                      />
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={4} className="py-3 text-center text-gray-500 font-medium italic">No structured medicines list found.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                        <div className="text-[10px] bg-[#FCFDFF] border p-3 rounded-2xl space-y-1.5">
                          <p className="font-bold text-gray-500">Instructions / Notes:</p>
                          <textarea
                            value={ocrResult.instructions || ''}
                            onChange={(e) => setOcrResult((prev: any) => ({ ...prev, instructions: e.target.value }))}
                            rows={2}
                            className="w-full p-2 border border-border rounded-xl bg-background text-xs"
                          />
                        </div>
                        <button
                          onClick={handleSaveOcrEdits}
                          className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                        >
                          Save Prescription Updates
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-16 text-gray-400 font-semibold flex flex-col items-center justify-center space-y-2">
                        <Eye className="w-6 h-6 text-gray-300" />
                        <p className="text-[11px]">Analysis results will be displayed here.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. App Users Tab */}
          {activeTab === 'users' && (
            <div className="bg-[#FCFDFF] rounded-[24px] p-6 border border-white/50 shadow-md space-y-6 animate-fade-in">
              <div className="border-b pb-3 flex justify-between items-center">
                <h3 className="text-base font-bold text-[#2C3137]">Hospital Users Directory</h3>
                {/* User type toggler */}
                <div className="bg-[#DAE3EE]/50 p-1 rounded-xl flex gap-1">
                  <button
                    onClick={() => setUserTabToggle('doctors')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      userTabToggle === 'doctors' ? 'bg-[#FCFDFF] text-[#2C3137] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Doctors Directory
                  </button>
                  <button
                    onClick={() => setUserTabToggle('patients')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      userTabToggle === 'patients' ? 'bg-[#FCFDFF] text-[#2C3137] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Patients List
                  </button>
                </div>
              </div>

              {/* Doctors Directory List */}
              {userTabToggle === 'doctors' && (
                <div className="overflow-x-auto">
                  {doctors.length === 0 ? (
                    <p className="text-center py-10 text-xs text-gray-500 font-semibold">No doctors found.</p>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b text-gray-400 uppercase text-[10px] font-bold tracking-wider">
                          <th className="pb-3 pr-2">Doctor Name</th>
                          <th className="pb-3 pr-2">Specialization</th>
                          <th className="pb-3 pr-2">Experience</th>
                          <th className="pb-3 pr-2">Fees (INR)</th>
                          <th className="pb-3 pr-2">Availability</th>
                          <th className="pb-3 pr-2">Contact Email</th>
                          <th className="pb-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {doctors.map((doc) => (
                          <tr key={doc._id} className="border-b hover:bg-[#DAE3EE]/5">
                            <td className="py-3 pr-2 font-bold text-[#2C3137]">
                              Dr. {doc.user?.firstName} {doc.user?.lastName}
                            </td>
                            <td className="py-3 pr-2 font-semibold text-gray-700">{doc.specialization}</td>
                            <td className="py-3 pr-2 text-gray-500">{doc.experience} years</td>
                            <td className="py-3 pr-2 font-bold text-gray-800">₹{doc.fees}</td>
                            <td className="py-3 pr-2">
                              <span className="text-[10px] bg-[#DAE3EE]/50 px-2 py-0.5 rounded text-gray-700 font-semibold">
                                {doc.availability?.filter((a: any) => a.isActive).map((a: any) => a.day).join(', ') || 'Varies'}
                              </span>
                            </td>
                            <td className="py-3 pr-2 text-gray-500 font-medium">{doc.user?.email || 'N/A'}</td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => handleStartEditDoctor(doc)}
                                className="px-2.5 py-1 bg-[#6AB8FF] hover:bg-[#6AB8FF]/95 text-white rounded-lg text-[10px] font-extrabold shadow-sm transition-all cursor-pointer"
                              >
                                Edit Profile
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Patients List (extracted from appointments) */}
              {userTabToggle === 'patients' && (
                <div className="overflow-x-auto">
                  {patientUsers.length === 0 ? (
                    <p className="text-center py-10 text-xs text-gray-500 font-semibold">No patient records in current sessions.</p>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b text-gray-400 uppercase text-[10px] font-bold tracking-wider">
                          <th className="pb-3 pr-2">Patient Name</th>
                          <th className="pb-3 pr-2">Email ID</th>
                          <th className="pb-3 pr-2">Phone Number</th>
                          <th className="pb-3">Unique Patient ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patientUsers.map((pat) => (
                          <tr key={pat._id} className="border-b hover:bg-[#DAE3EE]/5">
                            <td className="py-3 pr-2 font-bold text-[#2C3137]">
                              {pat.firstName} {pat.lastName}
                            </td>
                            <td className="py-3 pr-2 text-gray-700 font-medium">{pat.email}</td>
                            <td className="py-3 pr-2 text-gray-500">{pat.phone || 'Not Provided'}</td>
                            <td className="py-3 text-gray-500 font-bold tracking-mono text-[10px]">{pat._id}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 6. Master Data Tab */}
          {activeTab === 'master' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              {/* Hospital List */}
              <div className="bg-[#FCFDFF] rounded-[24px] p-6 border border-white/50 shadow-md space-y-4">
                <h3 className="text-base font-bold text-[#2C3137] border-b pb-2 flex items-center justify-between">
                  <span>Connected Hospital Profiles</span>
                  <Database className="w-4 h-4 text-[#6AB8FF]" />
                </h3>
                {hospitals.length === 0 ? (
                  <p className="text-center py-6 text-xs text-gray-400 font-semibold">No hospital registered.</p>
                ) : (
                  <div className="space-y-4">
                    {hospitals.map((h) => (
                      <div key={h._id} className="p-4 bg-[#DAE3EE]/20 rounded-2xl border border-white/50 text-xs space-y-2">
                        <div className="flex justify-between items-start">
                          <h4 className="font-extrabold text-sm text-[#2C3137]">{h.name}</h4>
                          <span className="px-2 py-0.5 rounded font-bold bg-[#6AB8FF]/10 text-[#6AB8FF] text-[9px]">ACTIVE</span>
                        </div>
                        <p className="text-gray-500 font-semibold">📍 Address: <strong className="text-[#2C3137]">{h.address}, {h.city}</strong></p>
                        <p className="text-gray-500 font-semibold">📞 Phone: <strong className="text-[#2C3137]">{h.phone}</strong></p>
                        <p className="text-gray-500 font-semibold">✉️ Email: <strong className="text-[#2C3137]">{h.email}</strong></p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Department Listing & Creator */}
              <div className="bg-[#FCFDFF] rounded-[24px] p-6 border border-white/50 shadow-md space-y-6">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-base font-bold text-[#2C3137]">Hospital Departments</h3>
                  <select
                    value={selectedHospitalForDept}
                    onChange={(e) => {
                      setSelectedHospitalForDept(e.target.value);
                      fetchDepartments(e.target.value);
                    }}
                    className="p-1 rounded-lg border text-xs font-semibold bg-[#DAE3EE]/40"
                  >
                    {hospitals.map(h => (
                      <option key={h._id} value={h._id}>{h.name}</option>
                    ))}
                  </select>
                </div>

                {/* Listing */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-[#7C7C7C] uppercase tracking-wider">Active Departments ({hospitalDepartments.length})</p>
                  {loadingDepts ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-4 h-4 animate-spin text-[#CFA3F6]" />
                    </div>
                  ) : hospitalDepartments.length === 0 ? (
                    <p className="text-xs text-gray-400 italic py-2">No departments found.</p>
                  ) : (
                    <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1 scrollbar-none">
                      {hospitalDepartments.map((dept) => (
                        <div key={dept._id} className="p-2.5 bg-[#DAE3EE]/20 rounded-xl border flex flex-col animate-fade-in">
                          <span className="font-bold text-xs text-[#2C3137]">{dept.name}</span>
                          <span className="text-[10px] text-gray-500 mt-0.5 leading-tight">{dept.description || 'No description provided.'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Creator Form */}
                <form onSubmit={handleCreateDepartment} className="space-y-3 pt-3 border-t">
                  <p className="text-[10px] font-bold text-[#7C7C7C] uppercase tracking-wider">Add New Department</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Cardiology"
                      value={newDeptName}
                      onChange={(e) => setNewDeptName(e.target.value)}
                      className="p-2 rounded-xl border border-white/60 bg-[#DAE3EE]/30 text-xs font-semibold focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Description..."
                      value={newDeptDesc}
                      onChange={(e) => setNewDeptDesc(e.target.value)}
                      className="p-2 rounded-xl border border-white/60 bg-[#DAE3EE]/30 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-gradient-to-r from-[#6AB8FF] to-[#CFA3F6] hover:opacity-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Department</span>
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Bottom Metadata stats info */}
      <footer className="z-10 relative flex flex-col sm:flex-row justify-between items-center text-[11px] text-[#7C7C7C] font-semibold pt-6 border-t border-white/20 gap-4">
        <div className="flex items-center gap-6">
          <span>Total Registered Doctors: <strong className="text-[#2C3137]">{doctorsCount}</strong></span>
          <span>Total Connected Hospitals: <strong className="text-[#2C3137]">{hospitalsCount}</strong></span>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
          <span className="font-extrabold text-[#2C3137]">Hospital ERP v1.0.0 • Admin Console</span>
          <span className="hidden sm:inline opacity-30">|</span>
          <span className="flex gap-4 font-bold text-[#6AB8FF]">
            <a href="#" className="hover:underline">Privacy</a>
            <a href="#" className="hover:underline">Terms</a>
            <a href="#" className="hover:underline">Support</a>
          </span>
        </div>
      </footer>

      {/* Admin Doctor Profile Editor Modal */}
      {editingDoctor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in select-none">
          <form 
            onSubmit={handleUpdateDoctorProfile}
            className="bg-[#FCFDFF] border border-white/50 rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-5 text-xs text-[#2C3137]"
          >
            <button 
              type="button"
              onClick={() => setEditingDoctor(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer"
            >
              ×
            </button>

            <div className="border-b pb-3">
              <h3 className="text-base font-extrabold text-[#2C3137]">Edit Doctor Profile</h3>
              <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                Update credentials for Dr. {editingDoctor.user?.firstName} {editingDoctor.user?.lastName}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#7C7C7C] mb-1.5 ml-1">Specialization</label>
                <input
                  type="text"
                  required
                  value={editDocSpecialization}
                  onChange={(e) => setEditDocSpecialization(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#6AB8FF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#7C7C7C] mb-1.5 ml-1">Experience (Years)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editDocExperience}
                    onChange={(e) => setEditDocExperience(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#6AB8FF]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#7C7C7C] mb-1.5 ml-1">Fees (INR)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editDocFees}
                    onChange={(e) => setEditDocFees(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#6AB8FF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#7C7C7C] mb-1.5 ml-1">Hospital Facility</label>
                  <select
                    value={editDocHospital}
                    onChange={(e) => handleHospitalChangeForEdit(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#6AB8FF] cursor-pointer"
                  >
                    {hospitals.map((h: any) => (
                      <option key={h._id} value={h._id}>{h.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#7C7C7C] mb-1.5 ml-1">Department</label>
                  <select
                    value={editDocDepartment}
                    onChange={(e) => setEditDocDepartment(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#6AB8FF] cursor-pointer"
                  >
                    {editDocDeptsList.map((d: any) => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#7C7C7C] mb-1.5 ml-1">Biography & Treatment Specialty</label>
                <textarea
                  required
                  value={editDocBio}
                  onChange={(e) => setEditDocBio(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#6AB8FF] resize-none"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button 
                type="button"
                onClick={() => setEditingDoctor(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl transition-all text-center cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 py-2.5 bg-gradient-to-r from-[#6AB8FF] to-[#CFA3F6] hover:opacity-95 text-white font-bold rounded-xl shadow-md transition-all text-center cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
