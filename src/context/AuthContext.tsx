import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as authService from '../services/authService';
import { User } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginUser: (email: string, password: string) => Promise<{success: boolean, error?: string}>;
  logoutUser: () => Promise<void>;
  refetchUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Update user state from token
  const updateUserFromToken = useCallback(() => {
    const currentUser = authService.getUser();
    
    console.log("🔄 updateUserFromToken called:", { 
      hasUser: !!currentUser, 
      currentPath: window.location.pathname 
    });
    
    if (currentUser) {
      setUser(currentUser);
      setIsAuthenticated(true);
      console.log("✅ User state updated from token:", currentUser.email);
      return true;
    } else {
      setUser(null);
      setIsAuthenticated(false);
      console.log("❌ No user found in token");
      return false;
    }
  }, []);

  // Initialize auth state on component mount
  useEffect(() => {
    const initializeAuth = async () => {
      console.log("🔄 Initializing auth state...", { currentPath: window.location.pathname });
      setIsLoading(true);
      
      try {
        // Check if we have valid tokens
        const hasTokens = authService.hasValidTokens();
        
        if (hasTokens) {
          console.log("📍 Found existing tokens, validating session...");
          
          // Validate and refresh session if needed
          const isValid = await authService.validateCurrentSession();
          
          if (isValid) {
            console.log("✅ Session validated successfully");
            const userUpdated = updateUserFromToken();
            console.log("🔐 Auth state about to be set:", { 
              isAuthenticated: userUpdated, 
              hasUser: userUpdated,
              currentPath: window.location.pathname 
            });
          } else {
            console.log("❌ Session validation failed, clearing tokens");
            await authService.logout();
            setUser(null);
            setIsAuthenticated(false);
            console.log("🔐 Auth state set to unauthenticated after failed validation");
          }
        } else {
          console.log("📍 No existing tokens found");
          setUser(null);
          setIsAuthenticated(false);
          console.log("🔐 Auth state set to unauthenticated (no tokens)");
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        // Clear any potentially corrupted auth state
        await authService.logout();
        setUser(null);
        setIsAuthenticated(false);
        console.log("🔐 Auth state cleared due to error");
      } finally {
        console.log("🔐 Auth state about to complete initialization:", { 
          currentPath: window.location.pathname,
          willSetLoadingToFalse: true
        });
        setIsLoading(false);
        console.log("🏁 Auth initialization complete");
      }
    };

    initializeAuth();
  }, [updateUserFromToken]);

  // Add debugging for state changes
  useEffect(() => {
    console.log("🔐 Auth state changed:", { 
      isAuthenticated, 
      hasUser: !!user, 
      isLoading,
      currentPath: window.location.pathname 
    });
  }, [isAuthenticated, user, isLoading]);

  // Start activity monitoring when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log("🎯 Starting activity monitoring for authenticated user");
      authService.startActivityMonitoring();
    } else {
      console.log("⏹️ Stopping activity monitoring");
      authService.stopActivityMonitoring();
    }

    // Cleanup on unmount
    return () => {
      authService.stopActivityMonitoring();
    };
  }, [isAuthenticated, user]);

  // Login handler
  const loginUser = async (email: string, password: string): Promise<{success: boolean, error?: string}> => {
    setIsLoading(true);
    
    try {
      console.log("🔐 Attempting login...");
      const result = await authService.login(email, password);
      
      if (result.success && result.user) {
        setUser(result.user);
        setIsAuthenticated(true);
        console.log("✅ Authentication successful");
        return { success: true };
      }
      
      console.log("❌ Login failed:", result.error);
      return { 
        success: false, 
        error: result.error || 'Login failed' 
      };
    } catch (error) {
      console.error("❌ Login error:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout handler
  const logoutUser = async () => {
    setIsLoading(true);
    
    try {
      console.log("🚪 Logging out...");
      await authService.logout();
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      console.log("✅ Logout completed");
    }
  };

  // Handler to manually refetch user data
  const refetchUser = useCallback(() => {
    console.log("🔄 Manually refetching user data...", { currentPath: window.location.pathname });
    updateUserFromToken();
  }, [updateUserFromToken]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoading, 
      loginUser, 
      logoutUser, 
      refetchUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuthUser = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthUser must be used within an AuthProvider');
  return context;
};