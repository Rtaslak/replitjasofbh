import { useState } from "react";
import PageTransition from "@/components/layout/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StationsGrid from "@/components/stations/StationsGrid";
import StationOrdersTable from "@/components/stations/StationOrdersTable";
import StationHeader from "@/components/stations/StationHeader";
import { useStationManagement } from "@/hooks/useStationManagement";
import { Button } from "@/components/ui/button";
import { useAuthUser } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function Stations() {
  const {
    department,
    stations,
    selectedStation,
    stationOrders,
    showStationsUI,
    handleStationSelect,
    navigate,
    setSelectedStation,
  } = useStationManagement();

  const { user } = useAuthUser();
  const userRole = user?.role || "";
  
  // Add state for search query
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter station orders based on search query
  const filteredStationOrders = stationOrders.filter(order => {
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
    
    // Search by station name
    const stationMatch = order.currentStation && 
      order.currentStation.toString().toLowerCase().includes(query);
    
    return orderNumberMatch || customerMatch || designerMatch || 
           submittedByMatch || orderIdMatch || stationMatch;
  });

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 p-6 md:p-8">
        <StationHeader department={department} onBackClick={() => navigate("/")} />

        {/* Station selection */}
        {showStationsUI && (
          <Card>
            <CardHeader>
              <CardTitle>Stations</CardTitle>
            </CardHeader>
            <CardContent>
              <StationsGrid
                stations={stations}
                departmentColor={department?.color || "#1e293b"}
                departmentName={department?.name || ""}
                selectedStation={selectedStation}
                onStationSelect={handleStationSelect}
                departmentId={department?.id}
                userRole={userRole} // ✅ Pass role in case grid needs it
              />
            </CardContent>
          </Card>
        )}

        {/* Orders table */}
        <Card>
          <CardHeader className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div className="flex flex-col space-y-1">
              <CardTitle>
                {selectedStation
                  ? `Orders in ${selectedStation} Station`
                  : `All Orders in ${department?.name} Department`}
              </CardTitle>
              {filteredStationOrders.length > 0 && searchQuery && (
                <p className="text-sm text-muted-foreground">
                  Found {filteredStationOrders.length} matching orders
                </p>
              )}
            </div>
            
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search orders or customers"
                  className="w-full pl-9 pr-4"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {/* Back button */}
              {selectedStation && (
                <Button
                  variant="outline"
                  onClick={() => setSelectedStation(null)}
                  className="text-sm"
                >
                  ← Back to Department Orders
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredStationOrders.length > 0 ? (
              <StationOrdersTable stationOrders={filteredStationOrders} />
            ) : (
              <div className="flex justify-center items-center p-10 text-center">
                <div>
                  <p className="font-semibold mb-1">No orders found</p>
                  {searchQuery ? (
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your search criteria
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No orders are currently in this {selectedStation ? "station" : "department"}
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