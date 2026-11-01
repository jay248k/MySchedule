import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Calendar,
  ArrowRight,
  Briefcase,
} from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, signup, demoLogin, isLoading } = useAuth();
  const { showToast } = useApp();

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'signup'

  // Input fields - clean & completely empty by default (no prefilled values)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (activeTab === 'login') {
      if (!email.trim()) {
        setErrorMsg('Please enter your email address');
        return;
      }
      if (!password) {
        setErrorMsg('Please enter your password');
        return;
      }

      setIsSubmitting(true);
      const res = await login(email.trim(), password);
      setIsSubmitting(false);

      if (res.success) {
        showToast({
          type: 'success',
          title: 'Welcome Back!',
          message: res.message || `Signed in as ${res.user?.name || 'User'}`,
        });
        navigate('/', { replace: true });
      } else {
        setErrorMsg(res.error || 'Invalid email or password');
      }
    } else {
      // Sign Up validation
      if (!name.trim()) {
        setErrorMsg('Please enter your full name');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setErrorMsg('Please enter a valid email address');
        return;
      }
      if (!password || password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long');
        return;
      }

      setIsSubmitting(true);
      const res = await signup({
        name: name.trim(),
        email: email.trim(),
        password,
        title: title.trim() || undefined,
      });
      setIsSubmitting(false);

      if (res.success) {
        showToast({
          type: 'success',
          title: 'Account Created!',
          message: res.message || `Welcome to MySchedule, ${res.user?.name}!`,
        });
        navigate('/', { replace: true });
      } else {
        setErrorMsg(res.error || 'Failed to create account');
      }
    }
  };

  const handleDemoLogin = async () => {
    setErrorMsg('');
    setIsSubmitting(true);
    const res = await demoLogin('admin@myschedule.app');
    setIsSubmitting(false);

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Demo Session Active',
        message: 'Loaded sample productivity workspace with full access!',
      });
      navigate('/', { replace: true });
    } else {
      setErrorMsg(res.error || 'Demo sign in failed. Please check backend connection.');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#070D18',
        backgroundImage: `
          radial-gradient(circle at 15% 20%, rgba(37, 99, 235, 0.12) 0%, transparent 40%),
          radial-gradient(circle at 85% 80%, rgba(16, 185, 129, 0.08) 0%, transparent 40%),
          radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0.6) 0%, transparent 100%)
        `,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        color: '#F8FAFC',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '28px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 12px 28px rgba(37, 99, 235, 0.35)',
            marginBottom: '14px',
            border: '1.5px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <Calendar size={28} color="#FFFFFF" />
        </div>
        <h1
          style={{
            fontSize: '1.85rem',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            margin: '0 0 4px',
            color: '#FFFFFF',
          }}
        >
          MySchedule
        </h1>
        <p
          style={{
            fontSize: '0.88rem',
            color: '#94A3B8',
            margin: 0,
            fontWeight: 500,
          }}
        >
          Plan • Focus • Achieve — Cloud Sync Across Web & Mobile
        </p>
      </div>

      {/* Main Authentication Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#0F172A',
          border: '1px solid #1E293B',
          borderRadius: '20px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          padding: '32px 28px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Tab Switcher: Sign In vs Create Account */}
        <div
          style={{
            display: 'flex',
            padding: '4px',
            backgroundColor: '#070D18',
            borderRadius: '12px',
            border: '1px solid #1E293B',
            marginBottom: '24px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMsg('');
            }}
            style={{
              flex: 1,
              padding: '9px 16px',
              borderRadius: '9px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              backgroundColor: activeTab === 'login' ? '#2563EB' : 'transparent',
              color: activeTab === 'login' ? '#FFFFFF' : '#94A3B8',
              boxShadow: activeTab === 'login' ? '0 4px 12px rgba(37, 99, 235, 0.35)' : 'none',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('signup');
              setErrorMsg('');
            }}
            style={{
              flex: 1,
              padding: '9px 16px',
              borderRadius: '9px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              backgroundColor: activeTab === 'signup' ? '#2563EB' : 'transparent',
              color: activeTab === 'signup' ? '#FFFFFF' : '#94A3B8',
              boxShadow: activeTab === 'signup' ? '0 4px 12px rgba(37, 99, 235, 0.35)' : 'none',
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert Banner */}
        {errorMsg && (
          <div
            style={{
              marginBottom: '20px',
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#F87171',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.84rem',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {activeTab === 'signup' && (
            <>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#CBD5E1',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Full Name <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <User
                    size={16}
                    color="#64748B"
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    required
                    style={{
                      width: '100%',
                      padding: '11px 12px 11px 38px',
                      backgroundColor: '#070D18',
                      border: '1px solid #334155',
                      borderRadius: '10px',
                      color: '#F8FAFC',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#CBD5E1',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Job Title / Focus (Optional)
                </label>
                <div style={{ position: 'relative' }}>
                  <Briefcase
                    size={16}
                    color="#64748B"
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Software Engineer / Student"
                    style={{
                      width: '100%',
                      padding: '11px 12px 11px 38px',
                      backgroundColor: '#070D18',
                      border: '1px solid #334155',
                      borderRadius: '10px',
                      color: '#F8FAFC',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#CBD5E1',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Email Address <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                color="#64748B"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                autoComplete="email"
                style={{
                  width: '100%',
                  padding: '11px 12px 11px 38px',
                  backgroundColor: '#070D18',
                  border: '1px solid #334155',
                  borderRadius: '10px',
                  color: '#F8FAFC',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#CBD5E1',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Password <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                color="#64748B"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
                style={{
                  width: '100%',
                  padding: '11px 40px 11px 38px',
                  backgroundColor: '#070D18',
                  border: '1px solid #334155',
                  borderRadius: '10px',
                  color: '#F8FAFC',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            style={{
              marginTop: '8px',
              padding: '12px 18px',
              backgroundColor: '#2563EB',
              border: 'none',
              borderRadius: '10px',
              color: '#FFFFFF',
              fontSize: '0.92rem',
              fontWeight: 700,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 6px 20px rgba(37, 99, 235, 0.4)',
              opacity: isSubmitting ? 0.7 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            {isSubmitting ? (
              'Authenticating...'
            ) : (
              <>
                <span>{activeTab === 'login' ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            margin: '22px 0',
            gap: '12px',
            color: '#64748B',
            fontSize: '0.78rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          <div style={{ flex: 1, height: '1px', backgroundColor: '#1E293B' }} />
          <span>OR</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#1E293B' }} />
        </div>

        {/* 1-Click Instant Demo Login (For users wanting to explore without creating credentials) */}
        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={isSubmitting || isLoading}
          style={{
            width: '100%',
            padding: '11px 16px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1.5px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '10px',
            color: '#34D399',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.18s ease',
          }}
        >
          <Sparkles size={16} />
          <span>Instant 1-Click Demo Sign In</span>
        </button>

        {/* Footer note */}
        <div
          style={{
            marginTop: '22px',
            textAlign: 'center',
            fontSize: '0.74rem',
            color: '#64748B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <ShieldCheck size={14} color="#10B981" />
          <span>Encrypted Cloud Sync • Neon DB PostgreSQL</span>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
