
import { Order } from "@/types/orders";

/**
 * Filters and sorts orders based on the provided criteria
 */
export function filterOrders(
  orders: Order[], 
  searchTerm: string = "", 
  statusFilter: string = "all"
): Order[] {
  return orders.filter((order) => {
    const matchesSearch = 
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
}

/**
 * Formats an order's date for display
 */
export function formatOrderDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}
