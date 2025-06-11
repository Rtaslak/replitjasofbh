// src/pages/Settings.tsx
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { UserManagement } from '@/components/settings/user-management/UserManagement';
import { useAuthUser } from "@/context/AuthContext";
import { useOrders } from "@/context/orders/OrdersContext";
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RotateCcw, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import SettingsDepartments from '@/components/settings/department-management/SettingsDepartments';
import TagHistory from '@/components/settings/TagHistory';
import orderService from '@/services/orderService';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('users');
  const [isResetting, setIsResetting] = useState(false);
  const { user } = useAuthUser();
  const { refreshOrders, fetchOffSiteOrders } = useOrders();
  
  // Debug logs
  useEffect(() => {
    console.log("Settings component - Current user:", user);
    
    // Force fetch users directly to debug
    if (user) {
      const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
      if (token) {
        console.log("Manually checking user API with token:", token.substring(0, 15) + "...");
        fetch('https://api.jasonofbh.net/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        .then(res => {
          console.log("User API response status:", res.status);
          return res.text();
        })
        .then(text => {
          try {
            const data = JSON.parse(text);
            console.log("User API data:", data);
          } catch (e) {
            console.log("User API raw response:", text);
          }
        })
        .catch(err => console.error("User API error:", err));
      }
    }
  }, [user]);
  
  // Use simple role checks
  const isAdmin = user?.role === 'Administrator' || user?.role === 'Admin';
  const isReadOnly = !isAdmin;

  // ✅ Handle reset and check tracking
  const handleResetAndCheck = async () => {
    if (!confirm('This will reset all department tracking and check for missing orders. Tag assignments will be kept. Continue?')) {
      return;
    }
    
    try {
      setIsResetting(true);
      const result = await orderService.resetAndCheckTracking();
      
      toast.success(
        `✅ Reset complete! ${result.ordersReset} orders reset, ${result.missingOrdersFound} moved to off-site`
      );
      
      // Refresh data
      await refreshOrders();
      await fetchOffSiteOrders();
    } catch (error) {
      console.error('Failed to reset tracking:', error);
      toast.error('Failed to reset tracking');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="container py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your users, departments, and view tag scan history
        </p>
      </div>

      {/* ✅ RFID Reset Section - Admin Only */}
      {isAdmin && (
        <>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">RFID Tracking</h2>
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
              <div>
                <h3 className="font-medium">Reset All RFID Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  Resets all department tracking and checks for missing orders. Tag assignments will be preserved.
                </p>
              </div>
              <Button 
                variant="destructive" 
                onClick={handleResetAndCheck}
                disabled={isResetting}
                className="gap-2"
              >
                {isResetting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                {isResetting ? 'Resetting...' : 'Reset All RFID Tracking'}
              </Button>
            </div>
          </div>
          <Separator />
        </>
      )}

      <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="tag-history">Tag History</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserManagement readOnly={isReadOnly} />
        </TabsContent>

        <TabsContent value="departments">
          <SettingsDepartments />
        </TabsContent>

        <TabsContent value="tag-history">
          <TagHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}