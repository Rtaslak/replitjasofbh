// src/types/orders.ts
import { UploadedImage } from "./images";

export type OrderStatus = "new" | "in-progress" | "completed" | "all" | "pending" | "cancelled" | "Submitted";

export type LocationType = "rfid" | "manual" | "off-site";

export type Order = {
  id: string;
  orderNumber: number | string;  // Allow both number and string types
  customer: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  items: string[] | number;  // Allow both array and number
  isEditing?: boolean;
  tagId?: string;
  lastSeen?: number;
  currentStation?: string;
  currentDepartment?: string;
  

  // Additional fields...
  storeLocation?: string;
  designer?: string;
  serialNumber?: string;
  salePrice?: string;
  submittedBy?: string;
  
  // 🆕 NEW FIELDS ADDED
  orderDate?: string;       // User-selected order date from form
  salesperson?: string;     // Assigned salesperson field
  karat?: string;          // Auto-extracted karat from primary metal
  fingerSize?: string;     // Finger size field
  productType?: string;    // Product type selection
  
  metal?: {
    primaryMetal: string;
    secondaryMetal?: string;
    isMultiTone?: boolean;
    tones: {
      yellow: boolean;
      white: boolean;
      rose: boolean;
      black: boolean;
    };
  };
  stoneDetails?: string;
  additionalNotes?: string;
  dueDate?: string;
  
  // Images field using the UploadedImage type
  images?: UploadedImage[];

  departmentId?: number;
  departmentStatus?: {
    designers: boolean;
    jewelers: boolean;
    diamondCounting: boolean;
    setters: boolean;
    polisher: boolean;
    shipping: boolean;
  };
  departmentTransitions?: Array<{
    department: string;
    timestamp: number;
  }>;

  // Add this to support station-based filtering
  station?: string;

  // Off-site location management fields
  current_location_type?: LocationType;
  manual_location?: string;
  location_updated_at?: string;
  location_notes?: string;
  off_site_detected_at?: string;
  last_rfid_scan?: string;
};

// 🆕 NEW: Tag History Types
export interface TagScanHistory {
  id: number;
  timestamp: string;
  readerId: string;
  antenna: string;
  department: {
    id: number;
    name: string;
    color?: string;
  } | null;
  stationName: string;
}

export interface OrderTagHistory {
  order: {
    id: string;
    orderNumber: number;
    customer: string;
    tagId: string;
    status: string;
  };
  scanHistory: TagScanHistory[];
}

export interface OrderWithScanCount {
  id: string;
  orderNumber: number;
  customer: string;
  tagId: string;
  status: string;
  currentDepartment?: string;
  currentStation?: string;
  scanCount: number;
}

// API Response types for tag history
export interface TagHistoryResponse {
  orders: OrderWithScanCount[];
}

export interface OrderScanHistoryResponse extends OrderTagHistory {}

// Filter and sort types for tag history table
export interface TagHistoryFilters {
  status?: string;
  department?: string;
  searchTerm?: string;
}

export interface TagHistorySortConfig {
  field: keyof OrderWithScanCount;
  direction: 'asc' | 'desc';
}

// Off-site location options
export const OFF_SITE_LOCATIONS = [
  'Enamel Shop (External)',
  'RTV Department',
  'Quality Control (External)',
  'Customer Return',
  'Repair Shop',
  'Shipping/Packaging',
  'Storage/Hold',
  'Custom Location'
] as const;

export type OffSiteLocation = typeof OFF_SITE_LOCATIONS[number];

// Define the selection type that can be either a Set or Array
export type SelectedOrders = Set<string> | string[];

// Utility function to check if orders array is valid
export function isValidOrdersArray(arr: any): arr is Order[] {
  return Array.isArray(arr) && arr.every(item => item && typeof item === 'object' && 'id' in item);
}

// Helper functions for off-site management
export function isOrderOffSite(order: Order): boolean {
  return order.current_location_type === 'off-site' || order.current_location_type === 'manual';
}

export function getOrderLocationDisplay(order: Order): string {
  if (order.current_location_type === 'manual' && order.manual_location) {
    return order.manual_location;
  }
  if (order.current_location_type === 'off-site') {
    return 'Off-Site (Unknown)';
  }
  if (order.currentStation && order.currentDepartment) {
    return `${order.currentDepartment} > ${order.currentStation}`;
  }
  return 'Unknown Location';
}

export function getTimeSinceLastScan(order: Order): string {
  const lastScan = order.last_rfid_scan ? new Date(order.last_rfid_scan).getTime() : 0;
  const now = Date.now();
  const diffMs = now - lastScan;
  
  if (diffMs < 60000) { // Less than 1 minute
    return 'Just now';
  } else if (diffMs < 3600000) { // Less than 1 hour
    const minutes = Math.floor(diffMs / 60000);
    return `${minutes}m ago`;
  } else if (diffMs < 86400000) { // Less than 1 day
    const hours = Math.floor(diffMs / 3600000);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffMs / 86400000);
    return `${days}d ago`;
  }
}

// 🆕 NEW: Helper functions for tag history
export function formatScanTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString();
}

export function getDepartmentColor(department: TagScanHistory['department']): string {
  return department?.color || '#6b7280'; // Default gray if no color
}

export function getLocationString(scan: TagScanHistory): string {
  const departmentName = scan.department?.name || 'Unknown';
  const stationName = scan.stationName || 'Unknown Station';
  return `${departmentName} > ${stationName}`;
}