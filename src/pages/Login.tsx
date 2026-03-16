import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { Building2, User, Lock, KeyRound, ArrowLeft, CheckCircle, AlertCircle, Mail, ShieldCheck } from 'lucide-react';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'mfa' | 'changePassword' | 'forgotPassword'>('login');
  const [changePasswordData, setChangePasswordData] = useState({
    username: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [forgotPasswordData, setForgotPasswordData] = useState({
    username: '',
    email: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // MFA state
  const [mfaToken, setMfaToken] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(300);

  const { completeLogin, isAuthenticated } = useAuth();

  // Countdown timer for MFA
  useEffect(() => {
    if (mode !== 'mfa') return;
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [mode, countdown]);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const activePasswordData = mode === 'forgotPassword' ? forgotPasswordData : changePasswordData;

  const passwordValidation = {
    minLength: activePasswordData.newPassword.length >= 6,
    matches: activePasswordData.newPassword === activePasswordData.confirmPassword
             && activePasswordData.confirmPassword.length > 0,
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleChangePasswordInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setChangePasswordData(prev => ({ ...prev, [name]: value }));
    if (message) setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await authAPI.login(formData.username, formData.password);

      if (result.mfaRequired && result.mfaToken && result.maskedEmail) {
        setMfaToken(result.mfaToken);
        setMaskedEmail(result.maskedEmail);
        setCountdown(300);
        setOtpCode('');
        setMessage(null);
        setMode('mfa');
      } else {
        setMessage({ type: 'error', text: 'Invalid username or password.' });
      }
    } catch (error: any) {
      const data = error.response?.data;
      if (data?.code === 'ACCOUNT_LOCKED') {
        setMessage({
          type: 'error',
          text: 'Your account is currently locked. Please contact your Administrator.',
        });
      } else {
        setMessage({ type: 'error', text: 'Invalid username or password.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await authAPI.verifyMfa(mfaToken, otpCode);

      if (result.success && result.token && result.user) {
        completeLogin(result.token, result.user);
      } else {
        setMessage({ type: 'error', text: result.message || 'Invalid verification code' });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Verification failed. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendMfa = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await authAPI.resendMfa(mfaToken);

      if (result.success && result.mfaToken) {
        setMfaToken(result.mfaToken);
        setCountdown(300);
        setOtpCode('');
        setMessage({ type: 'success', text: 'New verification code sent to your email.' });
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to resend code' });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to resend code. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!passwordValidation.minLength) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters long' });
      return;
    }
    if (!passwordValidation.matches) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (changePasswordData.newPassword === changePasswordData.currentPassword) {
      setMessage({ type: 'error', text: 'New password must be different from current password' });
      return;
    }

    setIsLoading(true);

    try {
      const result = await authAPI.changePassword(
        changePasswordData.username,
        changePasswordData.currentPassword,
        changePasswordData.newPassword,
      );

      if (result.success) {
        setMessage({ type: 'success', text: 'Password changed successfully. You can now log in with your new password.' });
        setChangePasswordData({ username: '', currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => {
          setMode('login');
          setMessage(null);
        }, 3000);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to change password' });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'An error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForgotPasswordData(prev => ({ ...prev, [name]: value }));
    if (message) setMessage(null);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!passwordValidation.minLength) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters long' });
      return;
    }
    if (!passwordValidation.matches) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    setIsLoading(true);

    try {
      const result = await authAPI.forgotPassword(
        forgotPasswordData.username,
        forgotPasswordData.email,
        forgotPasswordData.newPassword,
      );

      if (result.success) {
        setMessage({ type: 'success', text: 'Password reset successfully. You can now log in with your new password.' });
        setForgotPasswordData({ username: '', email: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => {
          setMode('login');
          setMessage(null);
        }, 3000);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to reset password' });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'An error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const switchToChangePassword = () => {
    setMode('changePassword');
    setMessage(null);
    setChangePasswordData({ username: '', currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const switchToForgotPassword = () => {
    setMode('forgotPassword');
    setMessage(null);
    setForgotPasswordData({ username: '', email: '', newPassword: '', confirmPassword: '' });
  };

  const switchToLogin = () => {
    setMode('login');
    setMessage(null);
  };

  const modeTitle = () => {
    if (mode === 'login') return 'Management Portal';
    if (mode === 'mfa') return 'Verify Your Identity';
    if (mode === 'changePassword') return 'Change Password';
    return 'Forgot Password';
  };

  const modeSubtitle = () => {
    if (mode === 'login') return 'Enterprise Database System';
    if (mode === 'mfa') return 'Enter the code sent to your email';
    if (mode === 'changePassword') return 'Update your account password';
    return 'Reset your account password';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl border border-gray-200">
          {/* Header */}
          <div className="p-8 text-center">
            <div className="mx-auto w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
              {mode === 'mfa' ? (
                <ShieldCheck className="w-6 h-6 text-white" />
              ) : (
                <Building2 className="w-6 h-6 text-white" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">BICS</h1>
            <h2 className="text-lg font-semibold text-blue-600 mb-2">{modeTitle()}</h2>
            <p className="text-sm text-gray-600">{modeSubtitle()}</p>
          </div>

          {/* Form */}
          <div className="px-8 pb-8">
            {mode === 'login' ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                      Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="username"
                        name="username"
                        type="text"
                        required
                        value={formData.username}
                        onChange={handleChange}
                        disabled={isLoading}
                        placeholder="Enter your username"
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        disabled={isLoading}
                        placeholder="Enter your password"
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {message && (
                  <div className={`flex items-start space-x-2 p-3 rounded-md text-sm ${
                    message.type === 'error'
                      ? 'bg-red-50 border border-red-200 text-red-700'
                      : 'bg-green-50 border border-green-200 text-green-700'
                  }`}>
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{message.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Authenticating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>SIGN IN</span>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  )}
                </button>

                <div className="text-center space-x-4">
                  <button
                    type="button"
                    onClick={switchToChangePassword}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Change Password
                  </button>
                  <button
                    type="button"
                    onClick={switchToForgotPassword}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
              </form>

            ) : mode === 'mfa' ? (
              <form onSubmit={handleVerifyMfa} className="space-y-6">
                {/* Email info */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-700 flex items-start space-x-2">
                  <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>A 6-digit code was sent to <strong>{maskedEmail}</strong></span>
                </div>

                <div>
                  <label htmlFor="otpCode" className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    id="otpCode"
                    name="otpCode"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    required
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    disabled={isLoading || countdown <= 0}
                    placeholder="Enter 6-digit code"
                    className="block w-full px-4 py-3 text-center text-2xl font-bold tracking-widest border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  />
                </div>

                {/* Countdown */}
                <div className="text-center text-sm">
                  {countdown > 0 ? (
                    <span className={countdown <= 60 ? 'text-red-500 font-medium' : 'text-gray-500'}>
                      Code expires in {formatCountdown(countdown)}
                    </span>
                  ) : (
                    <span className="text-red-500 font-medium">Code has expired. Please resend.</span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otpCode.length !== 6 || countdown <= 0}
                  className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    <span>VERIFY CODE</span>
                  )}
                </button>

                <div className="text-center space-x-4">
                  <button
                    type="button"
                    onClick={handleResendMfa}
                    disabled={isLoading}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline disabled:opacity-50"
                  >
                    Resend Code
                  </button>
                  <button
                    type="button"
                    onClick={switchToLogin}
                    className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 hover:underline"
                  >
                    <ArrowLeft className="h-3 w-3 mr-1" />
                    Back to Sign In
                  </button>
                </div>

                {message && (
                  <div className={`flex items-center space-x-2 p-3 rounded-md text-sm ${
                    message.type === 'success'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {message.type === 'success' ? (
                      <CheckCircle className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    )}
                    <span>{message.text}</span>
                  </div>
                )}
              </form>

            ) : mode === 'changePassword' ? (
              <form onSubmit={handleChangePassword} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="cp-username" className="block text-sm font-medium text-gray-700 mb-2">
                      Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="cp-username"
                        name="username"
                        type="text"
                        required
                        value={changePasswordData.username}
                        onChange={handleChangePasswordInput}
                        disabled={isLoading}
                        placeholder="Enter your username"
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="cp-currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="cp-currentPassword"
                        name="currentPassword"
                        type="password"
                        required
                        value={changePasswordData.currentPassword}
                        onChange={handleChangePasswordInput}
                        disabled={isLoading}
                        placeholder="Enter your current password"
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="cp-newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <KeyRound className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="cp-newPassword"
                        name="newPassword"
                        type="password"
                        required
                        value={changePasswordData.newPassword}
                        onChange={handleChangePasswordInput}
                        disabled={isLoading}
                        placeholder="Enter your new password"
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="cp-confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <KeyRound className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="cp-confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        value={changePasswordData.confirmPassword}
                        onChange={handleChangePasswordInput}
                        disabled={isLoading}
                        placeholder="Confirm your new password"
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {changePasswordData.newPassword.length > 0 && (
                    <div className="space-y-1 text-xs">
                      <p className={passwordValidation.minLength ? 'text-green-600' : 'text-red-500'}>
                        {passwordValidation.minLength ? '\u2713' : '\u2717'} At least 6 characters
                      </p>
                      {changePasswordData.confirmPassword.length > 0 && (
                        <p className={passwordValidation.matches ? 'text-green-600' : 'text-red-500'}>
                          {passwordValidation.matches ? '\u2713' : '\u2717'} Passwords match
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {message && (
                  <div className={`flex items-center space-x-2 p-3 rounded-md text-sm ${
                    message.type === 'success'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {message.type === 'success' ? (
                      <CheckCircle className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    )}
                    <span>{message.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !passwordValidation.minLength || !passwordValidation.matches}
                  className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Changing Password...</span>
                    </div>
                  ) : (
                    <span>CHANGE PASSWORD</span>
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={switchToLogin}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Sign In
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="fp-username" className="block text-sm font-medium text-gray-700 mb-2">
                      Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="fp-username"
                        name="username"
                        type="text"
                        required
                        value={forgotPasswordData.username}
                        onChange={handleForgotPasswordInput}
                        disabled={isLoading}
                        placeholder="Enter your username"
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="fp-email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="fp-email"
                        name="email"
                        type="email"
                        required
                        value={forgotPasswordData.email}
                        onChange={handleForgotPasswordInput}
                        disabled={isLoading}
                        placeholder="Enter your registered email"
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="fp-newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <KeyRound className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="fp-newPassword"
                        name="newPassword"
                        type="password"
                        required
                        value={forgotPasswordData.newPassword}
                        onChange={handleForgotPasswordInput}
                        disabled={isLoading}
                        placeholder="Enter your new password"
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="fp-confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <KeyRound className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="fp-confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        value={forgotPasswordData.confirmPassword}
                        onChange={handleForgotPasswordInput}
                        disabled={isLoading}
                        placeholder="Confirm your new password"
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {forgotPasswordData.newPassword.length > 0 && (
                    <div className="space-y-1 text-xs">
                      <p className={passwordValidation.minLength ? 'text-green-600' : 'text-red-500'}>
                        {passwordValidation.minLength ? '\u2713' : '\u2717'} At least 6 characters
                      </p>
                      {forgotPasswordData.confirmPassword.length > 0 && (
                        <p className={passwordValidation.matches ? 'text-green-600' : 'text-red-500'}>
                          {passwordValidation.matches ? '\u2713' : '\u2717'} Passwords match
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {message && (
                  <div className={`flex items-center space-x-2 p-3 rounded-md text-sm ${
                    message.type === 'success'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {message.type === 'success' ? (
                      <CheckCircle className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    )}
                    <span>{message.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !passwordValidation.minLength || !passwordValidation.matches}
                  className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Resetting Password...</span>
                    </div>
                  ) : (
                    <span>RESET PASSWORD</span>
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={switchToLogin}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-4 mb-2">
            <div className="h-px w-16 bg-gray-300"></div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide"></span>
            <div className="h-px w-16 bg-gray-300"></div>
          </div>
          <p className="text-xs text-gray-400">

          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
