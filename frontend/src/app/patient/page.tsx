'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import io from 'socket.io-client';
import toast from 'react-hot-toast';

export default function PatientDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [selectedHospital, setSelectedHospital] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');

  // AI Triage
  const [symptoms, setSymptoms] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRec, setAiRec] = useState<any>(null);

  // Chatbot
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  // QR Check-in Mock
  const [qrOpen, setQrOpen] = useState(false);
  const [activeAppointmentId, setActiveAppointmentId] = useState<string | null>(null);

  // Specialists Directory States
  const [allDoctors, setAllDoctors] = useState<any[]>([]);
  const [searchDoctorQuery, setSearchDoctorQuery] = useState('');
  const [selectedDetailDoctor, setSelectedDetailDoctor] = useState<any>(null);

  // Fetch base data
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    fetchAppointments();
    fetchHospitals();
    fetchAllDoctors();
  }, [user]);

  // Socket for live queue updates
  useEffect(() => {
    const socket = io('http://localhost:5000');

    appointments.forEach((appt) => {
      if (appt.status === 'CheckedIn' && appt.doctor?._id) {
        socket.on(`queue-update-${appt.doctor._id}`, (updatedQueue) => {
          // Find patient position inside updated queue patients array
          const queueUser = updatedQueue.patients.find((p: any) => p.user === user?.id);
          if (queueUser) {
            toast.success(`Queue position updated! You are now position: ${queueUser.position}`);
            fetchAppointments(); // Refresh positions and waiting times
          }
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [appointments]);

  const fetchAppointments = async () => {
    try {
      const response = await api.get('/appointments');
      setAppointments(response.data.data);
    } catch (err) {
      console.error('Failed to fetch appointments');
    }
  };

  const fetchHospitals = async () => {
    try {
      const response = await api.get('/hospitals');
      setHospitals(response.data.data);
    } catch (err) {
      console.error('Failed to fetch hospitals');
    }
  };

  const fetchAllDoctors = async () => {
    try {
      const response = await api.get('/doctors');
      setAllDoctors(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch all doctors');
    }
  };

  const selectDoctorFromDirectory = async (doc: any) => {
    setSelectedHospital(doc.hospital?._id || '');
    setSelectedDepartment(doc.department?._id || '');
    
    try {
      const deptRes = await api.get(`/hospitals/${doc.hospital?._id}/departments`);
      setDepartments(deptRes.data.data || []);
      
      const docRes = await api.get(`/doctors?hospital=${doc.hospital?._id}&department=${doc.department?._id}`);
      setDoctors(docRes.data.data || []);
      
      setSelectedDoctor(doc._id);
      toast.success(`Selected Dr. ${doc.user?.firstName} in booking form!`);
    } catch (err) {
      toast.error('Failed to prefill booking details');
    }
  };

  const handleHospitalChange = async (hospitalId: string) => {
    setSelectedHospital(hospitalId);
    setSelectedDepartment('');
    setSelectedDoctor('');
    try {
      const response = await api.get(`/hospitals/${hospitalId}/departments`);
      setDepartments(response.data.data);
    } catch (err) {
      console.error('Failed to fetch departments');
    }
  };

  const handleDepartmentChange = async (deptId: string) => {
    setSelectedDepartment(deptId);
    setSelectedDoctor('');
    try {
      const response = await api.get(`/doctors?hospital=${selectedHospital}&department=${deptId}`);
      setDoctors(response.data.data);
    } catch (err) {
      console.error('Failed to fetch doctors');
    }
  };

  const handleTriage = async () => {
    if (!symptoms) return;
    setAiLoading(true);
    try {
      const response = await api.post('/ai/triage', { symptoms });
      setAiRec(response.data.data);
      toast.success('AI Triage recommendation loaded!');
    } catch (err) {
      toast.error('AI Triage request failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/appointments', {
        doctorId: selectedDoctor,
        hospitalId: selectedHospital,
        departmentId: selectedDepartment,
        date,
        timeSlot,
        symptoms,
      });
      toast.success('Appointment booked successfully!');
      fetchAppointments();
      // Reset form
      setSelectedHospital('');
      setDepartments([]);
      setDoctors([]);
      setDate('');
      setTimeSlot('');
      setSymptoms('');
      setAiRec(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Booking failed');
    }
  };

  const handlePayment = async (apptId: string) => {
    try {
      const orderRes = await api.post('/payments/order', {
        appointmentId: apptId,
        amount: 500,
      });

      // Verify payment immediately (Mock simulation)
      await api.post('/payments/verify', {
        razorpayOrderId: orderRes.data.orderId,
      });

      toast.success('Payment completed successfully!');
      fetchAppointments();
    } catch (err) {
      toast.error('Payment processing failed');
    }
  };

  const handleCheckIn = async (apptId: string) => {
    try {
      await api.post('/queues/check-in', { appointmentId: apptId });
      toast.success('Checked in successfully! You are now in the live queue.');
      fetchAppointments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Check-in failed');
    }
  };

  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const newHistory = [...chatHistory, { role: 'user', content: chatMessage }];
    setChatHistory(newHistory);
    setChatMessage('');
    setChatLoading(true);

    try {
      const response = await api.post('/ai/chat', {
        message: chatMessage,
        history: newHistory,
      });
      setChatHistory([...newHistory, { role: 'model', content: response.data.data }]);
    } catch (err) {
      toast.error('Chat bot failed to reply');
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border p-6 flex flex-col justify-between hidden md:flex">
        <div>
          <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500 mb-8">
            HospitalAI
          </div>
          <nav className="space-y-2">
            <button className="w-full text-left px-4 py-2.5 rounded-lg bg-primary/10 text-primary font-semibold text-sm">
              Dashboard
            </button>
            <button onClick={() => setChatOpen(true)} className="w-full text-left px-4 py-2.5 rounded-lg hover:bg-secondary text-sm">
              AI Chat Assistant
            </button>
          </nav>
        </div>
        <div>
          <div className="text-xs text-muted mb-4">Logged in as {user?.firstName}</div>
          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="w-full py-2 border border-border hover:bg-red-500/10 hover:text-red-500 text-sm font-semibold rounded-lg transition-all"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 flex flex-col min-h-screen overflow-y-auto max-w-5xl mx-auto w-full">
        <div className="flex-grow space-y-8">
          {/* Welcome Banner */}
          <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Welcome, {user?.firstName}!</h1>
            <p className="text-muted text-sm mt-1">Smart Queue. Better Care.</p>
          </div>
          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="md:hidden py-1 px-3 border border-border hover:bg-red-500/10 hover:text-red-500 text-xs font-semibold rounded-lg"
          >
            Logout
          </button>
        </header>

        {/* Live Queue status cards for patient */}
        {appointments.some((appt) => appt.status === 'CheckedIn') && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {appointments
              .filter((appt) => appt.status === 'CheckedIn')
              .map((appt) => (
                <div key={appt._id} className="p-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-blue-100">Live Consultation</p>
                      <h4 className="font-bold text-lg">Dr. {appt.doctor?.user?.firstName} {appt.doctor?.user?.lastName}</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-white/20 text-xs uppercase font-bold tracking-wider">
                      {appt.queueToken}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t border-white/20 pt-4">
                    <div>
                      <span className="text-[10px] text-blue-100 block">Queue Position</span>
                      <span className="text-2xl font-bold">{appt.queuePosition}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-blue-100 block">Est. Wait Time</span>
                      <span className="text-2xl font-bold">{appt.estimatedWaitingTime}m</span>
                    </div>
                  </div>
                </div>
              ))}
          </section>
        )}

        {/* Medical Specialists Directory */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-xl font-bold text-[#2C3137]">Featured Medical Specialists</h3>
              <p className="text-xs text-muted-foreground font-semibold">Browse our clinical experts, specializations, and availability slots</p>
            </div>
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Search specialists by name or department..."
                value={searchDoctorQuery}
                onChange={(e) => setSearchDoctorQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
              />
              <span className="absolute left-3 top-2 text-muted-foreground text-xs">🔍</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allDoctors
              .filter((d: any) => 
                !searchDoctorQuery ||
                `${d.user?.firstName} ${d.user?.lastName}`.toLowerCase().includes(searchDoctorQuery.toLowerCase()) ||
                d.specialization?.toLowerCase().includes(searchDoctorQuery.toLowerCase()) ||
                d.department?.name?.toLowerCase().includes(searchDoctorQuery.toLowerCase())
              )
              .map((d: any) => (
                <div key={d._id} className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                          {d.user?.firstName?.[0] || 'D'}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-[#2C3137]">Dr. {d.user?.firstName} {d.user?.lastName}</h4>
                          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-[#6AB8FF] text-[9px] font-extrabold uppercase tracking-wide">
                            {d.specialization}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-amber-500">⭐ {d.rating || '4.8'}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {d.bio || 'Experienced consultant specialist dedicated to patient health and welfare.'}
                    </p>
                  </div>

                  <div className="border-t border-border/60 pt-3 flex flex-wrap gap-2 text-[10px] font-bold text-muted-foreground">
                    <span className="bg-secondary/40 px-2 py-1 rounded-md">💼 {d.experience} Yrs Exp</span>
                    <span className="bg-secondary/40 px-2 py-1 rounded-md">💳 INR {d.fees}</span>
                    <span className="bg-secondary/40 px-2 py-1 rounded-md">🏥 {d.hospital?.name}</span>
                  </div>

                  <button 
                    onClick={() => setSelectedDetailDoctor(d)}
                    className="w-full py-2 bg-[#6AB8FF]/10 hover:bg-[#6AB8FF] text-[#6AB8FF] hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    View Detailing & Schedule
                  </button>
                </div>
              ))}
          </div>
        </section>

        {/* Appointment Booking Panel */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Booking Form */}
          <div className="bg-card border border-border p-6 rounded-2xl space-y-4 shadow-sm">
            <h3 className="text-xl font-bold mb-2">Book Appointment</h3>

            {/* AI Triage Help */}
            <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-blue-500 uppercase tracking-wide">AI Triage Symptom Advisor</label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Describe your symptoms: e.g. I have fever, body aches and a bad headache since morning."
                rows={2}
                className="w-full p-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleTriage}
                disabled={aiLoading}
                className="py-1.5 px-3 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-semibold disabled:opacity-50"
              >
                {aiLoading ? 'Analyzing...' : 'Get AI Recommendation'}
              </button>

              {aiRec && (
                <div className="bg-background border border-border/80 p-3 rounded-lg text-xs space-y-1.5 mt-2 animate-fade-in">
                  <p><strong>Department:</strong> {aiRec.recommendedDepartment}</p>
                  <p><strong>Priority:</strong> <span className="font-bold text-red-500">{aiRec.priority}</span></p>
                  <p className="text-muted leading-relaxed"><strong>Reason:</strong> {aiRec.reasoning}</p>
                </div>
              )}
            </div>

            <form onSubmit={handleBook} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">Select Hospital</label>
                <select
                  required
                  value={selectedHospital}
                  onChange={(e) => handleHospitalChange(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-border bg-background text-sm"
                >
                  <option value="">Choose Hospital</option>
                  {hospitals.map((h) => (
                    <option key={h._id} value={h._id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedHospital && (
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1.5">Select Department</label>
                  <select
                    required
                    value={selectedDepartment}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-border bg-background text-sm"
                  >
                    <option value="">Choose Department</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedDepartment && (
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1.5">Select Doctor</label>
                  <select
                    required
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-border bg-background text-sm"
                  >
                    <option value="">Choose Doctor</option>
                    {doctors.map((d) => (
                      <option key={d._id} value={d._id}>
                        Dr. {d.user?.firstName} {d.user?.lastName} (INR {d.fees})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1.5">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-border bg-background text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1.5">Time Slot</label>
                  <select
                    required
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-border bg-background text-sm"
                  >
                    <option value="">Slot</option>
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="12:00 PM">12:00 PM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="03:00 PM">03:00 PM</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg shadow-sm hover:bg-primary/95 transition-all cursor-pointer"
              >
                Confirm Booking
              </button>
            </form>
          </div>

          {/* Booked Appointments Listing */}
          <div className="bg-card border border-border p-6 rounded-2xl space-y-4 shadow-sm flex flex-col">
            <h3 className="text-xl font-bold mb-2">My Bookings</h3>
            <div className="flex-1 overflow-y-auto space-y-3 max-h-[450px] pr-2">
              {appointments.length === 0 ? (
                <p className="text-sm text-muted text-center py-10">No bookings yet.</p>
              ) : (
                appointments.map((appt) => (
                  <div key={appt._id} className="p-4 border border-border/80 rounded-xl bg-background/50 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold text-muted">
                          {new Date(appt.date).toLocaleDateString()} at {appt.timeSlot}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] rounded font-bold uppercase tracking-wider ${
                          appt.status === 'Pending' ? 'bg-amber-500/10 text-amber-500' :
                          appt.status === 'Approved' ? 'bg-blue-500/10 text-blue-500' :
                          appt.status === 'CheckedIn' ? 'bg-indigo-500/10 text-indigo-500' :
                          'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {appt.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm mt-1">
                        Dr. {appt.doctor?.user?.firstName} {appt.doctor?.user?.lastName}
                      </h4>
                      <p className="text-xs text-muted mt-0.5">{appt.hospital?.name} • {appt.department?.name}</p>
                    </div>

                    <div className="flex gap-2 justify-end border-t border-border/40 pt-3">
                      {appt.paymentStatus === 'Pending' && (
                        <button
                          onClick={() => handlePayment(appt._id)}
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded cursor-pointer"
                        >
                          Pay INR 500
                        </button>
                      )}
                      {appt.paymentStatus === 'Paid' && appt.status === 'Approved' && (
                        <button
                          onClick={() => handleCheckIn(appt._id)}
                          className="px-3 py-1 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded cursor-pointer"
                        >
                          Check In
                        </button>
                      )}
                      {appt.paymentStatus === 'Paid' && (
                        <a
                          href={`http://localhost:5000/api/payments/invoice/${appt._id}`}
                          className="px-3 py-1 border border-border hover:bg-secondary text-xs font-semibold rounded text-center"
                        >
                          Invoice PDF
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
        </div>

        {/* Footer */}
        <footer className="w-full flex flex-col sm:flex-row justify-between items-center text-xs text-muted-foreground pt-6 border-t border-border gap-4 mt-8">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <span className="font-extrabold text-[#2C3137]">Hospital ERP v1.0.0 • Patient Console</span>
            <span className="hidden sm:inline opacity-30">|</span>
            <span className="font-semibold">&copy; {new Date().getFullYear()} HospitalAI Inc.</span>
          </div>
          <div className="flex gap-6 font-bold text-[#6AB8FF]">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Terms of Service</a>
            <a href="#" className="hover:underline">Support</a>
          </div>
        </footer>
      </main>

      {/* Floating Chat Box */}
      {chatOpen ? (
        <div className="fixed bottom-6 right-6 w-96 bg-card border border-border shadow-2xl rounded-2xl flex flex-col overflow-hidden z-50">
          <div className="p-4 bg-primary text-primary-foreground font-bold flex justify-between items-center">
            <span>AI Health Assistant</span>
            <button onClick={() => setChatOpen(false)} className="text-white hover:text-white/80 font-bold">×</button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[300px] max-h-[400px]">
            <p className="text-[10px] text-muted italic bg-secondary p-2 rounded">
              Disclaimer: Not medical advice. For triage & guidance only.
            </p>
            {chatHistory.map((ch, i) => (
              <div key={i} className={`flex ${ch.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-2.5 rounded-lg text-sm max-w-[80%] leading-relaxed ${
                  ch.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-secondary text-foreground rounded-tl-none'
                }`}>
                  {ch.content}
                </div>
              </div>
            ))}
            {chatLoading && <div className="text-xs text-muted">Assistant typing...</div>}
          </div>
          <form onSubmit={sendChatMessage} className="p-3 border-t border-border flex gap-2">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Ask anything about health or departments..."
              className="flex-1 p-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button type="submit" className="py-2 px-3 bg-primary text-primary-foreground font-semibold rounded-lg text-sm">Send</button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all text-2xl cursor-pointer"
        >
          💬
        </button>
      )}

      {/* Doctor Deep Detailing Modal */}
      {selectedDetailDoctor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-lg w-full shadow-2xl relative space-y-6">
            <button 
              onClick={() => setSelectedDetailDoctor(null)}
              className="absolute top-4 right-4 text-muted hover:text-foreground text-xl font-bold cursor-pointer"
            >
              ×
            </button>

            <div className="flex gap-4 items-start border-b border-border pb-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xl">
                {selectedDetailDoctor.user?.firstName?.[0] || 'D'}
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-foreground">
                  Dr. {selectedDetailDoctor.user?.firstName} {selectedDetailDoctor.user?.lastName}
                </h3>
                <p className="text-xs text-blue-500 font-bold uppercase tracking-wider">
                  {selectedDetailDoctor.specialization} • {selectedDetailDoctor.department?.name}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-amber-500 font-bold">⭐ {selectedDetailDoctor.rating || '4.8'}</span>
                  <span className="text-muted-foreground opacity-60">|</span>
                  <span className="text-muted-foreground font-semibold">{selectedDetailDoctor.reviewsCount || '18'} Patient Reviews</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-xs leading-relaxed">
              <div className="space-y-1.5">
                <h5 className="font-extrabold text-[#7C7C7C] uppercase tracking-wider text-[10px]">Medical Biography</h5>
                <p className="text-muted-foreground font-medium">
                  {selectedDetailDoctor.bio || 'Dedicated medical consultant with extensive training and clinical practice history in advanced symptom management.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-secondary/50 p-3.5 rounded-2xl border border-border/40">
                <div>
                  <span className="text-[10px] text-muted-foreground font-semibold block">Experience</span>
                  <span className="font-bold text-foreground">{selectedDetailDoctor.experience} Years Practice</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground font-semibold block">Consultation Fee</span>
                  <span className="font-bold text-foreground">INR {selectedDetailDoctor.fees}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground font-semibold block">Hospital Facility</span>
                  <span className="font-bold text-foreground">{selectedDetailDoctor.hospital?.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground font-semibold block">Average Visit Time</span>
                  <span className="font-bold text-foreground">{selectedDetailDoctor.averageConsultationTime || '15'} Minutes</span>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="font-extrabold text-[#7C7C7C] uppercase tracking-wider text-[10px]">Availability & Schedule</h5>
                <div className="space-y-1.5 max-h-28 overflow-y-auto">
                  {selectedDetailDoctor.availability && selectedDetailDoctor.availability.length > 0 ? (
                    selectedDetailDoctor.availability.map((slot: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center bg-background border p-2 rounded-lg font-semibold">
                        <span className="text-foreground">{slot.day}</span>
                        <span className="text-blue-500 font-bold">{slot.startTime} - {slot.endTime}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground italic text-center py-2">No active availability slots.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button 
                onClick={() => selectDoctorFromDirectory(selectedDetailDoctor)}
                className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-md hover:opacity-95 transition-all text-center cursor-pointer"
              >
                Choose This Specialist to Book
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
