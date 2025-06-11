
import {
  LayoutDashboard,
  FileText,
  Settings,
  Package,
} from "lucide-react";

export type NavigationItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredRoles?: Array<'Administrator' | 'Operator' | 'Salesperson'>;
  disabled?: boolean;
};

export const navigationItems: NavigationItem[] = [
  { 
    name: "Dashboard", 
    href: "/dashboard", 
    icon: LayoutDashboard, 
    requiredRoles: ['Administrator', 'Operator', 'Salesperson']
  },
  { 
    name: "Orders", 
    href: "/orders", 
    icon: Package,
    // Allow all authenticated users to view orders
    requiredRoles: undefined
  },

    { 
    name: "Settings", 
    href: "/settings", 
    icon: Settings,
    requiredRoles: ['Administrator']
  },
];
