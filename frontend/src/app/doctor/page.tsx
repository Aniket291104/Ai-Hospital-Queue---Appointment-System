'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import io from 'socket.io-client';
import toast from 'react-hot-toast';
import { ChevronDown, Bell, Settings, Search, Activity, ShieldAlert, LogOut, Play, Pause, Square, Clock, Users, UserCheck } from 'lucide-react';

export default function DoctorDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const [queue, setQueue] = useState<any>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [delay, setDelay] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'Doctor') {
      router.push('/login');
      return;
    }

    fetchDoctorProfile();
  }, [user]);

  useEffect(() => {
    if (!doctorId) return;

    fetchQueue();

    const socket = io('http://localhost:5000');
    socket.on(`queue-update-${doctorId}`, (updatedQueue) => {
      setQueue(updatedQueue);
    });

    return () => {
      socket.disconnect();
    };
  }, [doctorId]);

  const fetchDoctorProfile = async () => {
    try {
      const response = await api.get('/doctors');
      const doctorProfile = response.data.data.find((d: any) => d.user?._id === user?.id);
      if (doctorProfile) {
        setDoctorId(doctorProfile._id);
        setDelay(doctorProfile.estimatedDelay || 0);
      } else {
        toast.error('Doctor profile record not found');
      }
    } catch (err) {
      toast.error('Failed to fetch doctor profile');
    }
  };

  const fetchQueue = async () => {
    if (!doctorId) return;
    try {
      const response = await api.get(`/queues/doctor/${doctorId}`);
      setQueue(response.data.data);
    } catch (err) {
      console.error('Failed to fetch queue');
    }
  };

  const handleNext = async () => {
    if (!doctorId) return;
    setLoading(true);
    try {
      await api.post(`/queues/doctor/${doctorId}/next`);
      toast.success('Called the next patient in line!');
      fetchQueue();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error calling next patient');
    } finally {
      setLoading(false);
    }
  };

  const handleDelayUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId) return;
    try {
      await api.put(`/queues/doctor/${doctorId}/status`, { estimatedDelay: delay });
      toast.success(`Estimated delay updated to ${delay} minutes.`);
      fetchQueue();
    } catch (err) {
      toast.error('Failed to update delay');
    }
  };

  const handleStatusUpdate = async (status: 'Active' | 'Paused' | 'Ended') => {
    if (!doctorId) return;
    try {
      await api.put(`/queues/doctor/${doctorId}/status`, { status });
      toast.success(`Queue status updated to ${status}`);
      fetchQueue();
    } catch (err) {
      toast.error('Failed to update queue status');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const waitingPatients = queue?.patients?.filter((p: any) => p.status === 'Waiting') || [];
  const inConsultation = queue?.patients?.find((p: any) => p.status === 'In-Consultation');

  return (
    <div className="min-h-screen bg-[#DAE3EE] text-[#2C3137] font-urbanist relative overflow-x-hidden p-4 md:p-8 flex items-center justify-center">
      {/* Main Container simulating the Monitor/UI window */}
      <div className="w-full max-w-[1380px] bg-[#DAE3EE] rounded-[32px] overflow-hidden relative border border-white/30 shadow-2xl p-6 md:p-10 space-y-8 min-h-[90vh] flex flex-col justify-between">
        
        {/* DNA Helix Background SVG */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.35] z-0 flex items-center justify-center overflow-hidden">
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
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 relative">
          {/* User Profile */}
          <div className="relative">
            <button 
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-3 bg-[#FCFDFF] hover:bg-[#FCFDFF]/90 transition-all px-4 py-2 rounded-full border border-white/40 shadow-sm"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#6AB8FF] to-[#CFA3F6] flex items-center justify-center text-white font-bold text-sm">
                {user?.firstName?.[0] || 'D'}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold leading-tight">Dr. {user?.firstName}</p>
                <p className="text-[10px] text-[#7C7C7C] font-semibold">Doctor Portal</p>
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
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search"
                className="bg-[#FCFDFF] pl-9 pr-4 py-2 rounded-full text-xs font-semibold text-[#2C3137] placeholder-[#7C7C7C] border border-white/50 focus:outline-none w-40 sm:w-56 shadow-sm transition-all"
              />
              <Search className="w-4 h-4 text-[#7C7C7C] absolute left-3" />
            </div>

            <button className="p-2.5 bg-[#FCFDFF] hover:bg-[#FCFDFF]/90 transition-all rounded-full border border-white/40 shadow-sm relative">
              <Bell className="w-4 h-4 text-[#2C3137]" />
            </button>

            <button className="p-2.5 bg-[#FCFDFF] hover:bg-[#FCFDFF]/90 transition-all rounded-full border border-white/40 shadow-sm">
              <Settings className="w-4 h-4 text-[#2C3137]" />
            </button>
          </div>
        </header>

        {/* Dashboard Title Panel */}
        <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 z-10 relative">
          <div>
            <p className="text-sm text-[#7C7C7C] font-semibold">Welcome back, Dr. {user?.firstName}!</p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#2C3137] mt-1">Today's Patient Queue</h2>
          </div>
        </section>

        {/* Doctor Dashboard Modules */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 z-10 relative items-start">
          {/* Main Queue Panels */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Active Consultation Panel */}
            <div className="bg-[#FCFDFF] rounded-[24px] p-6 border border-white/50 shadow-md flex flex-col justify-between min-h-[220px] hover:shadow-lg transition-all">
              <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-4">
                <span className="text-xs font-bold text-[#7C7C7C] uppercase tracking-wider">Currently in Consultation</span>
                <UserCheck className="w-4 h-4 text-[#6AB8FF]" />
              </div>
              <div className="flex-1 flex flex-col justify-center">
                {inConsultation ? (
                  <div className="space-y-2">
                    <span className="text-xs bg-[#6AB8FF]/10 text-[#6AB8FF] font-extrabold px-3 py-1 rounded-full">
                      Token {inConsultation.token}
                    </span>
                    <h3 className="text-2xl font-extrabold text-[#2C3137] mt-2">
                      {inConsultation.user?.firstName} {inConsultation.user?.lastName}
                    </h3>
                    <p className="text-xs text-[#7C7C7C] font-semibold">
                      Checked in at: {new Date(inConsultation.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-[#7C7C7C] font-semibold py-4 text-center">No active patient at the moment.</p>
                )}
              </div>
              <button
                onClick={handleNext}
                disabled={loading || waitingPatients.length === 0}
                className="w-full mt-6 py-3.5 bg-gradient-to-r from-[#6AB8FF] to-[#CFA3F6] text-white font-bold rounded-full text-xs shadow-md hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Call Next Token'}
              </button>
            </div>

            {/* Waiting List */}
            <div className="bg-[#FCFDFF] rounded-[24px] p-6 border border-white/50 shadow-md hover:shadow-lg transition-all space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="text-sm font-extrabold text-[#2C3137]">Waiting Queue ({waitingPatients.length})</h3>
                <Users className="w-4 h-4 text-[#CFA3F6]" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-[#7C7C7C] font-bold border-b border-gray-100">
                      <th className="py-3 px-2">Token</th>
                      <th className="py-3 px-2">Patient</th>
                      <th className="py-3 px-2">Check-in Time</th>
                      <th className="py-3 px-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waitingPatients.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-[#7C7C7C] font-semibold text-xs">
                          No patients waiting in queue.
                        </td>
                      </tr>
                    ) : (
                      waitingPatients.map((p: any) => (
                        <tr key={p._id} className="border-b border-gray-50 hover:bg-gray-50/50 font-semibold text-[#2C3137]">
                          <td className="py-3 px-2 font-extrabold text-[#6AB8FF]">{p.token}</td>
                          <td className="py-3 px-2">{p.user?.firstName} {p.user?.lastName}</td>
                          <td className="py-3 px-2 text-[#7C7C7C]">
                            {new Date(p.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-3 px-2 text-right">
                            <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-amber-50 text-amber-500 uppercase tracking-wide">
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Controls Side Panel */}
          <div className="space-y-6">
            
            {/* Queue State Controls */}
            <div className="bg-[#FCFDFF] rounded-[24px] p-6 border border-white/50 shadow-md hover:shadow-lg transition-all space-y-4">
              <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-2">
                <span className="text-xs font-bold text-[#7C7C7C] uppercase tracking-wider">Queue Controls</span>
                <span className="text-[10px] bg-blue-50 text-[#6AB8FF] px-2 py-0.5 rounded-full font-bold uppercase">
                  {queue?.status || 'Active'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleStatusUpdate('Active')}
                  className={`py-2 px-1 text-[10px] font-bold rounded-full border transition-all flex items-center justify-center gap-1.5 ${
                    queue?.status === 'Active'
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                      : 'border-white/60 bg-[#FCFDFF] text-[#2C3137] hover:bg-gray-50'
                  }`}
                >
                  <Play className="w-2.5 h-2.5" />
                  Resume
                </button>
                <button
                  onClick={() => handleStatusUpdate('Paused')}
                  className={`py-2 px-1 text-[10px] font-bold rounded-full border transition-all flex items-center justify-center gap-1.5 ${
                    queue?.status === 'Paused'
                      ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                      : 'border-white/60 bg-[#FCFDFF] text-[#2C3137] hover:bg-gray-50'
                  }`}
                >
                  <Pause className="w-2.5 h-2.5" />
                  Pause
                </button>
                <button
                  onClick={() => handleStatusUpdate('Ended')}
                  className={`py-2 px-1 text-[10px] font-bold rounded-full border transition-all flex items-center justify-center gap-1.5 ${
                    queue?.status === 'Ended'
                      ? 'bg-red-500 border-red-500 text-white shadow-sm'
                      : 'border-white/60 bg-[#FCFDFF] text-[#2C3137] hover:bg-gray-50'
                  }`}
                >
                  <Square className="w-2.5 h-2.5" />
                  End
                </button>
              </div>
            </div>

            {/* Delay Settings */}
            <div className="bg-[#FCFDFF] rounded-[24px] p-6 border border-white/50 shadow-md hover:shadow-lg transition-all space-y-4">
              <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-2">
                <span className="text-xs font-bold text-[#7C7C7C] uppercase tracking-wider">Report Delay</span>
                <Clock className="w-4 h-4 text-[#CFA3F6]" />
              </div>
              <form onSubmit={handleDelayUpdate} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#7C7C7C] mb-1.5 ml-3">
                    Estimated Delay (Minutes)
                  </label>
                  <input
                    type="number"
                    value={delay}
                    onChange={(e) => setDelay(Number(e.target.value))}
                    min={0}
                    className="w-full px-5 py-3 rounded-full border border-white/60 bg-[#FCFDFF] text-[#2C3137] text-xs font-bold text-center placeholder-[#7C7C7C] focus:outline-none focus:ring-2 focus:ring-[#6AB8FF]/50 shadow-sm transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 px-4 font-bold text-[#2C3137] bg-[#FCFDFF] border border-white/60 hover:bg-gray-50 rounded-full text-xs shadow-sm transition-all"
                >
                  Update Waiting Times
                </button>
              </form>
            </div>

          </div>
        </section>

        {/* Footer */}
        <footer className="z-10 relative flex flex-col sm:flex-row justify-between items-center text-[11px] text-[#7C7C7C] font-semibold pt-6 border-t border-white/20 gap-2">
          <div>
            <span>Hospital ERP v1.0.0 • Doctor Console</span>
          </div>
          <div>
            <span>Smart Queue. Better Care.</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
