import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import authService from '@/services/authService';

type Step = 'email' | 'reset' | 'done';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [localError, setLocalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ── Step 1: request reset OTP ────────────────────────────────────────────
  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!EMAIL_REGEX.test(email)) {
      setLocalError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      setStep('reset');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to send reset code');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2: verify OTP + set new password ────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (otp.length !== 6) {
      setLocalError('Please enter the 6-digit reset code');
      return;
    }
    if (newPassword.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(email, otp, newPassword);
      setStep('done');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4 relative">
      {/* Back button */}
      <button
        onClick={() => navigate('/login')}
        className="absolute left-6 top-6 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <ArrowLeft className="size-4 text-[#4a5565]" />
        <span className="font-medium text-sm text-[#4a5565]">Back to Login</span>
      </button>

      <div className="w-full max-w-md">
        <div className="bg-white border border-[#e5e7eb] rounded-2xl shadow-[0px_10px_15px_0px_rgba(0,0,0,0.1),0px_4px_6px_0px_rgba(0,0,0,0.1)] p-8">

          {/* ── Step 1: Enter email ── */}
          {step === 'email' && (
            <>
              <div className="flex flex-col items-center gap-2 mb-8">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-1">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <h1 className="font-semibold text-2xl text-[#101828] text-center">Forgot Password?</h1>
                <p className="text-sm text-[#4a5565] text-center">
                  Enter your email and we'll send you a reset code
                </p>
              </div>

              {localError && (
                <div className="flex items-start gap-3 p-4 mb-5 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-800">{localError}</p>
                </div>
              )}

              <form onSubmit={handleSendReset} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="font-medium text-sm text-[#364153]">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoFocus
                    className="w-full h-9 px-3 bg-white border border-[#d1d5dc] rounded-lg text-sm text-[#364153] placeholder:text-[#99a1af] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 bg-[#3b82f6] hover:bg-[#2563eb] disabled:bg-gray-400 text-white font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Sending...</>
                    : 'Send Reset Code'}
                </button>
              </form>
            </>
          )}

          {/* ── Step 2: Enter OTP + new password ── */}
          {step === 'reset' && (
            <>
              <div className="flex flex-col gap-2 mb-8">
                <h1 className="font-semibold text-2xl text-[#101828] text-center">Reset Password</h1>
                <p className="text-sm text-[#4a5565] text-center">
                  Enter the code sent to{' '}
                  <span className="font-semibold text-[#101828]">{email}</span>{' '}
                  and choose a new password
                </p>
              </div>

              {localError && (
                <div className="flex items-start gap-3 p-4 mb-5 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-800">{localError}</p>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="font-medium text-sm text-[#364153] text-center">
                    Reset Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    autoFocus
                    className="w-full h-14 px-3 text-center text-2xl font-bold tracking-[0.5em] bg-white border border-[#d1d5dc] rounded-lg text-[#364153] placeholder:text-[#99a1af] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
                    disabled={isLoading}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-medium text-sm text-[#364153]">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full h-9 px-3 bg-white border border-[#d1d5dc] rounded-lg text-sm text-[#364153] placeholder:text-[#99a1af] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
                    disabled={isLoading}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-medium text-sm text-[#364153]">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    className="w-full h-9 px-3 bg-white border border-[#d1d5dc] rounded-lg text-sm text-[#364153] placeholder:text-[#99a1af] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 bg-[#3b82f6] hover:bg-[#2563eb] disabled:bg-gray-400 text-white font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Resetting...</>
                    : 'Reset Password'}
                </button>
              </form>

              <div className="mt-5 text-center">
                <button
                  onClick={() => { setStep('email'); setLocalError(null); setOtp(''); }}
                  className="flex items-center gap-1 text-sm text-[#4a5565] hover:text-[#101828] mx-auto"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Use a different email
                </button>
              </div>
            </>
          )}

          {/* ── Step 3: Success ── */}
          {step === 'done' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="font-semibold text-2xl text-[#101828] text-center">Password Reset!</h1>
              <p className="text-sm text-[#4a5565] text-center">
                Your password has been updated. You can now sign in with your new password.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full h-10 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium text-sm rounded-lg transition-colors mt-2"
              >
                Sign In
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
