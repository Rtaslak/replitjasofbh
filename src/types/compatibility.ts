// src/types/compatibility.ts

/**
 * This file provides compatibility helpers to resolve type conflicts
 * between components and ensure consistent typing throughout the application.
 */

import { UploadedImage } from "./images";
import { Order, SelectedOrders, OrderStatus } from "./orders";
import { User, UserRole } from "./users";

// Safe conversion functions for common objects
export function ensureUploadedImagesArray(images: any): UploadedImage[] {
  if (!images) return [];
  if (!Array.isArray(images)) return [];
  
  return images.map(img => {
    // Ensure each image has the required fields
    return {
      id: img.id || `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: img.name || 'image',
      url: img.url || img.originalUrl || img.dataUrl || '',
      thumbnailUrl: img.thumbnailUrl,
      key: img.key,
      dataUrl: img.dataUrl,
      file: img.file,
      type: img.type,
      size: img.size,
      lastModified: img.lastModified
    };
  });
}

// Ensure we have an array of orders
export function ensureOrdersArray(orders: any): Order[] {
  if (!orders) return [];
  if (!Array.isArray(orders)) return [];
  
  return orders;
}

// Ensure consistent handling of selected orders
export function ensureSelectedOrders(selected: any): SelectedOrders {
  if (selected instanceof Set) return selected;
  if (Array.isArray(selected)) return selected;
  return new Set<string>();
}

// Convert selected orders to array
export function selectedOrdersToArray(selected: SelectedOrders): string[] {
  if (Array.isArray(selected)) return selected;
  return Array.from(selected);
}

// Map role strings to UserRole type
export function mapStringToUserRole(role: string | undefined): UserRole {
  switch (role?.toLowerCase()) {
    case 'admin':
    case 'administrator':
      return 'Administrator';
    case 'operator':
    case 'user':
      return 'Operator';
    case 'salesperson':
    case 'sales':
      return 'Salesperson';
    default:
      return 'Operator'; // Default role
  }
}

// Convert string to OrderStatus
export function toOrderStatus(status: string | undefined): OrderStatus {
  switch (status?.toLowerCase()) {
    case 'all':
      return 'all';
    case 'new':
      return 'new';
    case 'pending':
    case 'in-progress':
    case 'in progress':
      return 'in-progress';
    case 'completed':
      return 'completed';
    case 'cancelled':
    case 'canceled':
      return 'cancelled';
    default:
      return 'all'; // Default status
  }
}