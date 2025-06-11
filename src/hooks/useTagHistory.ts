import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSocket } from '@/context/SocketContext';
import { orderService } from '@/services/orderService';
import { OrderWithScanCount, OrderTagHistory, TagHistoryFilters, TagHistorySortConfig } from '@/types/orders';

interface UseTagHistoryReturn {
  // Data
  orders: OrderWithScanCount[];
  selectedOrderHistory: OrderTagHistory | null;
  
  // Loading states
  isLoading: boolean;
  isLoadingHistory: boolean;
  
  // Error states
  error: string | null;
  historyError: string | null;
  
  // Filters and sorting
  filters: TagHistoryFilters;
  sortConfig: TagHistorySortConfig;
  filteredOrders: OrderWithScanCount[];
  
  // Actions
  fetchOrders: () => Promise<void>;
  fetchOrderHistory: (orderId: string) => Promise<void>;
  clearOrderHistory: () => void;
  updateFilters: (newFilters: Partial<TagHistoryFilters>) => void;
  updateSort: (field: keyof OrderWithScanCount) => void;
  refreshData: () => Promise<void>;
}

export function useTagHistory(): UseTagHistoryReturn {
  // Socket for real-time updates
  const { socket } = useSocket();
  
  // State
  const [orders, setOrders] = useState<OrderWithScanCount[]>([]);
  const [selectedOrderHistory, setSelectedOrderHistory] = useState<OrderTagHistory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  
  // Filters and sorting
  const [filters, setFilters] = useState<TagHistoryFilters>({
    status: '',
    department: '',
    searchTerm: ''
  });
  
  const [sortConfig, setSortConfig] = useState<TagHistorySortConfig>({
    field: 'orderNumber',
    direction: 'desc'
  });

  // Fetch all orders with tag history
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const ordersData = await orderService.getOrdersWithTagHistory();
      setOrders(ordersData);
      console.log('📊 Tag history data refreshed:', ordersData.length, 'orders');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tag history';
      setError(errorMessage);
      console.error('Error fetching tag history:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch detailed scan history for a specific order
  const fetchOrderHistory = useCallback(async (orderId: string) => {
    setIsLoadingHistory(true);
    setHistoryError(null);
    
    try {
      const historyData = await orderService.getOrderScanHistory(orderId);
      setSelectedOrderHistory(historyData);
      console.log('📊 Order scan history refreshed:', historyData.scanHistory.length, 'scans');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch order scan history';
      setHistoryError(errorMessage);
      console.error('Error fetching order scan history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // Clear selected order history
  const clearOrderHistory = useCallback(() => {
    setSelectedOrderHistory(null);
    setHistoryError(null);
  }, []);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<TagHistoryFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Update sorting
  const updateSort = useCallback((field: keyof OrderWithScanCount) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  }, []);

  // 🆕 ENHANCED: Handle real-time order updates with debouncing
  const handleOrderUpdate = useCallback((updatedOrder: any) => {
    console.log('🔄 Real-time order update received:', updatedOrder.orderNumber);
    
    setOrders(prevOrders => {
      const orderIndex = prevOrders.findIndex(order => order.id === updatedOrder.id);
      
      if (orderIndex !== -1) {
        // Update existing order with new location info
        const newOrders = [...prevOrders];
        newOrders[orderIndex] = {
          ...newOrders[orderIndex],
          status: updatedOrder.status,
          currentDepartment: updatedOrder.currentDepartment,
          currentStation: updatedOrder.currentStation,
          // Keep existing scanCount - will be refreshed by the debounced refresh
        };
        console.log(`📍 Updated order ${updatedOrder.orderNumber} location: ${updatedOrder.currentDepartment} > ${updatedOrder.currentStation}`);
        return newOrders;
      }
      
      return prevOrders;
    });
    
    // Also update the selected order history if it's the same order
    if (selectedOrderHistory && selectedOrderHistory.order.id === updatedOrder.id) {
      setSelectedOrderHistory(prev => ({
        ...prev!,
        order: {
          ...prev!.order,
          status: updatedOrder.status
        }
      }));
    }
  }, [selectedOrderHistory]);

  // 🆕 NEW: Debounced refresh function
  const debouncedRefresh = useCallback(() => {
    const timeoutId = setTimeout(() => {
      console.log('🔄 Debounced refresh: Fetching updated scan counts...');
      fetchOrders();
      
      // Also refresh the selected order's detailed history
      if (selectedOrderHistory) {
        fetchOrderHistory(selectedOrderHistory.order.id);
      }
    }, 2000); // Wait 2 seconds after last RFID event

    return timeoutId;
  }, [fetchOrders, fetchOrderHistory, selectedOrderHistory]);

  // 🆕 ENHANCED: Listen to WebSocket events with better handling
  useEffect(() => {
    if (!socket) return;

    let refreshTimeoutId: NodeJS.Timeout;

    // Listen for order updates (location changes)
    socket.on('order_updated', handleOrderUpdate);
    
    // Listen for RFID events and trigger debounced refresh for scan counts
    socket.on('rfid_event', (event) => {
      console.log('📡 RFID event detected, will refresh scan counts...');
      
      // Clear existing timeout and set new one
      if (refreshTimeoutId) {
        clearTimeout(refreshTimeoutId);
      }
      refreshTimeoutId = debouncedRefresh();
    });

    return () => {
      socket.off('order_updated', handleOrderUpdate);
      socket.off('rfid_event');
      if (refreshTimeoutId) {
        clearTimeout(refreshTimeoutId);
      }
    };
  }, [socket, handleOrderUpdate, debouncedRefresh]);

  // Filter and sort orders
  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    // Apply filters
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    if (filters.department) {
      filtered = filtered.filter(order => order.currentDepartment === filters.department);
    }

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.orderNumber.toString().includes(searchLower) ||
        order.customer.toLowerCase().includes(searchLower) ||
        order.tagId?.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.field];
      const bValue = b[sortConfig.field];
      
      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;
      
      return sortConfig.direction === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [orders, filters, sortConfig]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await fetchOrders();
    if (selectedOrderHistory) {
      await fetchOrderHistory(selectedOrderHistory.order.id);
    }
  }, [fetchOrders, fetchOrderHistory, selectedOrderHistory]);

  // Initial data fetch
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    // Data
    orders,
    selectedOrderHistory,
    
    // Loading states
    isLoading,
    isLoadingHistory,
    
    // Error states
    error,
    historyError,
    
    // Filters and sorting
    filters,
    sortConfig,
    filteredOrders,
    
    // Actions
    fetchOrders,
    fetchOrderHistory,
    clearOrderHistory,
    updateFilters,
    updateSort,
    refreshData
  };
}

export default useTagHistory;