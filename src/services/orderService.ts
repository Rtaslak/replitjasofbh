import requestHandler from "@/utils/api/requestHandler";
import { Order, OffSiteLocation, OrderWithScanCount, OrderTagHistory } from "@/types/orders";
import { FormValues } from "@/components/orders/form/FormSchema";

// Image metadata type used for S3 image uploads
interface UploadedImage {
  originalUrl: string;
  thumbnailUrl: string;
  name: string;
  key: string;
}

// Cache keys
const ORDERS_CACHE_KEY = 'orders';
const ORDER_DETAIL_CACHE_PREFIX = 'order_';
const OFF_SITE_ORDERS_CACHE_KEY = 'off_site_orders';

// Helper to get server URL for RFID specific endpoints
const getServerUrl = (): string => {
  // Try to find the server URL from environment
  const envServerUrl = process.env.REACT_APP_SERVER_URL || process.env.VITE_SERVER_URL;
  if (envServerUrl) return envServerUrl;
  
  // Default fallback based on current location
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  
  // For development environments
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}:8000`;
  }
  
  // For production, use our API domain
  return 'https://api.jasonofbh.net';
};

export const orderService = {
  /**
   * Get all orders with caching
   */
  getAllOrders: async (): Promise<Order[]> => {
    try {
      // Use the caching mechanism from requestHandler
      return await requestHandler.get<Order[]>("orders");
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      throw error; // Allow caller to handle the error
    }
  },

  /**
   * Get all orders directly from the RFID server
   * (Alternative implementation using the RFID-specific logic)
   */
  getOrdersFromRfidServer: async (): Promise<Order[]> => {
    const serverUrl = getServerUrl();

    try {
      const response = await fetch(`${serverUrl}/api/orders`, {
        method: 'GET',
        credentials: 'include',  // Ensure cookies are sent with the request
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("❌ Error fetching orders from RFID server:", error);
      throw error;
    }
  },

  /**
   * ✅ Get off-site orders
   */
  getOffSiteOrders: async (): Promise<Order[]> => {
    try {
      return await requestHandler.get<Order[]>("orders/off-site");
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get an order by ID with caching
   */
  getOrderById: async (id: string): Promise<Order> => {
    try {
      return await requestHandler.get<Order>(`orders/${id}`);
    } catch (error) {
      console.error(`❌ Error fetching order ${id}:`, error);
      throw error; // Allow caller to handle the error
    }
  },

  /**
   * Create a new order (with image metadata, not files)
   */
  createOrder: async (
    formData: FormValues & { images?: UploadedImage[] }
  ): Promise<Order> => {
    try {
      // Log the form data being sent
      
      // Process the data to match the backend schema
      const orderData = {
        ...formData,
        // Make sure these fields are explicitly included
        customer: formData.customer,
        dueDate: formData.dueDate,
        productType: formData.productType,
        storeLocation: formData.storeLocation,
        designer: formData.designer,
        serialNumber: formData.serialNumber,
        salePrice: formData.salePrice,
        stoneDetails: formData.stoneDetails,
        additionalNotes: formData.additionalNotes,
        // Don't flatten metal object here, the backend will handle it
      };
      
      const order = await requestHandler.post<Order>("orders", orderData);
      
      // Manually invalidate orders cache
      requestHandler.clearCache(ORDERS_CACHE_KEY);
      requestHandler.clearCache(OFF_SITE_ORDERS_CACHE_KEY);
      
      return order;
    } catch (error) {
      console.error('❌ Error creating order:', error);
      throw error;
    }
  },

  /**
   * Update an existing order (with image metadata)
   */
  updateOrder: async (
    id: string,
    formData: FormValues & { images?: UploadedImage[] }
  ): Promise<Order> => {
    try {
      // Process the data to match the backend schema
      const orderData = {
        ...formData,
        // Make sure these fields are explicitly included
        customer: formData.customer,
        dueDate: formData.dueDate,
        productType: formData.productType,
        storeLocation: formData.storeLocation,
        designer: formData.designer,
        serialNumber: formData.serialNumber,
        salePrice: formData.salePrice,
        stoneDetails: formData.stoneDetails,
        additionalNotes: formData.additionalNotes,
        // Don't flatten metal object here, the backend will handle it
      };
      
      const order = await requestHandler.put<Order>(`orders/${id}`, orderData);
      
      // Manually invalidate specific caches
      requestHandler.clearCache(ORDERS_CACHE_KEY);
      requestHandler.clearCache(`${ORDER_DETAIL_CACHE_PREFIX}${id}`);
      requestHandler.clearCache(OFF_SITE_ORDERS_CACHE_KEY);
      
      return order;
    } catch (error) {
      console.error(`❌ Error updating order ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete an order by ID
   */
  deleteOrder: async (id: string): Promise<void> => {
    try {
      await requestHandler.delete<void>(`orders/${id}`);
      
      // Manually invalidate caches
      requestHandler.clearCache(ORDERS_CACHE_KEY);
      requestHandler.clearCache(`${ORDER_DETAIL_CACHE_PREFIX}${id}`);
      requestHandler.clearCache(OFF_SITE_ORDERS_CACHE_KEY);
    } catch (error) {
      console.error(`❌ Error deleting order ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete multiple orders
   */
  deleteMultipleOrders: async (orderIds: string[]): Promise<void> => {
    if (orderIds.length === 0) return;
    
    try {
      // If your API supports batch delete, use it here
      // For now, using Promise.all for multiple deletions
      await Promise.all(orderIds.map(id => requestHandler.delete(`orders/${id}`)));
      
      // Invalidate the orders list cache
      requestHandler.clearCache(ORDERS_CACHE_KEY);
      requestHandler.clearCache(OFF_SITE_ORDERS_CACHE_KEY);
      
      // Invalidate individual order caches
      orderIds.forEach(id => {
        requestHandler.clearCache(`${ORDER_DETAIL_CACHE_PREFIX}${id}`);
      });
    } catch (error) {
      console.error('❌ Error deleting multiple orders:', error);
      throw error;
    }
  },

  /**
   * Complete multiple orders (mark as completed)
   */
  completeMultipleOrders: async (orderIds: string[]): Promise<void> => {
    if (orderIds.length === 0) return;
    
    try {
      // Update each order's status to "completed" using PATCH method
      await Promise.all(
        orderIds.map(id => 
          requestHandler.patch(`orders/${id}/status`, { status: "completed" })
        )
      );
      
      // Invalidate the orders list cache
      requestHandler.clearCache(ORDERS_CACHE_KEY);
      requestHandler.clearCache(OFF_SITE_ORDERS_CACHE_KEY);
      
      // Invalidate individual order caches
      orderIds.forEach(id => {
        requestHandler.clearCache(`${ORDER_DETAIL_CACHE_PREFIX}${id}`);
      });
      
      console.log(`Successfully completed ${orderIds.length} orders`);
    } catch (error) {
      console.error('❌ Error completing multiple orders:', error);
      throw error;
    }
  },

  /**
   * Complete a single order (mark as completed)
   */
  completeOrder: async (id: string): Promise<Order> => {
    try {
      const order = await requestHandler.patch<Order>(`orders/${id}/status`, { 
        status: "completed" 
      });
      
      // Manually invalidate caches
      requestHandler.clearCache(ORDERS_CACHE_KEY);
      requestHandler.clearCache(`${ORDER_DETAIL_CACHE_PREFIX}${id}`);
      requestHandler.clearCache(OFF_SITE_ORDERS_CACHE_KEY);
      
      console.log(`Successfully completed order ${id}`);
      return order;
    } catch (error) {
      console.error(`❌ Error completing order ${id}:`, error);
      throw error;
    }
  },

  /**
   * ✅ NEW: Reactivate a completed order (bring back to production)
   */
  reactivateOrder: async (id: string): Promise<Order> => {
    try {
      const order = await requestHandler.patch<Order>(`orders/${id}/reactivate`, {});
      
      // Manually invalidate caches
      requestHandler.clearCache(ORDERS_CACHE_KEY);
      requestHandler.clearCache(`${ORDER_DETAIL_CACHE_PREFIX}${id}`);
      requestHandler.clearCache(OFF_SITE_ORDERS_CACHE_KEY);
      
      console.log(`Successfully reactivated order ${id}`);
      return order;
    } catch (error) {
      console.error(`❌ Error reactivating order ${id}:`, error);
      throw error;
    }
  },

  /**
   * Update order status
   */
  updateOrderStatus: async (
    id: string,
    status: Order["status"]
  ): Promise<Order> => {
    try {
      const order = await requestHandler.patch<Order>(`orders/${id}/status`, { status });
      
      // Manually invalidate caches
      requestHandler.clearCache(ORDERS_CACHE_KEY);
      requestHandler.clearCache(`${ORDER_DETAIL_CACHE_PREFIX}${id}`);
      requestHandler.clearCache(OFF_SITE_ORDERS_CACHE_KEY);
      
      return order;
    } catch (error) {
      console.error(`❌ Error updating order status ${id}:`, error);
      throw error;
    }
  },

  /**
   * ✅ Assign a Tag ID to an order
   */
  assignTagToOrder: async (
    orderId: string,
    tagId: string
  ): Promise<Order> => {
    try {
      const order = await requestHandler.patch<Order>(`orders/${orderId}/tag`, { tagId });
      
      // Manually invalidate caches
      requestHandler.clearCache(ORDERS_CACHE_KEY);
      requestHandler.clearCache(`${ORDER_DETAIL_CACHE_PREFIX}${orderId}`);
      requestHandler.clearCache(OFF_SITE_ORDERS_CACHE_KEY);
      
      return order;
    } catch (error) {
      console.error(`❌ Error assigning tag to order ${orderId}:`, error);
      throw error;
    }
  },

  /**
   * Update an order's department and add a transition record
   */
  updateOrderDepartment: async (
    orderId: string, 
    departmentId: number, 
    departmentName: string,
    stationName: string,
    transition: { department: string, station: string, timestamp: number }
  ): Promise<Order> => {
    try {
      
      const order = await requestHandler.put<Order>(`orders/${orderId}/department`, {
        departmentId,
        departmentName,
        stationName,
        transition
      });
      
      // Manually invalidate caches
      requestHandler.clearCache(ORDERS_CACHE_KEY);
      requestHandler.clearCache(`${ORDER_DETAIL_CACHE_PREFIX}${orderId}`);
      requestHandler.clearCache(OFF_SITE_ORDERS_CACHE_KEY);
      
      console.log(`Successfully updated order ${orderId} department with transition`);
      
      return order;
    } catch (error) {
      console.error(`❌ Error updating order department ${orderId}:`, error);
      throw error;
    }
  },

  /**
   * ✅ Assign manual location to off-site order
   */
  assignManualLocation: async (
    orderId: string,
    location: OffSiteLocation | string,
    notes?: string
  ): Promise<Order> => {
    try {
      const order = await requestHandler.patch<Order>(`orders/${orderId}/location`, {
        location,
        notes
      });
      
      // Manually invalidate caches
      requestHandler.clearCache(ORDERS_CACHE_KEY);
      requestHandler.clearCache(`${ORDER_DETAIL_CACHE_PREFIX}${orderId}`);
      requestHandler.clearCache(OFF_SITE_ORDERS_CACHE_KEY);
      
      return order;
    } catch (error) {
      console.error(`❌ Error assigning manual location to order ${orderId}:`, error);
      throw error;
    }
  },

  /**
   * ✅ Manual trigger for off-site detection (for testing)
   */
  checkForMissingOrders: async (thresholdSeconds: number = 30): Promise<{ missingOrdersFound: number }> => {
    try {
      const result = await requestHandler.post<{ missingOrdersFound: number }>('orders/check-missing', {
        thresholdSeconds
      });
      
      // Invalidate caches after checking
      requestHandler.clearCache(ORDERS_CACHE_KEY);
      requestHandler.clearCache(OFF_SITE_ORDERS_CACHE_KEY);
      
      return result;
    } catch (error) {
      console.error('❌ Error checking for missing orders:', error);
      throw error;
    }
  },

  /**
   * ✅ Reset all tracking and check for missing orders
   */
  resetAndCheckTracking: async (): Promise<{ ordersReset: number, missingOrdersFound: number }> => {
    try {
      const result = await requestHandler.post<{ ordersReset: number, missingOrdersFound: number }>('orders/reset-and-check', {});
      
      // Clear all caches after reset
      requestHandler.clearCache(ORDERS_CACHE_KEY);
      requestHandler.clearCache(OFF_SITE_ORDERS_CACHE_KEY);
      
      return result;
    } catch (error) {
      console.error('❌ Error resetting and checking tracking:', error);
      throw error;
    }
  },

  /**
   * 🆕 NEW: Get all orders with tag history summary for Tag History page
   */
  getOrdersWithTagHistory: async (): Promise<OrderWithScanCount[]> => {
    try {
      return await requestHandler.get<OrderWithScanCount[]>("orders/tag-history");
    } catch (error) {
      console.error('❌ Error fetching orders with tag history:', error);
      throw error;
    }
  },

  /**
   * 🆕 NEW: Get detailed scan history for a specific order
   */
  getOrderScanHistory: async (orderId: string): Promise<OrderTagHistory> => {
    try {
      return await requestHandler.get<OrderTagHistory>(`orders/${orderId}/tag-history`);
    } catch (error) {
      console.error(`❌ Error fetching scan history for order ${orderId}:`, error);
      throw error;
    }
  },
};

export default orderService;