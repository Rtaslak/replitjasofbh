import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { departmentColors, departmentsWithoutStations } from "@/utils/stationConstants";
import { Department } from "@/types/departments";
import { Station } from "@/types/stations";
import { Order, isOrderOffSite } from "@/types/orders";
import { useOrders } from "@/context/orders/OrdersContext";
import { useDepartmentData } from "@/utils/orders/departmentManagement";

export function useStationManagement() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orders } = useOrders();
  const { departments, stations } = useDepartmentData();

  const [department, setDepartment] = useState<(Department & { orders: Order[] }) | null>(null);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);

  // ✅ Parse dept ID from query string and initialize department
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const deptId = Number(params.get("dept"));

    if (!deptId || departments.length === 0 || stations.length === 0) return;

    const realDept = departments.find(d => d.id === deptId);

    if (!realDept) {
      console.warn(`[WARN] Department ID ${deptId} not found`);
      navigate("/");
      return;
    }

    // Use string conversion to safely compare
    const deptIdString = String(deptId);
    
    // Filter stations - comparing as strings to avoid type issues
    const deptStations = stations.filter(s => 
      String(s.departmentId) === deptIdString
    );

    console.log(`Found ${deptStations.length} stations for department ${deptId}`);

    setDepartment({
      id: realDept.id,
      name: realDept.name,
      description: realDept.description ?? "Current items in department",
      color: departmentColors[realDept.id] ?? "#1e293b",
      stations: deptStations,
      orders: []
    });
  }, [location, navigate, departments, stations]);

  const currentStations: Station[] = department?.stations || [];

  const stationOrders = useMemo(() => {
    if (!department) return [];
    
    // Debug logs
    console.log("Department:", department.name);
    console.log("Total orders:", orders.length);
    
    // ✅ SIMPLIFIED FILTERING - Remove strict location type checks
    const filteredOrders = orders.filter(order => {
      // Just check department match (remove strict location/off-site checks)
      const matchesDept = order.currentDepartment === department.name;
      if (!matchesDept) return false;
      
      // Check station match (if station is selected)
      const matchesStation = selectedStation ? order.currentStation === selectedStation : true;
      
      return matchesStation;
    });
    
    console.log(`Filtered ${filteredOrders.length} orders for department ${department.name}`);
    
    return filteredOrders;
  }, [orders, department, selectedStation]);

  const handleStationSelect = useCallback((stationName: string) => {
    setSelectedStation(stationName);
  }, []);

  const showStationsUI = department && !departmentsWithoutStations.includes(department.id);

  return {
    department,
    selectedStation,
    setSelectedStation, // ✅ Include this for programmatic control (e.g., clear on back button)
    stationOrders,
    stations: currentStations,
    showStationsUI,
    handleStationSelect,
    navigate
  };
}