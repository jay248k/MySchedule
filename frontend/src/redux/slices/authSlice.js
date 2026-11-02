import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';
import { cookieUtils, purgeLegacyLocalStorage } from '../../utils/cookieUtils';

const COOKIE_TOKEN_KEY = 'myschedule_auth_token';
const COOKIE_USER_KEY = 'myschedule_auth_user';

// On boot, purge all legacy unusual static data dumped into localStorage
purgeLegacyLocalStorage();

// Helpers to load initial state safely from Cookie or localStorage
const getStoredToken = () => {
  try {
    const fromCookie = cookieUtils.get(COOKIE_TOKEN_KEY) || cookieUtils.get('my_schedule_auth_token');
    if (fromCookie) return fromCookie;
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(COOKIE_TOKEN_KEY) || localStorage.getItem('my_schedule_auth_token') || null;
    }
    return null;
  } catch {
    return null;
  }
};

const getStoredUser = () => {
  try {
    const fromCookie = cookieUtils.getJSON(COOKIE_USER_KEY) || cookieUtils.getJSON('my_schedule_auth_user');
    if (fromCookie) return fromCookie;
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(COOKIE_USER_KEY) || localStorage.getItem('my_schedule_auth_user');
      return raw ? JSON.parse(raw) : null;
    }
    return null;
  } catch {
    return null;
  }
};

const saveSession = (token, user) => {
  if (token) {
    cookieUtils.set(COOKIE_TOKEN_KEY, token, 30);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(COOKIE_TOKEN_KEY, token);
    }
  }
  if (user) {
    cookieUtils.setJSON(COOKIE_USER_KEY, user, 30);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(COOKIE_USER_KEY, JSON.stringify(user));
    }
  }
};

const formatAuthError = (err, fallback) => {
  const status = err.status || err.data?.status || err.response?.status;
  const msg = err.data?.message || err.response?.data?.message || err.message || '';
  if (status === 404 || msg.toLowerCase().includes('not registered') || msg.toLowerCase().includes('not found')) {
    return '❌ Email Not Registered: No account found with this email. Please check for typos or click Sign Up.';
  }
  if (status === 401 || msg.toLowerCase().includes('password') || msg.toLowerCase().includes('incorrect') || msg.toLowerCase().includes('mismatch')) {
    return '❌ Incorrect Password: The password you entered is incorrect. Please check caps lock and try again.';
  }
  return msg || fallback;
};

// Async Thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await api.auth.login({ email, password });
      if (!res.success) {
        return rejectWithValue(res.message || res.error || 'Login failed');
      }
      const token = res.accessToken || res.token || res.data?.accessToken;
      const user = res.user || res.data?.user;

      saveSession(token, user);

      return { token, user, message: res.message };
    } catch (err) {
      return rejectWithValue(formatAuthError(err, 'Login failed. Please check credentials.'));
    }
  }
);

export const signupUser = createAsyncThunk(
  'auth/signupUser',
  async (userData, { rejectWithValue }) => {
    try {
      const res = await api.auth.signup(userData);
      if (!res.success) {
        return rejectWithValue(res.message || res.error || 'Signup failed');
      }
      const token = res.accessToken || res.token || res.data?.accessToken;
      const user = res.user || res.data?.user;

      saveSession(token, user);

      return { token, user, message: res.message };
    } catch (err) {
      return rejectWithValue(formatAuthError(err, 'Registration failed. Please check details.'));
    }
  }
);

export const demoLoginUser = createAsyncThunk(
  'auth/demoLoginUser',
  async (email, { rejectWithValue }) => {
    try {
      const res = await api.auth.demoLogin(email || 'admin@myschedule.app');
      if (!res.success) {
        return rejectWithValue(res.message || res.error || 'Demo login failed');
      }
      const token = res.accessToken || res.token || res.data?.accessToken;
      const user = res.user || res.data?.user;

      saveSession(token, user);

      return { token, user, message: res.message };
    } catch (err) {
      return rejectWithValue(formatAuthError(err, 'Demo login failed'));
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logoutUser', async () => {
  try {
    await api.auth.logout();
  } catch (err) {
    console.warn('Backend logout failed:', err);
  } finally {
    // Clear cookies & localStorage
    cookieUtils.remove(COOKIE_TOKEN_KEY);
    cookieUtils.remove('my_schedule_auth_token');
    cookieUtils.remove(COOKIE_USER_KEY);
    cookieUtils.remove('my_schedule_auth_user');
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(COOKIE_TOKEN_KEY);
      localStorage.removeItem('my_schedule_auth_token');
      localStorage.removeItem(COOKIE_USER_KEY);
      localStorage.removeItem('my_schedule_auth_user');
    }
  }
  return true;
});

const initialUser = getStoredUser();
const initialToken = getStoredToken();
const isInitiallyAuthenticated = Boolean(initialToken && initialUser);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: initialUser,
    token: initialToken,
    isAuthenticated: isInitiallyAuthenticated,
    status: 'idle',
    error: null,
    authModalOpen: !isInitiallyAuthenticated,
    authModalTab: 'login', // 'login' | 'signup'
  },
  reducers: {
    openAuthModal: (state, action) => {
      state.authModalOpen = true;
      if (action.payload) {
        state.authModalTab = action.payload;
      }
      state.error = null;
    },
    closeAuthModal: (state) => {
      // Only permit closing if user is authenticated (login is mandatory)
      if (state.isAuthenticated) {
        state.authModalOpen = false;
        state.error = null;
      }
    },
    setAuthModalTab: (state, action) => {
      state.authModalTab = action.payload;
      state.error = null;
    },
    setAuthError: (state, action) => {
      state.error = action.payload;
    },
    updateUserProfile: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        cookieUtils.setJSON(COOKIE_USER_KEY, state.user, 30);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.authModalOpen = false;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Login failed';
      })
      // Signup
      .addCase(signupUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.authModalOpen = false;
        state.error = null;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Signup failed';
      })
      // Demo Login
      .addCase(demoLoginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(demoLoginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.authModalOpen = false;
        state.error = null;
      })
      .addCase(demoLoginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Demo login failed';
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.status = 'idle';
        state.error = null;
      });
  },
});

export const {
  openAuthModal,
  closeAuthModal,
  setAuthModalTab,
  setAuthError,
  updateUserProfile,
} = authSlice.actions;

export default authSlice.reducer;
