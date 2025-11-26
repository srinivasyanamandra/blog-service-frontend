import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui/button';

export const Login: React.FC = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpResent, setOtpResent] = useState(false);

  const { login, signup, verifyOtp, resendOtp, pendingEmail, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignup && !showOtpVerification) {
        if (!name) {
          setError('Name is required');
          setLoading(false);
          return;
        }
        await signup(name, email, password);
        setShowOtpVerification(true);
      } else if (showOtpVerification) {
        if (!otp) {
          setError('OTP is required');
          setLoading(false);
          return;
        }
        // Default OTP verification stores session-only token (not remember across sessions)
        await verifyOtp(email, otp, rememberMe);
        navigate('/dashboard');
      } else {
        const response = await login(email, password, rememberMe);
        // If server requests re-verification, show OTP flow
        if (response && response.isVerified === false) {
          setShowOtpVerification(true);
          if (response.message) setError(response.message);
          setEmail(response.email || email);
          setLoading(false);
          return;
        }
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      await resendOtp(email);
      setOtpResent(true);
      setTimeout(() => setOtpResent(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (pendingEmail) {
      setEmail(pendingEmail);
    }
  }, [pendingEmail]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#521a5b] via-[#6b2278] to-[#521a5b] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo className="text-white" />
          </div>
          <p className="text-white/80 text-sm">
            {isSignup ? 'Create your author account' : 'Welcome back to your blog'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            {showOtpVerification ? 'Verify Email' : isSignup ? 'Sign Up' : 'Log In'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {otpResent && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
              OTP resent successfully!
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {showOtpVerification ? (
              <>
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                    6-Digit OTP
                  </label>
                  <input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#521a5b] focus:border-transparent outline-none transition text-center text-2xl tracking-widest"
                    placeholder="000000"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Check your email for the verification code{pendingEmail ? ` (${pendingEmail})` : ''}
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-[#521a5b] hover:bg-[#6b2278] text-white py-2.5 rounded-lg font-semibold transition duration-200"
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </Button>

                <div className="flex items-center justify-between mt-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-[#521a5b] border-gray-300 rounded focus:ring-[#521a5b]"
                    />
                    <span className="ml-2 text-sm text-gray-600">Remember me</span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="w-full text-sm text-[#521a5b] hover:underline transition"
                >
                  Resend OTP
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowOtpVerification(false);
                    setOtp('');
                    setError('');
                  }}
                  className="w-full text-sm text-gray-600 hover:text-gray-800 transition"
                >
                  Back to Sign Up
                </button>
              </>
            ) : (
              <>
                {isSignup && (
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#521a5b] focus:border-transparent outline-none transition"
                      placeholder="Enter your name"
                      required={isSignup}
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#521a5b] focus:border-transparent outline-none transition"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#521a5b] focus:border-transparent outline-none transition"
                    placeholder="Enter your password (min 6 chars)"
                    required
                  />
                </div>

                {!isSignup && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 text-[#521a5b] border-gray-300 rounded focus:ring-[#521a5b]"
                      />
                      <span className="ml-2 text-sm text-gray-600">Remember me</span>
                    </label>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#521a5b] hover:bg-[#6b2278] text-white py-2.5 rounded-lg font-semibold transition duration-200"
                >
                  {loading ? 'Processing...' : isSignup ? 'Create Account' : 'Log In'}
                </Button>
              </>
            )}
          </form>

          {!showOtpVerification && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignup(!isSignup);
                  setError('');
                  setName('');
                  setEmail('');
                  setPassword('');
                }}
                className="text-sm text-gray-600 hover:text-[#521a5b] transition"
              >
                {isSignup ? (
                  <>
                    Already have an account? <span className="font-semibold">Log In</span>
                  </>
                ) : (
                  <>
                    First time here? <span className="font-semibold">Sign Up</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-white/60 text-xs mt-6">
          By continuing, you agree to PranuBlogs' Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};
