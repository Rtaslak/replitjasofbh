// src/hooks/usePermissions.ts
import { useAuthUser } from "@/context/AuthContext";

// Define permissions by role
const rolePermissions: Record<string, string[]> = {
  Administrator: ['manage_users', 'manage_departments', 'manage_stations', 'manage_orders', 'delete_orders', 'view_all'],
  Admin: ['manage_users', 'manage_departments', 'manage_stations', 'manage_orders', 'delete_orders', 'view_all'], // Legacy support
  Salesperson: ['manage_orders', 'view_orders', 'view_departments'],
  Operator: ['view_orders', 'update_order_status']
};

export const usePermissions = () => {
  const { user } = useAuthUser();
  
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Get role and normalize it
    const role = user.role || 'Operator';
    
    // Get permissions for this role
    const permissions = rolePermissions[role] || [];
    
    // Check if the role has the specific permission or has view_all
    return permissions.includes(permission) || permissions.includes('view_all');
  };
  
  return { hasPermission };
};