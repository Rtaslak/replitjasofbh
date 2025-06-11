import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle, MapPin, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useOrders } from "@/context/orders/OrdersContext";
import { getOrderLocationDisplay, getTimeSinceLastScan, OFF_SITE_LOCATIONS, OffSiteLocation } from "@/types/orders";
import PageTransition from "@/components/layout/PageTransition";
import { toast } from "sonner";

export default function OffSitePage() {
  const navigate = useNavigate();
  const { offSiteOrders, assignManualLocation, checkForMissingOrders, fetchOffSiteOrders } = useOrders();
  const [selectedLocation, setSelectedLocation] = useState<{[orderId: string]: string}>({});
  const [locationNotes, setLocationNotes] = useState<{[orderId: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);

  // Fetch off-site orders on component mount
  useEffect(() => {
    fetchOffSiteOrders();
  }, [fetchOffSiteOrders]);

  const handleAssignLocation = useCallback(async (orderId: string) => {
    const location = selectedLocation[orderId];
    const notes = locationNotes[orderId];
    
    if (!location) {
      toast.error("Please select a location");
      return;
    }
    
    if (assignManualLocation) {
      const success = await assignManualLocation(orderId, location, notes);
      if (success) {
        // Clear the form
        setSelectedLocation(prev => ({ ...prev, [orderId]: "" }));
        setLocationNotes(prev => ({ ...prev, [orderId]: "" }));
      }
    }
  }, [selectedLocation, locationNotes, assignManualLocation]);

  const handleCheckMissing = useCallback(async () => {
    setIsLoading(true);
    try {
      await checkForMissingOrders();
    } finally {
      setIsLoading(false);
    }
  }, [checkForMissingOrders]);

  const handleOrderClick = useCallback((orderId: string) => {
    navigate(`/orders/${orderId}`);
  }, [navigate]);

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <h1 className="text-2xl font-bold">Off-Site Orders</h1>
                <p className="text-sm text-muted-foreground">
                  Orders not currently tracked by RFID system
                </p>
              </div>
              <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                {offSiteOrders.length} orders
              </Badge>
            </div>
          </div>
          
          <Button
            variant="outline"
            onClick={handleCheckMissing}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Check Missing
          </Button>
        </div>

        {/* Orders Table */}
        <div className="rounded-md border shadow-sm overflow-hidden bg-card">
          {offSiteOrders.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Off-Site Orders</h3>
              <p className="text-sm text-gray-500 mb-4">All orders are currently tracked by RFID</p>
              <Button variant="outline" onClick={handleCheckMissing}>
                Check for Missing Orders
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Tag ID</TableHead>
                  <TableHead>Current Location</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Assign Location</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offSiteOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <button
                        onClick={() => handleOrderClick(order.id)}
                        className="text-primary hover:underline"
                      >
                        #{order.orderNumber}
                      </button>
                    </TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell>
                      {order.tagId ? (
                        <Badge variant="outline" className="text-xs">
                          {order.tagId}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">No tag</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{getOrderLocationDisplay(order)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{getTimeSinceLastScan(order)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.location_notes && (
                        <span className="text-xs text-muted-foreground italic">
                          {order.location_notes}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {order.current_location_type === 'off-site' && (
                        <div className="space-y-2 min-w-48">
                          <Select
                            value={selectedLocation[order.id] || ""}
                            onValueChange={(value) => 
                              setSelectedLocation(prev => ({ ...prev, [order.id]: value }))
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Select location..." />
                            </SelectTrigger>
                            <SelectContent>
                              {OFF_SITE_LOCATIONS.map((location) => (
                                <SelectItem key={location} value={location} className="text-xs">
                                  {location}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <Textarea
                            placeholder="Optional notes..."
                            value={locationNotes[order.id] || ""}
                            onChange={(e) => 
                              setLocationNotes(prev => ({ ...prev, [order.id]: e.target.value }))
                            }
                            className="h-8 text-xs resize-none"
                          />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {order.current_location_type === 'off-site' && (
                        <Button
                          size="sm"
                          onClick={() => handleAssignLocation(order.id)}
                          disabled={!selectedLocation[order.id]}
                          className="h-8 px-3 text-xs"
                        >
                          Assign
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </PageTransition>
  );
}