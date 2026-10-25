import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

const TOKEN_KEY = 'my_schedule_auth_token';
const USER_KEY = 'my_schedule_auth_user';

// Helpers to load initial state safely
const getStoredToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY) || null;
  } catch {
    return null;
  }
};

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
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

      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem('myschedule_auth_token', token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));

      return { token, user, message: res.message };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      return rejectWithValue(msg);
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

      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem('myschedule_auth_token', token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));

      return { token, user, message: res.message };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Signup failed';
      return rejectWithValue(msg);
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

      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem('myschedule_auth_token', token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));

      return { token, user, message: res.message };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Demo login failed';
      return rejectWithValue(msg);
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logoutUser', async () => {
  try {
    await api.auth.logout();
  } catch (err) {
    console.warn('Backend logout failed:', err);
  } finally {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('myschedule_auth_token');
    localStorage.removeItem(USER_KEY);
    try {
      localStorage.removeItem('my_schedule_auth_permissions');
    } catch {}
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
        localStorage.setItem(USER_KEY, JSON.stringify(state.user));
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
