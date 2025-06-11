import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageTransition from "@/components/layout/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowLeft } from "lucide-react";
import { useOrders } from "@/context/orders/OrdersContext";
import { Order } from "@/types/orders";
import CompletedOrdersTable from "@/components/orders/CompletedOrdersTable";

export default function CompletedOrders() {
  const navigate = useNavigate();
  const { orders, isLoading, refreshOrders } = useOrders();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter for completed orders only
  const completedOrders = orders?.filter(order => order.status === "completed") || [];
  
  // Filter completed orders based on search query
  const filteredCompletedOrders = completedOrders.filter(order => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    
    // Search by order number (as string)
    const orderNumberMatch = order.orderNumber && 
      order.orderNumber.toString().toLowerCase().includes(query);
    
    // Search by customer name
    const customerMatch = order.customer && 
      order.customer.toString().toLowerCase().includes(query);
    
    // Search by designer/salesperson
    const designerMatch = order.designer && 
      order.designer.toString().toLowerCase().includes(query);
      
    // Search by submittedBy
    const submittedByMatch = order.submittedBy && 
      order.submittedBy.toString().toLowerCase().includes(query);
    
    // Search by order id
    const orderIdMatch = order.id && 
      order.id.toString().toLowerCase().includes(query);
    
    return orderNumberMatch || customerMatch || designerMatch || 
           submittedByMatch || orderIdMatch;
  });

  // Handle order reactivation callback
  const handleOrderReactivated = async (orderId: string) => {
    // Refresh orders to remove the reactivated order from completed list
    await refreshOrders();
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="container py-6">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-muted-foreground">Loading completed orders...</div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/")}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Completed Orders</h1>
            <p className="text-muted-foreground">
              View and manage orders that have been marked as completed
            </p>
          </div>
        </div>

        {/* Completed Orders Table */}
        <Card>
          <CardHeader className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div className="flex flex-col space-y-1">
              <CardTitle>
                Completed Orders ({filteredCompletedOrders.length})
              </CardTitle>
              {filteredCompletedOrders.length > 0 && searchQuery && (
                <p className="text-sm text-muted-foreground">
                  Found {filteredCompletedOrders.length} matching completed orders
                </p>
              )}
            </div>
            
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search completed orders"
                  className="w-full pl-9 pr-4"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredCompletedOrders.length > 0 ? (
              <CompletedOrdersTable 
                completedOrders={filteredCompletedOrders}
                onOrderReactivated={handleOrderReactivated}
              />
            ) : (
              <div className="flex justify-center items-center p-10 text-center">
                <div>
                  <p className="font-semibold mb-1">
                    {searchQuery ? "No matching completed orders" : "No completed orders found"}
                  </p>
                  {searchQuery ? (
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your search criteria
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Orders that are marked as completed will appear here
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}