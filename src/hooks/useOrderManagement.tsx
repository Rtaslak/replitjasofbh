import { useState, useCallback } from 'react';
import { Order } from '@/types/orders';
import { useOrdersData } from './orders/useOrdersData';
import { useOrderDeletion } from './orders/useOrderDeletion';
import orderService from '@/services/orderService';
import { toast } from 'sonner';

export function useOrderManagement() {
  const { ordersList, isLoading, refreshOrders, updateSingleOrder } = useOrdersData();
  const { deleteOrder, deleteMultipleOrders, isDeleting } = useOrderDeletion();
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Select/deselect order
  const toggleOrderSelection = useCallback((orderId: string) => {
    setSelectedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  }, []);
  
  // Select/deselect all orders
  const toggleSelectAll = useCallback((selectAll: boolean) => {
    if (selectAll) {
      const allIds = new Set(ordersList.map(order => order.id));
      setSelectedOrders(allIds);
    } else {
      setSelectedOrders(new Set());
    }
  }, [ordersList]);
  
  // Delete single order
  const handleDeleteOrder = useCallback(async (orderId: string) => {
    const success = await deleteOrder(orderId);
    if (success) {
      // Remove from selected orders
      setSelectedOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
      // Refresh orders list
      refreshOrders();
    }
  }, [deleteOrder, refreshOrders]);
  
  // Delete multiple orders
  const handleDeleteSelected = useCallback(async () => {
    if (selectedOrders.size === 0) return;
    
    const success = await deleteMultipleOrders(Array.from(selectedOrders));
    if (success) {
      setSelectedOrders(new Set());
      refreshOrders();
    }
  }, [selectedOrders, deleteMultipleOrders, refreshOrders]);
  
  // Assign tag to order
  const handleAssignTag = useCallback(async (orderId: string, tagId: string) => {
    setIsUpdating(true);
    try {
      const updatedOrder = await orderService.assignTagToOrder(orderId, tagId);
      updateSingleOrder(orderId, updatedOrder);
      toast.success("Tag Assigned", {
        description: `Tag ${tagId} has been assigned to order ${updatedOrder.orderNumber || orderId}.`
      });
    } catch (error) {
      console.error("Error assigning tag:", error);
      toast.error("Tag Assignment Failed", {
        description: "Failed to assign tag. Please try again."
      });
    } finally {
      setIsUpdating(false);
    }
  }, [updateSingleOrder]);

  return {
    orders: ordersList,
    isLoading: isLoading || isDeleting || isUpdating,
    selectedOrders,
    toggleOrderSelection,
    toggleSelectAll,
    handleDeleteOrder,
    handleDeleteSelected,
    handleAssignTag,
    refreshOrders
  };
}