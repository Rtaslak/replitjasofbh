import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";

import AppRoutes from "./routes";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuthUser } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { SocketProvider } from "@/context/SocketContext";
import { OrdersProvider } from "@/context/orders/OrdersContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const AppWrapper = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, refetchUser, logoutUser, loginUser, user } = useAuthUser();
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [hasCheckedSession, setHasCheckedSession] = useState(false);

  // Add navigation debugging
  useEffect(() => {
    console.log('🔍 Navigation change detected:', location.pathname);
  }, [location.pathname]);

  // Create a debug wrapper for navigate
  const debugNavigate = (path: string, options?: any) => {
    console.log('🚨 NAVIGATE CALLED:', path, options, 'from:', location.pathname);
    console.trace('Navigate call stack:'); // This will show us exactly where the navigate call is coming from
    navigate(path, options);
  };

  // Network status monitoring
  useEffect(() => {
    const handleOffline = () => {
      toast.error("You're offline. Some features may not be available.", {
        id: 'network-status',
        duration: 5000
      });
    };

    const handleOnline = () => {
      toast.success("You're back online!", {
        id: 'network-status',
        duration: 3000
      });
    };

    // Check initial status
    if (!navigator.onLine) {
      handleOffline();
    }

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const handleLogin = async (accessToken: string) => {
    console.log('🔐 handleLogin called with token:', accessToken.substring(0, 10) + "...");
    console.log('🔐 Current location when handleLogin called:', location.pathname);
    
    if (accessToken) {
      // EXPLICITLY STORE THE TOKEN HERE TOO
      try {
        window.localStorage.setItem('accessToken', accessToken);
        window.sessionStorage.setItem('accessToken', accessToken);
        console.log("Token explicitly stored in handleLogin");
      } catch (e) {
        console.error("Storage error in handleLogin:", e);
      }
      
      // Refetch user data to update the authentication state
      await refetchUser();
      
      // REMOVE AUTOMATIC NAVIGATION - let routes handle it
      console.log('🔐 handleLogin completed, NOT navigating automatically');
      // debugNavigate("/dashboard", { replace: true }); // COMMENTED OUT
    } else {
      console.warn("Login handler called without access token");
    }
  };

  const handleLogout = async () => {
    console.log('🚪 handleLogout called from:', location.pathname);
    await logoutUser();
    debugNavigate("/auth", { replace: true });
  };

  useEffect(() => {
    const handleActivity = () => setLastActivity(Date.now());

    window.addEventListener("mousedown", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("touchstart", handleActivity);

    const interval = setInterval(async () => {
      const timeout = 10 * 60 * 1000;
      if (isAuthenticated && Date.now() - lastActivity > timeout) {
        toast.warning("Your session has expired due to inactivity", {
          id: 'session-timeout',
          duration: 5000
        });
        await handleLogout();
      }
    }, 60000);

    return () => {
      window.removeEventListener("mousedown", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      clearInterval(interval);
    };
  }, [lastActivity, isAuthenticated]);

  // FIXED: Removed location.pathname from dependency array
  useEffect(() => {
    console.log('🔄 Session check effect running:', { hasCheckedSession, isAuthenticated, currentPath: location.pathname });
    
    // Only check session once at startup
    if (!hasCheckedSession) {
      const checkSession = async () => {
        console.log('🔍 Starting session check from:', location.pathname);
        try {
          // Attempt to fetch the user but don't navigate away on normal auth failures
          await refetchUser();
          console.log('✅ Session check completed successfully');
        } catch (error) {
          // Only log the error, let route protection handle redirects
          console.error("❌ Session check error:", error);
        } finally {
          setHasCheckedSession(true);
          console.log('🏁 Session check finished, hasCheckedSession set to true');
        }
      };
      checkSession();
    }
  }, [hasCheckedSession, refetchUser]); // REMOVED location.pathname from here!

  // Add debugging for auth state changes
  useEffect(() => {
    console.log('🔐 Auth state changed:', { 
      isAuthenticated, 
      hasUser: !!user, 
      currentPath: location.pathname,
      hasCheckedSession 
    });
  }, [isAuthenticated, user, location.pathname, hasCheckedSession]);

  return (
    <AppRoutes
      isAuthenticated={isAuthenticated}
      onLogin={handleLogin}
      onLogout={handleLogout}
    />
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <OrdersProvider>
            <TooltipProvider>
              <NotificationProvider>
                <Sonner />
                <Toaster />
                <BrowserRouter>
                  <AppWrapper />
                </BrowserRouter>
              </NotificationProvider>
            </TooltipProvider>
          </OrdersProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

// Updated to represent the new integration approach
console.log("✅ App loaded with custom Cognito auth integration");

export default App;