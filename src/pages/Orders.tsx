// src/pages/Orders.tsx
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import PageTransition from "@/components/layout/PageTransition";
import { OrderList } from "@/components/orders/OrderList";
import OrderFilters from "@/components/orders/OrderFilters";
import { OrderCardView } from "@/components/orders/OrderCardView";
import { Button } from "@/components/ui/button";
import { ListFilter, LayoutGrid, RefreshCw } from "lucide-react";
import { Order, OrderStatus, SelectedOrders } from "@/types/orders";
import { 
  ensureOrdersArray, 
  ensureSelectedOrders, 
  selectedOrdersToArray 
} from "@/types/compatibility";
import { useOrders } from "@/context/orders/OrdersContext";
import { OrderActionBar } from "@/components/orders/OrderActionBar";
import orderService from "@/services/orderService";

export default function Orders() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  
  const { 
    filteredOrders,
    selectedOrders,
    isLoading,
    searchTerm,
    statusFilter,
    setSearchTerm,
    setStatusFilter,
    selectOrder,
    selectAllOrders,
    toggleEditMode,
    saveEdit,
    deleteOrder,
    deleteSelectedOrders,
    assignTag,
    refreshOrders
  } = useOrders();

  useEffect(() => {
   
    if (filteredOrders && Array.isArray(filteredOrders)) {
    
    } else {
      console.warn("[Orders Page] filteredOrders is not an array:", typeof filteredOrders);
    }
    return () => {
 
    };
  }, [filteredOrders]);

  // Safe access to data with proper type handling
  const safeFilteredOrders = ensureOrdersArray(filteredOrders);
  const safeSelectedOrders = ensureSelectedOrders(selectedOrders);
  const selectedOrdersArray = selectedOrdersToArray(safeSelectedOrders);
  const safeSearchTerm = searchTerm || "";
  const safeStatusFilter = (statusFilter || "all") as OrderStatus;

  // Function to adapt selectOrder to match the expected interface
  const handleSelectOrder = (orderId: string) => {
    const isCurrentlySelected = selectedOrders.has(orderId);
    selectOrder(orderId, !isCurrentlySelected);
  };

  // Handle saving edits
  const handleSaveEdit = (orderId: string) => {
    const order = safeFilteredOrders.find(o => o.id === orderId);
    if (order) {
      saveEdit(order);
    }
  };

  // New function to handle navigation to New Order form
  const handleNewOrderClick = () => {
    navigate('/orders/new');
  };

  // Handle refresh
  const handleRefresh = () => {
    refreshOrders();
  };

  // Handle completing selected orders
  const handleCompleteSelected = async () => {
    if (selectedOrdersArray.length === 0) return;
    
    try {
      await orderService.completeMultipleOrders(selectedOrdersArray);
      
      toast.success("Orders Completed", {
        description: `Successfully completed ${selectedOrdersArray.length} order(s). They have been moved to completed orders.`
      });
      
      // Refresh the orders to reflect changes
      refreshOrders();
    } catch (error) {
      console.error('Error completing orders:', error);
      toast.error("Failed to Complete Orders", {
        description: "There was an error completing the selected orders. Please try again."
      });
    }
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="container py-6">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-muted-foreground">Loading orders...</div>
          </div>
        </div>
      </PageTransition>
    );
  }



  return (
    <PageTransition>
      <div className="container py-6">
        <div className="flex flex-col space-y-1.5 mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            Manage and track your manufacturing orders
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <OrderFilters 
            searchTerm={safeSearchTerm}
            statusFilter={safeStatusFilter}
            setSearchTerm={setSearchTerm}
            setStatusFilter={setStatusFilter}
          />
          
          <div className="flex flex-col sm:flex-row gap-2 items-center">
            <div className="flex items-center gap-2 ml-0 sm:ml-2">
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                className="h-8 text-xs flex items-center gap-1"
                size="sm"
              >
                <RefreshCw className="h-3 w-3" />
                Refresh
              </Button>
              <Button 
                variant={viewMode === 'list' ? "default" : "outline"} 
                size="icon" 
                onClick={() => setViewMode('list')}
                className="h-8 w-8"
              >
                <ListFilter className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === 'card' ? "default" : "outline"} 
                size="icon" 
                onClick={() => setViewMode('card')}
                className="h-8 w-8"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
            <OrderActionBar
              selectedOrders={safeSelectedOrders}
              onDeleteSelected={deleteSelectedOrders}
              onCompleteSelected={handleCompleteSelected}
              onCreateNew={handleNewOrderClick}
            />
          </div>
        </div>
      
        {safeFilteredOrders.length === 0 ? (
          <div className="text-center py-10 border rounded-md bg-muted/20">
            <p className="text-lg text-muted-foreground mb-4">No Orders Found</p>
            <p className="max-w-md mx-auto mb-6 text-sm text-muted-foreground">
              There are no orders in the system matching your current filters. 
              Try clearing your filters or create a new order.
            </p>
            <Button onClick={handleNewOrderClick}>
              Create New Order
            </Button>
          </div>
       
) : viewMode === 'list' ? (
          <OrderList 
            orders={safeFilteredOrders}
            selectedOrders={safeSelectedOrders}
            onSelectOrder={handleSelectOrder}
            onSelectAll={selectAllOrders}
            onSaveEdit={handleSaveEdit}
            onDeleteOrder={deleteOrder}
            onToggleEditMode={toggleEditMode}
            onDeleteSelected={deleteSelectedOrders}
            onAssignTag={assignTag}
            statusFilter={safeStatusFilter} // ✅ ADDED THIS LINE
          />
        ) : (
          <OrderCardView
            orders={safeFilteredOrders}
            selectedOrders={selectedOrdersArray}
            onSelectOrder={handleSelectOrder}
            onDeleteOrder={deleteOrder}
            onAssignTag={assignTag}
          />
        )}
      </div>
    </PageTransition>
  );
}