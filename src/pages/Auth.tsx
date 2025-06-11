import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getUser } from "@/services/authService";

interface AuthProps {
  onLogin: (accessToken: string) => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [checkingSession, setCheckingSession] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Use this ref to prevent multiple redirects
  const redirectAttempted = useRef(false);

  useEffect(() => {
    // Safety measure: if we're already on the auth page with a token, redirect immediately
    const hasToken = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
    
    if (hasToken && !redirectAttempted.current) {
      redirectAttempted.current = true;
      navigate("/dashboard", { replace: true });
      return;
    }
    
    const checkAuth = async () => {
      // Don't check if we already tried to redirect
      if (redirectAttempted.current) {
        setCheckingSession(false);
        return;
      }

      try {
        const user = await getUser();
        
        if (user) {
          // Get the actual access token from storage
          const accessToken = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
          if (accessToken && !redirectAttempted.current) {
            redirectAttempted.current = true;
            
            // Call the parent's onLogin handler
            onLogin(accessToken);
            
            // Use setTimeout to ensure the onLogin effects have processed
            setTimeout(() => {
              navigate("/dashboard", { replace: true });
            }, 100);
          }
        }
      } catch (error) {
      } finally {
        setCheckingSession(false);
      }
    };
    
    checkAuth();
  }, [onLogin, navigate]);

  const handleAuthSuccess = (accessToken: string = "") => {
    // If we're in signup mode and no token is provided, simply switch to login mode
    if (!isLogin && !accessToken) {
      setIsLogin(true); // Switch to login view
      return;
    }
    
    // Prevent multiple redirects
    if (redirectAttempted.current) {
      return;
    }
    
    redirectAttempted.current = true;
    
    // Get the actual access token from storage if not provided
    const token = accessToken || sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
    
    if (!token) {
      toast({
        title: "Authentication Error",
        description: "Could not complete login. Please try again.",
        variant: "destructive"
      });
      redirectAttempted.current = false; // Reset redirect flag to allow retry
      return;
    }
    
    toast({
      title: isLogin ? "Welcome back!" : "Account created successfully!",
      description: isLogin
        ? "You've been logged in."
        : "You can now sign in with your credentials.",
    });
    
    // Call the parent's onLogin handler
    onLogin(token);
    
    // Use setTimeout to ensure tokens are fully processed before navigation
    setTimeout(() => {
      // Use replace: true to prevent back button issues
      navigate("/dashboard", { replace: true });
    }, 100);
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">
            {isLogin ? "Sign In" : "Create an Account"}
          </h1>
        </CardHeader>
        <CardContent>
          {isLogin ? (
            <LoginForm onSuccess={handleAuthSuccess} />
          ) : (
            <SignupForm onSuccess={() => setIsLogin(true)} />
          )}
          <div className="mt-6 text-center text-sm">
            {isLogin ? (
              <p>
                Don't have an account?{" "}
                <button
                  className="font-medium text-primary underline-offset-4 hover:underline"
                  onClick={() => setIsLogin(false)}
                >
                  Create an account
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <button
                  className="font-medium text-primary underline-offset-4 hover:underline"
                  onClick={() => setIsLogin(true)}
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}