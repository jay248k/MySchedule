import React, { createContext, useContext, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import {
  loginUser,
  signupUser,
  demoLoginUser,
  logoutUser,
  openAuthModal as openAuthModalAction,
  closeAuthModal as closeAuthModalAction,
  setAuthModalTab as setAuthModalTabAction,
  updateUserProfile as updateUserProfileAction,
} from '../redux/slices/authSlice';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const dispatch = useAppDispatch();
  const authState = useAppSelector((state) => state.auth);

  const {
    user,
    token,
    status,
    error,
    authModalOpen,
    authModalTab,
  } = authState;

  const isAuthenticated = Boolean(token && user);
  const isLoading = status === 'loading';

  const openLoginModal = useCallback(() => {
    dispatch(openAuthModalAction('login'));
  }, [dispatch]);

  const openSignupModal = useCallback(() => {
    dispatch(openAuthModalAction('signup'));
  }, [dispatch]);

  const closeAuthModal = useCallback(() => {
    dispatch(closeAuthModalAction());
  }, [dispatch]);

  const setAuthModalTab = useCallback(
    (tab) => {
      dispatch(setAuthModalTabAction(tab));
    },
    [dispatch]
  );

  const login = useCallback(
    async (email, password) => {
      const resultAction = await dispatch(loginUser({ email, password }));
      if (loginUser.fulfilled.match(resultAction)) {
        return {
          success: true,
          user: resultAction.payload.user,
          message: resultAction.payload.message,
        };
      } else {
        return {
          success: false,
          error: resultAction.payload || 'Login failed',
        };
      }
    },
    [dispatch]
  );

  const signup = useCallback(
    async (userData) => {
      const resultAction = await dispatch(signupUser(userData));
      if (signupUser.fulfilled.match(resultAction)) {
        return {
          success: true,
          user: resultAction.payload.user,
          message: resultAction.payload.message,
        };
      } else {
        return {
          success: false,
          error: resultAction.payload || 'Signup failed',
        };
      }
    },
    [dispatch]
  );

  const demoLogin = useCallback(
    async (email = 'admin@myschedule.app') => {
      const resultAction = await dispatch(demoLoginUser(email));
      if (demoLoginUser.fulfilled.match(resultAction)) {
        return {
          success: true,
          user: resultAction.payload.user,
          message: resultAction.payload.message,
        };
      } else {
        return {
          success: false,
          error: resultAction.payload || 'Demo login failed',
        };
      }
    },
    [dispatch]
  );

  const logout = useCallback(async () => {
    await dispatch(logoutUser());
  }, [dispatch]);

  const updateProfile = useCallback(
    async (updates) => {
      dispatch(updateUserProfileAction(updates));
      return { success: true, user: { ...user, ...updates } };
    },
    [dispatch, user]
  );

  // Fallbacks for any components requesting permission checks
  const hasPermission = useCallback(() => true, []);
  const fetchPermissions = useCallback(async () => new Set(), []);

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    hasPermission,
    fetchPermissions,
    isSystemAdmin: false,
    authModalOpen,
    authModalTab,
    setAuthModalTab,
    openLoginModal,
    openSignupModal,
    closeAuthModal,
    login,
    signup,
    demoLogin,
    logout,
    updateProfile,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
