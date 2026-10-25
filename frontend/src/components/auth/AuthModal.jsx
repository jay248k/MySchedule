import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Briefcase,
  Eye,
  EyeOff,
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export function AuthModal() {
  const {
    authModalOpen,
    authModalTab,
    setAuthModalTab,
    closeAuthModal,
    login,
    signup,
    demoLogin,
    isLoading,
    isAuthenticated,
  } = useAuth();

  const { showToast } = useApp();

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [title, setTitle] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens or tab changes
  useEffect(() => {
    setErrorMsg('');
    if (authModalTab === 'login') {
      setPassword('');
    } else {
      setName('');
      setEmail('');
      setPassword('');
      setTitle('');
    }
  }, [authModalTab, authModalOpen]);

  // Handle ESC key to close modal (only if authenticated)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && authModalOpen && isAuthenticated) {
        closeAuthModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [authModalOpen, closeAuthModal, isAuthenticated]);

  if (!authModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (authModalTab === 'login') {
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
          message: res.message || `Signed in as ${res.user.name}`,
        });
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
          message: res.message || `Welcome to MySchedule, ${res.user.name}!`,
        });
      } else {
        setErrorMsg(res.error || 'Failed to create account');
      }
    }
  };

  const handleDemoClick = async () => {
    setErrorMsg('');
    setIsSubmitting(true);
    const res = await demoLogin('admin@myschedule.app');
    setIsSubmitting(false);

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Demo Account Connected',
        message: 'Signed in as Demo User: Alex Morgan.',
      });
    } else {
      setErrorMsg(res.error || 'Could not launch demo account');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(8px)',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && isAuthenticated) closeAuthModal();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'var(--card-bg, #1e293b)',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Modal Top Header with Glow Effect */}
        <div
          style={{
            padding: '24px 28px 20px',
            background: 'linear-gradient(135deg, rgba(23, 105, 255, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)',
            borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '999px',
                background: 'rgba(23, 105, 255, 0.15)',
                color: '#38BDF8',
                fontSize: '0.74rem',
                fontWeight: 600,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}
            >
              <ShieldCheck size={14} />
              Neon DB Cloud Auth
            </div>
            <h2
              style={{
                fontSize: '1.45rem',
                fontWeight: 800,
                color: 'var(--text-primary, #f8fafc)',
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              {authModalTab === 'login' ? 'Sign in to MySchedule' : 'Create your account'}
            </h2>
            <p
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-secondary, #94a3b8)',
                margin: '4px 0 0',
              }}
            >
              {authModalTab === 'login'
                ? 'Access your tasks, goals, and schedule from any device'
                : 'Join today and sync your schedule with cloud storage'}
            </p>
          </div>

          {isAuthenticated && (
            <button
              type="button"
              onClick={closeAuthModal}
              className="btn-icon"
              aria-label="Close modal"
              style={{
                color: 'var(--text-muted, #94a3b8)',
                background: 'rgba(255, 255, 255, 0.06)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            padding: '6px',
            margin: '20px 28px 0',
            background: 'rgba(0, 0, 0, 0.22)',
            borderRadius: '12px',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.06))',
          }}
        >
          <button
            type="button"
            onClick={() => setAuthModalTab('login')}
            style={{
              flex: 1,
              padding: '9px 16px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: authModalTab === 'login' ? 'var(--primary-color, #1769FF)' : 'transparent',
              color: authModalTab === 'login' ? '#ffffff' : 'var(--text-secondary, #94a3b8)',
              boxShadow: authModalTab === 'login' ? '0 2px 8px rgba(23, 105, 255, 0.35)' : 'none',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setAuthModalTab('signup')}
            style={{
              flex: 1,
              padding: '9px 16px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: authModalTab === 'signup' ? 'var(--primary-color, #1769FF)' : 'transparent',
              color: authModalTab === 'signup' ? '#ffffff' : 'var(--text-secondary, #94a3b8)',
              boxShadow: authModalTab === 'signup' ? '0 2px 8px rgba(23, 105, 255, 0.35)' : 'none',
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert Banner */}
        {errorMsg && (
          <div
            style={{
              margin: '16px 28px 0',
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.85rem',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Demo Quick Credentials Banner */}
        {authModalTab === 'login' && (
          <div
            onClick={() => {
              setEmail('admin@myschedule.app');
              setPassword('demouser123');
            }}
            style={{
              margin: '16px 28px 0',
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.16) 0%, rgba(139, 92, 246, 0.16) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              transition: 'all 0.2s',
            }}
            title="Click to auto-fill Demo credentials"
            id="btn-quick-fill-demo"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#6366F1',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <ShieldCheck size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#E0E7FF' }}>
                  Demo User Credentials (Click to fill)
                </div>
                <div style={{ fontSize: '0.74rem', color: '#94A3B8' }}>
                  <span style={{ color: '#A5B4FC', fontWeight: 600 }}>admin@myschedule.app</span> &nbsp;•&nbsp;{' '}
                  <span style={{ color: '#A5B4FC', fontWeight: 600 }}>demouser123</span>
                </div>
              </div>
            </div>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#4F46E5',
                background: '#ffffff',
                padding: '4px 10px',
                borderRadius: '6px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                flexShrink: 0,
              }}
            >
              Fill Credentials
            </span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 28px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Full Name (Sign Up only) */}
          {authModalTab === 'signup' && (
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary, #94a3b8)',
                  marginBottom: '6px',
                }}
              >
                Full Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <User
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted, #64748b)',
                  }}
                />
                <input
                  type="text"
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 40px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
                    background: 'var(--input-bg, rgba(0, 0, 0, 0.2))',
                    color: 'var(--text-primary, #ffffff)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  required
                />
              </div>
            </div>
          )}

          {/* Email Address */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--text-secondary, #94a3b8)',
                marginBottom: '6px',
              }}
            >
              Email Address <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted, #64748b)',
                }}
              />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 40px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
                  background: 'var(--input-bg, rgba(0, 0, 0, 0.2))',
                  color: 'var(--text-primary, #ffffff)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                required
              />
            </div>
          </div>

          {/* Job Title / Role (Sign Up optional) */}
          {authModalTab === 'signup' && (
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary, #94a3b8)',
                  marginBottom: '6px',
                }}
              >
                Role / Title <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(Optional)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Briefcase
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted, #64748b)',
                  }}
                />
                <input
                  type="text"
                  placeholder="e.g. Senior Product Designer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 40px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
                    background: 'var(--input-bg, rgba(0, 0, 0, 0.2))',
                    color: 'var(--text-primary, #ffffff)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary, #94a3b8)',
                }}
              >
                Password <span style={{ color: '#ef4444' }}>*</span>
              </label>
              {authModalTab === 'signup' && (
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>min 6 characters</span>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted, #64748b)',
                }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 40px 11px 40px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
                  background: 'var(--input-bg, rgba(0, 0, 0, 0.2))',
                  color: 'var(--text-primary, #ffffff)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted, #64748b)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            style={{
              marginTop: '8px',
              padding: '12px 20px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #1769FF 0%, #0052cc 100%)',
              color: '#ffffff',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(23, 105, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              opacity: isSubmitting ? 0.75 : 1,
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>{authModalTab === 'login' ? 'Signing in...' : 'Creating account...'}</span>
              </>
            ) : (
              <>
                <span>{authModalTab === 'login' ? 'Sign In' : 'Create My Account'}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>

          {/* Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              margin: '4px 0',
              gap: '12px',
            }}
          >
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color, rgba(255, 255, 255, 0.08))' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              OR
            </span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color, rgba(255, 255, 255, 0.08))' }} />
          </div>

          {/* 1-Click Demo Login */}
          <button
            type="button"
            onClick={handleDemoClick}
            disabled={isSubmitting || isLoading}
            style={{
              padding: '11px 20px',
              borderRadius: '12px',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              background: 'rgba(56, 189, 248, 0.08)',
              color: '#38BDF8',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
          >
            <Zap size={16} fill="#38BDF8" />
            <span>⚡ Instant 1-Click Demo Sign In</span>
          </button>
        </form>

        {/* Footer info */}
        <div
          style={{
            padding: '14px 28px',
            background: 'rgba(0, 0, 0, 0.15)',
            borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.06))',
            textAlign: 'center',
            fontSize: '0.78rem',
            color: 'var(--text-muted, #64748b)',
          }}
        >
          {authModalTab === 'login' ? (
            <span>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => setAuthModalTab('signup')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38BDF8',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                }}
              >
                Sign up now
              </button>
            </span>
          ) : (
            <span>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => setAuthModalTab('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38BDF8',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                }}
              >
                Sign in to your account
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
