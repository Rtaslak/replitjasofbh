import { jwtDecode } from "jwt-decode";

// API URL from constants
import { API_BASE_URL } from '../utils/api/constants';

// User interface
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface DecodedToken {
  sub: string;
  username?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  'custom:role'?: string;
  customrole?: string;
  exp?: number;
  token_use?: string;
  aud?: string;
}

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  ID_TOKEN: 'idToken',
  REFRESH_TOKEN: 'refreshToken',
  LAST_ACTIVITY: 'lastActivity'
};

// Track user activity
let activityTimer: NodeJS.Timeout | null = null;
let refreshPromise: Promise<boolean> | null = null;

// 12 hours in milliseconds for inactivity timeout
const INACTIVITY_TIMEOUT = 12 * 60 * 60 * 1000; // 12 hours

/**
 * Update last activity timestamp
 */
export const updateActivity = (): void => {
  localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString());
};

/**
 * Get access token from storage (for API calls)
 */
export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  } catch (error) {
    console.error('Error accessing token storage:', error);
    return null;
  }
};

/**
 * Get ID token from storage (for user profile data)
 */
export const getIdToken = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEYS.ID_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.ID_TOKEN);
  } catch (error) {
    console.error('Error accessing ID token storage:', error);
    return null;
  }
};

/**
 * Get user data from ID token
 */
export const getUser = (): User | null => {
  try {
    const idToken = getIdToken();
    
    if (!idToken) {
      return null;
    }

    const decoded: DecodedToken = jwtDecode(idToken);

    if (!decoded || !decoded.sub) {
      return null;
    }

    // Extract name from various possible fields
    let name = '';
    if (decoded.name) {
      name = decoded.name;
    } else if (decoded.given_name || decoded.family_name) {
      name = `${decoded.given_name || ''} ${decoded.family_name || ''}`.trim();
    } else if (decoded.username) {
      name = decoded.username;
    } else if (decoded.email) {
      name = decoded.email.split('@')[0];
    } else {
      name = decoded.sub;
    }

    const role = decoded['custom:role'] || decoded.customrole || 'User';
    const email = decoded.email || '';

    return {
      id: decoded.sub,
      email: email,
      name: name,
      role: role,
    };
  } catch (error) {
    console.error('Error getting user from ID token:', error);
    return null;
  }
};

/**
 * Check if we have valid tokens in storage
 */
export const hasValidTokens = (): boolean => {
  try {
    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const idToken = localStorage.getItem(STORAGE_KEYS.ID_TOKEN);
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    
    return !!(accessToken && idToken && refreshToken);
  } catch (error) {
    console.error('Error checking token storage:', error);
    return false;
  }
};

/**
 * Check if the access token is valid and not expired
 */
