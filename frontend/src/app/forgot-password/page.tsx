'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      toast.success(response.data.message);
      setOtpSent(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to request reset OTP. Check email.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/reset-password', {
        email,
        otp: otpCode,
        newPassword,
      });

      toast.success(response.data.message);
      router.push('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#DAE3EE] text-[#2C3137] font-urbanist relative overflow-x-hidden p-4 md:p-8 flex items-center justify-center">
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

      <div className="w-full max-w-md bg-[#FCFDFF] border border-white/50 p-8 rounded-[32px] shadow-2xl z-10 relative space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-full bg-gradient-to-r from-[#6AB8FF] to-[#CFA3F6] flex items-center justify-center text-white font-bold text-xs">
              H
            </span>
            <span className="text-2xl font-extrabold text-[#2C3137]">HospitalAI</span>
          </Link>
          <p className="text-xs text-[#7C7C7C] font-semibold mt-1">
            {otpSent ? 'Reset your account password' : 'Recover your access credential'}
          </p>
        </div>

        {!otpSent ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#7C7C7C] mb-1.5 ml-3">
                Registered Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="patient@hospitalai.com"
                className="w-full px-5 py-3 rounded-full border border-white/60 bg-[#FCFDFF] text-[#2C3137] text-xs font-semibold placeholder-[#7C7C7C] focus:outline-none focus:ring-2 focus:ring-[#6AB8FF]/50 shadow-sm transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 font-bold text-white bg-gradient-to-r from-[#6AB8FF] to-[#CFA3F6] rounded-full text-xs shadow-md hover:scale-[1.01] transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Sending OTP...' : 'Send Reset Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#7C7C7C] mb-1.5 ml-3">
                6-Digit Reset Code (OTP)
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                className="w-full px-5 py-3 text-center tracking-widest font-extrabold text-sm rounded-full border border-white/60 bg-[#FCFDFF] text-[#2C3137] focus:outline-none focus:ring-2 focus:ring-[#6AB8FF]/50 shadow-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#7C7C7C] mb-1.5 ml-3">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-5 py-3 rounded-full border border-white/60 bg-[#FCFDFF] text-[#2C3137] text-xs font-semibold placeholder-[#7C7C7C] focus:outline-none focus:ring-2 focus:ring-[#6AB8FF]/50 shadow-sm transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 font-bold text-white bg-gradient-to-r from-[#6AB8FF] to-[#CFA3F6] rounded-full text-xs shadow-md hover:scale-[1.01] transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Resetting Password...' : 'Save New Password'}
            </button>

            <button
              type="button"
              onClick={() => setOtpSent(false)}
              className="w-full text-center text-xs text-[#7C7C7C] font-semibold hover:underline mt-2"
            >
              Request code again
            </button>
          </form>
        )}

        <p className="text-center text-xs text-[#7C7C7C] font-semibold mt-4">
          Remembered password?{' '}
          <Link href="/login" className="text-[#6AB8FF] hover:underline font-extrabold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
