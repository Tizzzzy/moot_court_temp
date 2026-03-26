import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import svgPaths from '@/imports/svg-0oqyftyklw';
import { AlertCircle, Loader2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

async function checkUserHasCases(userId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/dashboard/${userId}/summary`);
    if (!res.ok) return false;
    const data = await res.json();
    return Array.isArray(data.cases) && data.cases.length > 0;
  } catch {
    return false;
  }
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, isLoading, error } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!username || !password) { setLocalError('Please fill in all fields'); return; }
    try {
      const result = await login({ username, password });
      const from = (location.state as any)?.from;
      if (from) {
        navigate(from);
      } else {
        const hasCases = await checkUserHasCases(result.user_id);
        navigate(hasCases ? `/dashboard/${result.user_id}` : '/');
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setIsGoogleLoading(true);
    setLocalError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: credentialResponse.credential }),
      });
      if (!response.ok) throw new Error('Google login failed');
      const data = await response.json();
      loginWithGoogle(data);
      const from = (location.state as any)?.from;
      if (from) {
        navigate(from);
      } else {
        const hasCases = await checkUserHasCases(data.user_id);
        navigate(hasCases ? `/dashboard/${data.user_id}` : '/');
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Google login failed');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setLocalError('Google login failed');
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4 relative">
      {/* Back to Home */}
      <button onClick={() => navigate('/')} className="absolute left-6 top-6 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
        <svg className="size-4" fill="none" viewBox="0 0 16 16">
          <path d={svgPaths.p203476e0} stroke="#4A5565" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M12.6667 8H3.33333" stroke="#4A5565" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </svg>
        <span className="font-medium text-sm text-[#4a5565]">Back to Home</span>
      </button>

      <div className="w-full max-w-md">
        <div className="bg-white border border-[#e5e7eb] rounded-2xl shadow-[0px_10px_15px_0px_rgba(0,0,0,0.1),0px_4px_6px_0px_rgba(0,0,0,0.1)] p-8">
          {/* Header */}
          <div className="flex flex-col gap-2 mb-8">
            <h1 className="font-semibold text-2xl text-[#101828] text-center">Welcome Back</h1>
            <p className="text-base text-[#4a5565] text-center">Continue your courtroom preparation</p>
          </div>

          {/* Error */}
          {(error || localError) && (
            <div className="flex items-start gap-3 p-4 mb-5 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{error || localError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Username */}
            <div className="flex flex-col gap-2">
              <label className="font-medium text-sm text-[#364153]">Username or Email</label>
              <div className="relative">
                <div className="absolute left-3 top-2 size-5">
                  <svg className="size-full" fill="none" viewBox="0 0 20 20">
                    <path d={svgPaths.pd919a80} stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                    <path d={svgPaths.p189c1170} stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                  </svg>
                </div>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-9 pl-10 pr-3 py-1 bg-white border border-[#d1d5dc] rounded-lg text-sm text-[#364153] placeholder:text-[#99a1af] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
                  required disabled={isLoading || isGoogleLoading} />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label className="font-medium text-sm text-[#364153]">Password</label>
              <div className="relative">
                <div className="absolute left-3 top-2 size-5">
                  <svg className="size-full" fill="none" viewBox="0 0 20 20">
                    <path d={svgPaths.p2566d000} stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                    <path d={svgPaths.p1bf79e00} stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                  </svg>
                </div>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-9 pl-10 pr-3 py-1 bg-white border border-[#d1d5dc] rounded-lg text-sm text-[#364153] placeholder:text-[#99a1af] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
                  required disabled={isLoading || isGoogleLoading} />
              </div>
            </div>

            {/* Remember Me & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
                  className="size-4 rounded border-gray-300" disabled={isLoading || isGoogleLoading} />
                <span className="font-medium text-sm text-[#4a5565]">Remember me</span>
              </label>
              <button type="button" className="font-medium text-sm text-[#155dfc] hover:underline" onClick={() => navigate('/forgot-password')} disabled={isLoading || isGoogleLoading}>
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button type="submit" disabled={isLoading || isGoogleLoading}
              className="w-full h-10 bg-[#3b82f6] hover:bg-[#2563eb] disabled:bg-gray-400 text-white font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2">
              {isLoading ? (<><Loader2 className="w-4 h-4 animate-spin" />Signing In</>) : 'Sign In'}
            </button>
          </form>

          {/* Sign Up link */}
          <p className="mt-6 text-center text-sm text-[#4a5565]">
            Don't have an account?{' '}
            <button onClick={() => navigate('/register')} className="font-semibold text-[#155dfc] hover:underline" disabled={isLoading || isGoogleLoading}>
              Sign Up
            </button>
          </p>

          {/* Divider */}
          {/* <div className="flex items-center gap-4 my-5">
            <div className="flex-1 h-px bg-[#e5e7eb]" />
            <span className="text-sm text-[#99a1af]">or</span>
            <div className="flex-1 h-px bg-[#e5e7eb]" />
          </div> */}

          {/* Google */}
          {/* <div className="w-full">
            {isGoogleLoading ? (
              <div className="w-full h-10 bg-white border border-[#d1d5dc] rounded-lg flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="font-medium text-sm text-[#364153]">Signing In</span>
              </div>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}
              />
            )}
          </div> */}
        </div>

        <p className="mt-6 text-center text-xs text-[#6a7282] px-8">
          By continuing, you agree to Pro Se Pro's Terms of Service and Privacy Policy. This is not legal advice.
        </p>
      </div>
    </div>
  );
};
