import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import AppLayout from "@/components/layout/AppLayout";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Orders from "@/pages/Orders";
import OrderForm from "@/pages/OrderForm";
import Settings from "@/pages/Settings";
import Stations from "@/pages/Stations";
import NotFound from "@/pages/NotFound";
import ProtectedRoute from "@/components/routing/ProtectedRoute";
import OrderDetails from "@/pages/OrderDetails";
import OffSitePage from "@/pages/OffSite";
import CompletedOrders from "@/pages/CompletedOrders";

import { useAuthUser } from "@/context/AuthContext";

interface AppRoutesProps {
  isAuthenticated: boolean;
  onLogin: (accessToken: string) => void;
  onLogout: () => Promise<void>;
}

// Normalize role strings
const normalizeRole = (role: string) => {
  const map: Record<string, string> = {
    Administrator: "admin",
    Admin: "admin",
    admin: "admin",
    Operator: "operator",
    operator: "operator",
    Salesperson: "sales",
    salesperson: "sales",
    User: "user",
    user: "user",
  };
  return map[role] || "user";
};

const AppRoutes: React.FC<AppRoutesProps> = ({ isAuthenticated, onLogin, onLogout }) => {
  const { user, isLoading } = useAuthUser();

  if (isAuthenticated && (isLoading || !user)) {
    return null;
  }

  const userRole = normalizeRole(user?.role || "");
  return (
    <Routes>
      {!isAuthenticated ? (
        <>
          <Route path="/auth" element={<Auth onLogin={(token) => onLogin(token)} />} />
          {/* Redirect to auth page for unauthenticated users, but show loading during auth check */}
          <Route path="*" element={
            isLoading ? (
              <div className="flex h-screen items-center justify-center">
                <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
              </div>
            ) : (
              <Navigate to="/auth" replace />
            )
          } />
        </>
      ) : (
        <>
          <Route path="/auth" element={<Navigate to="/dashboard" replace />} />
          <Route path="/" element={<AppLayout onLogout={onLogout} />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            <Route path="orders" element={<Orders />} />
            <Route path="orders/new" element={<OrderForm />} />
            <Route path="orders/:id" element={<OrderForm />} />
            <Route path="orders/view/:id" element={<OrderDetails />} />
            <Route path="off-site" element={<OffSitePage />} />
            <Route path="completed-orders" element={<CompletedOrders />} />

            <Route
              path="stations"
              element={
                <ProtectedRoute requiredRole={["Administrator", "Operator", "Salesperson"]}>
                  <Stations />
                </ProtectedRoute>
              }
            />

            <Route
              path="settings"
              element={
                <ProtectedRoute requiredRole={["Administrator"]}>
                  <Settings />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Route>
        </>
      )}
    </Routes>
  );
};

export default AppRoutes;