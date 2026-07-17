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

  // Fetch base data
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    fetchAppointments();
    fetchHospitals();
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
      <main className="flex-1 p-6 md:p-10 space-y-8 overflow-y-auto max-w-5xl mx-auto w-full">
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
    </div>
  );
}