export const isTokenValid = (): boolean => {
  try {
    const accessToken = getAuthToken();
    if (!accessToken) {
      return false;
    }
    
    const decoded: DecodedToken & { exp?: number } = jwtDecode(accessToken);
    
    if (!decoded.exp) {
      return false;
    }
    
    // ✅ FIXED: Increase buffer time to 10 minutes for Cognito tokens
    // This ensures we refresh well before expiry
    const currentTime = Math.floor(Date.now() / 1000);
    const bufferTime = 10 * 60; // 10 minutes buffer
    const isValid = decoded.exp > (currentTime + bufferTime);
    
    if (!isValid) {
      console.log(`🕐 Token will expire soon. Current: ${currentTime}, Expires: ${decoded.exp}, Buffer: ${bufferTime}`);
    }
    
    return isValid;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

/**
 * Check if user has been inactive for too long (12 hours)
 */
export const isUserInactive = (): boolean => {
  try {
    const lastActivity = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
    if (!lastActivity) {
      return true; // No activity recorded, consider inactive
    }
    
    const now = Date.now();
    const timeSinceLastActivity = now - parseInt(lastActivity);
    
    // Return true if inactive for more than 12 hours
    return timeSinceLastActivity > INACTIVITY_TIMEOUT;
  } catch (error) {
    console.error('Error checking user activity:', error);
    return true; // On error, consider inactive for safety
  }
};

/**
 * Refresh tokens using refresh token - with promise deduplication
 */
export const refreshTokens = async (): Promise<boolean> => {
  // If refresh is already in progress, return the existing promise
  if (refreshPromise) {
    console.log('🔄 Token refresh already in progress, waiting...');
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) {
        console.log('❌ No refresh token found');
        return false;
      }

      console.log('🔄 Refreshing tokens with Cognito...');
      const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ refreshToken }),
      });
      
      if (!response.ok) {
        console.log(`❌ Token refresh failed with status: ${response.status}`);
        const errorData = await response.json().catch(() => ({}));
        console.log('❌ Refresh error details:', errorData);
        return false;
      }
      
      const data = await response.json();
      
      // Store both tokens
      if (data.accessToken) {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
        console.log('✅ New access token stored');
      }
      
      if (data.idToken) {
        localStorage.setItem(STORAGE_KEYS.ID_TOKEN, data.idToken);
        console.log('✅ New ID token stored');
      }
      
      console.log('✅ Token refresh successful');
      updateActivity();
      return true;
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      return false;
    } finally {
      // Clear the promise so future calls can create a new one
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

/**
 * Validate current session and refresh tokens if needed
 */
export const validateCurrentSession = async (): Promise<boolean> => {
  try {
    if (!hasValidTokens()) {
      console.log('❌ No tokens found in storage');
      return false;
    }
    
    // Check if user has been inactive for too long
    if (isUserInactive()) {
      console.log('❌ User inactive for more than 12 hours, session invalid');
      return false;
    }
    
    // Check if token is still valid (with 10-minute buffer)
    if (isTokenValid()) {
      console.log('✅ Current session is valid');
      updateActivity();
      return true;
    }
    
    // Try to refresh tokens
    console.log('🔄 Access token expired or expiring soon, attempting refresh...');
    const refreshed = await refreshTokens();
    
    if (refreshed) {
      console.log('✅ Session refreshed successfully');
      return true;
    }
    
    console.log('❌ Session refresh failed');
    return false;
  } catch (error) {
    console.error('❌ Error validating current session:', error);
    return false;
  }
};

/**
 * ✅ FIXED: Start activity monitoring optimized for Cognito tokens
 */
export const startActivityMonitoring = (): void => {
  // Clear existing timer
  if (activityTimer) {
    clearInterval(activityTimer);
  }

  console.log('🎯 Starting activity monitoring for Cognito tokens (1-hour expiry)');

  // ✅ FIXED: Check every 30 seconds for Cognito tokens
  // This ensures we catch expiry quickly and refresh proactively
  activityTimer = setInterval(async () => {
    console.log('🔍 Checking Cognito session status...');
    
    // First check if user has been inactive for 12 hours
    if (isUserInactive()) {
      console.log('⏰ User inactive for 12 hours, logging out...');
      await logout();
      return;
    }

    // Then validate and refresh session if needed
    const isValid = await validateCurrentSession();
    if (!isValid) {
      console.log('❌ Cognito session validation failed, logging out...');
      await logout();
    } else {
      console.log('✅ Cognito session is valid and user is active');
    }
  }, 30 * 1000); // ✅ CHANGED: Check every 30 seconds for Cognito

  // Track user activity events
  const activities = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click', 'focus'];
  
  const activityHandler = () => {
    updateActivity();
  };

  // Remove existing listeners first to prevent duplicates
  activities.forEach(activity => {
    document.removeEventListener(activity, activityHandler, true);
    document.addEventListener(activity, activityHandler, true);
  });

  // Set initial activity timestamp
  updateActivity();
};

/**
 * Stop activity monitoring
 */
export const stopActivityMonitoring = (): void => {
  console.log('⏹️ Stopping activity monitoring');
  
  if (activityTimer) {
    clearInterval(activityTimer);
    activityTimer = null;
  }

  // Remove activity listeners
  const activities = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click', 'focus'];
  const activityHandler = () => updateActivity();
  
  activities.forEach(activity => {
    document.removeEventListener(activity, activityHandler, true);
  });
};

/**
 * Login user and store tokens
 */
export const login = async (email: string, password: string): Promise<{success: boolean, user?: User, error?: string}> => {
  try {
    console.log('🔐 Attempting Cognito login for:', email);
    const response = await fetch(`${API_BASE_URL}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ username: email, password }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { 
        success: false, 
        error: errorData.error || `Login failed (${response.status})` 
      };
    }
    
    const data = await response.json();
    
    if (!data.accessToken || !data.idToken) {
      return { 
        success: false, 
        error: 'Invalid response from server - missing tokens' 
      };
    }
    
    // Store all tokens
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
    localStorage.setItem(STORAGE_KEYS.ID_TOKEN, data.idToken);
    
    if (data.refreshToken) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
    }
    
    // Update activity and start monitoring
    updateActivity();
    startActivityMonitoring();
    
    const user = getUser();
    if (!user) {
      return { 
        success: false, 
        error: 'Could not get user from ID token' 
      };
    }
    
    console.log('✅ Cognito login successful for user:', user.name || user.email);
    console.log('⏰ Session will expire after 12 hours of inactivity');
    console.log('🔄 Tokens will auto-refresh every hour');
    return { 
      success: true, 
      user 
    };
  } catch (error) {
    console.error('❌ Login error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Logout user and clear all tokens/storage
 */
export const logout = async (): Promise<void> => {
  try {
    console.log('🚪 Logging out due to inactivity, expiry, or manual logout...');
    
    // Stop activity monitoring
    stopActivityMonitoring();
    
    // Call logout endpoint
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    }).catch(err => console.error('Logout API error:', err));
  } finally {
    // Clear all tokens and activity data
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.ID_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.LAST_ACTIVITY);
    sessionStorage.clear();
    
    console.log('✅ Logout complete - session cleared');
    // Let React Router handle navigation instead of forced redirect
    // window.location.href = '/auth';
  }
};

/**
 * Create authenticated fetch wrapper that handles token refresh
 */
export const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const makeRequest = async (token: string): Promise<Response> => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
  };

  // Check for inactivity before making request
  if (isUserInactive()) {
    console.log('❌ User inactive for 12 hours, blocking request and logging out...');
    await logout();
    throw new Error('Session expired due to inactivity');
  }

  // Get current token
  let token = getAuthToken();
  if (!token) {
    throw new Error('No access token available');
  }

  // Make the request
  let response = await makeRequest(token);

  // If unauthorized, try to refresh token and retry once
  if (response.status === 401) {
    console.log('🔄 Received 401, attempting Cognito token refresh...');
    
    const refreshed = await refreshTokens();
    if (refreshed) {
      token = getAuthToken();
      if (token) {
        console.log('🔄 Retrying request with new Cognito token...');
        response = await makeRequest(token);
      }
    }
    
    // If still unauthorized after refresh, logout
    if (response.status === 401) {
      console.log('❌ Still unauthorized after Cognito refresh, logging out...');
      await logout();
      throw new Error('Session expired');
    }
  }

  // Update activity on successful requests
  if (response.ok) {
    updateActivity();
  }

  return response;
};