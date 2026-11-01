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

  // Input fields - clean & completely empty by default
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
        setErrorMsg('Please enter email');
        return;
      }
      if (!password) {
        setErrorMsg('Please enter password');
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
      if (!name.trim()) {
        setErrorMsg('Please enter name');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setErrorMsg('Please enter email');
        return;
      }
      if (!password || password.length < 6) {
        setErrorMsg('Password must be at least 6 characters');
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
        height: '100vh',
        maxHeight: '100vh',
        width: '100vw',
        overflow: 'hidden',
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
        padding: '16px',
        boxSizing: 'border-box',
        color: '#F8FAFC',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Main Compact Authentication Card (Fits 100% inside screen, zero scroll) */}
      <div
        style={{
          width: '100%',
          maxWidth: '390px',
          backgroundColor: '#0F172A',
          border: '1px solid #1E293B',
          borderRadius: '16px',
          boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          padding: '22px 24px',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {/* Compact Brand Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            marginBottom: '14px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 16px rgba(37, 99, 235, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              flexShrink: 0,
            }}
          >
            <Calendar size={18} color="#FFFFFF" />
          </div>
          <div>
            <h1
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                margin: 0,
                color: '#FFFFFF',
                lineHeight: 1.2,
              }}
            >
              MySchedule
            </h1>
            <p
              style={{
                fontSize: '0.74rem',
                color: '#94A3B8',
                margin: 0,
                fontWeight: 500,
              }}
            >
              Plan • Focus • Achieve
            </p>
          </div>
        </div>

        {/* Tab Switcher: Sign In vs Create Account */}
        <div
          style={{
            display: 'flex',
            padding: '3px',
            backgroundColor: '#070D18',
            borderRadius: '10px',
            border: '1px solid #1E293B',
            marginBottom: '14px',
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
              padding: '7px 12px',
              borderRadius: '7px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              backgroundColor: activeTab === 'login' ? '#2563EB' : 'transparent',
              color: activeTab === 'login' ? '#FFFFFF' : '#94A3B8',
              boxShadow: activeTab === 'login' ? '0 2px 8px rgba(37, 99, 235, 0.35)' : 'none',
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
              padding: '7px 12px',
              borderRadius: '7px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              backgroundColor: activeTab === 'signup' ? '#2563EB' : 'transparent',
              color: activeTab === 'signup' ? '#FFFFFF' : '#94A3B8',
              boxShadow: activeTab === 'signup' ? '0 2px 8px rgba(37, 99, 235, 0.35)' : 'none',
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert Banner */}
        {errorMsg && (
          <div
            style={{
              marginBottom: '12px',
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#F87171',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.78rem',
            }}
          >
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
          {activeTab === 'signup' && (
            <>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: '#CBD5E1',
                    marginBottom: '4px',
                  }}
                >
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User
                    size={15}
                    color="#64748B"
                    style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter name"
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 34px',
                      backgroundColor: '#070D18',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                      fontSize: '0.84rem',
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
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: '#CBD5E1',
                    marginBottom: '4px',
                  }}
                >
                  Role (Optional)
                </label>
                <div style={{ position: 'relative' }}>
                  <Briefcase
                    size={15}
                    color="#64748B"
                    style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter role"
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 34px',
                      backgroundColor: '#070D18',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                      fontSize: '0.84rem',
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
                fontSize: '0.74rem',
                fontWeight: 700,
                color: '#CBD5E1',
                marginBottom: '4px',
              }}
            >
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={15}
                color="#64748B"
                style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
                required
                autoComplete="email"
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 34px',
                  backgroundColor: '#070D18',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#F8FAFC',
                  fontSize: '0.84rem',
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
                fontSize: '0.74rem',
                fontWeight: 700,
                color: '#CBD5E1',
                marginBottom: '4px',
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={15}
                color="#64748B"
                style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
                style={{
                  width: '100%',
                  padding: '9px 36px 9px 34px',
                  backgroundColor: '#070D18',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#F8FAFC',
                  fontSize: '0.84rem',
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
                  right: '10px',
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
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            style={{
              marginTop: '4px',
              padding: '10px 16px',
              backgroundColor: '#2563EB',
              border: 'none',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
              opacity: isSubmitting ? 0.7 : 1,
              transition: 'all 0.15s ease',
            }}
          >
            {isSubmitting ? (
              'Authenticating...'
            ) : (
              <>
                <span>{activeTab === 'login' ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            margin: '12px 0',
            gap: '10px',
            color: '#64748B',
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          <div style={{ flex: 1, height: '1px', backgroundColor: '#1E293B' }} />
          <span>OR</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#1E293B' }} />
        </div>

        {/* 1-Click Instant Demo Login */}
        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={isSubmitting || isLoading}
          style={{
            width: '100%',
            padding: '9px 14px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1.2px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '8px',
            color: '#34D399',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          <Sparkles size={14} />
          <span>Instant 1-Click Demo Sign In</span>
        </button>

        {/* Compact Security Badge */}
        <div
          style={{
            marginTop: '12px',
            textAlign: 'center',
            fontSize: '0.7rem',
            color: '#64748B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
          }}
        >
          <ShieldCheck size={13} color="#10B981" />
          <span>Encrypted Cloud Sync • Neon DB PostgreSQL</span>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
