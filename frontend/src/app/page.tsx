'use client';

import React from 'react';
import Link from 'next/link';
import { Search, Bell, Settings, ChevronDown, Activity, ShieldAlert, Sparkles, LogIn, UserPlus } from 'lucide-react';

export default function Home() {
  return (
    <div className="h-screen w-screen bg-[#DAE3EE] text-[#2C3137] font-urbanist relative overflow-hidden p-6 md:p-10 space-y-8 flex flex-col justify-between select-none">
      {/* Import Urbanist Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Urbanist:wght@300;400;500;600;700;800&display=swap');
        .font-urbanist {
          font-family: 'Urbanist', sans-serif;
        }
      `}</style>

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
            {[...Array(25)].map((_, i) => {
              const x = 50 + i * 50;
              const y1 = 300 + Math.sin(x * 0.01) * 70;
              const y2 = 300 - Math.sin(x * 0.01) * 70;
              return (
                <line
                  key={i}
                  x1={x}
                  y1={y1}
                  x2={x}
                  y2={y2}
                  stroke="url(#dnaGrad1)"
                  strokeWidth="2"
                  opacity="0.3"
                />
              );
            })}
          </svg>
        </div>

        {/* Top Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 relative">
          {/* Logo Branding */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#6AB8FF] to-[#CFA3F6] flex items-center justify-center text-white font-bold text-lg shadow-md">
              H
            </div>
            <div>
              <p className="text-sm font-extrabold leading-tight text-[#2C3137]">HospitalAI</p>
              <p className="text-[10px] text-[#7C7C7C] font-semibold">Smart Queue. Better Care.</p>
            </div>
          </div>

          {/* Central Title */}
          <div className="text-center hidden md:block">
            <h1 className="text-xl font-extrabold tracking-wide text-[#2C3137]">HOSPITAL ERP</h1>
            <p className="text-[10px] text-[#7C7C7C] font-semibold tracking-wider">Hospital & Laboratory Management System</p>
          </div>

          {/* Actions / Auth Links */}
          <div className="flex items-center gap-3 self-end md:self-auto">
            <Link
              href="/login"
              className="flex items-center gap-2 bg-[#FCFDFF] hover:bg-[#FCFDFF]/90 transition-all px-5 py-2.5 rounded-full text-xs font-bold border border-white/40 shadow-sm text-[#2C3137]"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </Link>

            <Link
              href="/register"
              className="flex items-center gap-2 bg-gradient-to-r from-[#6AB8FF] to-[#CFA3F6] text-white px-6 py-2.5 rounded-full text-xs font-bold shadow-md hover:opacity-95 transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up</span>
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center text-center space-y-6 z-10 relative max-w-4xl mx-auto">


          {/* Hero Heading */}
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.15] text-[#2C3137]">
            Smart Queue.{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#6AB8FF] to-[#CFA3F6]">
              Better Care.
            </span>
          </h2>

          {/* Hero Subtitle */}
          <p className="text-xs sm:text-sm text-[#7C7C7C] font-semibold max-w-2xl leading-relaxed">
            HospitalAI modernizes healthcare visits. Experience automated check-ins, accurate waiting time forecasts, AI symptom triage, and seamless digital prescriptions.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md">
            <Link
              href="/register"
              className="px-8 py-3 font-bold text-white bg-gradient-to-r from-[#6AB8FF] to-[#CFA3F6] rounded-full text-xs shadow-md hover:scale-[1.02] transition-all text-center"
            >
              Get Started (Patient)
            </Link>
            <Link
              href="/login"
              className="px-8 py-3 font-bold text-[#2C3137] bg-[#FCFDFF] hover:bg-[#FCFDFF]/90 rounded-full text-xs shadow-sm border border-white/50 hover:scale-[1.02] transition-all text-center"
            >
              Hospital Staff Portal
            </Link>
          </div>
        </main>

        {/* Feature Highlights Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 z-10 relative">
          {/* AI Triage System */}
          <div className="bg-[#FCFDFF] rounded-[24px] p-6 border border-white/50 shadow-md flex flex-col justify-between hover:shadow-lg transition-all space-y-2">
            <div className="flex justify-between items-start border-b border-gray-100 pb-2">
              <span className="text-[10px] font-bold text-[#7C7C7C] uppercase tracking-wider">AI Triage System</span>
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-[#2C3137] mb-1">Smart Assessment</h4>
              <p className="text-[10px] text-[#7C7C7C] leading-relaxed font-semibold">
                Describe symptoms naturally. Our AI automatically maps you to the best department, recommends doctors, and predicts triage priority instantly.
              </p>
            </div>
          </div>

          {/* Live Queue Prediction */}
          <div className="bg-[#FCFDFF] rounded-[24px] p-6 border border-white/50 shadow-md flex flex-col justify-between hover:shadow-lg transition-all space-y-2">
            <div className="flex justify-between items-start border-b border-gray-100 pb-2">
              <span className="text-[10px] font-bold text-[#7C7C7C] uppercase tracking-wider">Live Queue Prediction</span>
              <Activity className="w-3.5 h-3.5 text-[#CFA3F6]" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-[#2C3137] mb-1">Real-time Wait Times</h4>
              <p className="text-[10px] text-[#7C7C7C] leading-relaxed font-semibold">
                Track waiting lists in real-time. Know your exact token number, position, and dynamic estimated waiting time update at home or on-site.
              </p>
            </div>
          </div>

          {/* Prescription OCR */}
          <div className="bg-[#FCFDFF] rounded-[24px] p-6 border border-white/50 shadow-md flex flex-col justify-between hover:shadow-lg transition-all space-y-2">
            <div className="flex justify-between items-start border-b border-gray-100 pb-2">
              <span className="text-[10px] font-bold text-[#7C7C7C] uppercase tracking-wider">Prescription OCR</span>
              <ShieldAlert className="w-3.5 h-3.5 text-[#6AB8FF]" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-[#2C3137] mb-1">Digitize Handwriting</h4>
              <p className="text-[10px] text-[#7C7C7C] leading-relaxed font-semibold">
                Upload prescription images. Our AI reads handwriting, extracts medicines, dosage, and schedules automatic reminders directly in your app.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="z-10 relative flex flex-col sm:flex-row justify-between items-center text-[10px] text-[#7C7C7C] font-semibold pt-4 border-t border-white/20 gap-2">
          <div>
            <p>&copy; {new Date().getFullYear()} HospitalAI Inc. All rights reserved.</p>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Terms of Service</a>
            <a href="#" className="hover:underline">Support</a>
          </div>
        </footer>
    </div>
  );
}
