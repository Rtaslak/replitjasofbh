// types/stations.ts

export interface Station {
  id: string;
  name: string;
  description: string;
  orderIds: string[]; 
  status: 'active' | 'inactive' | 'maintenance';
  antennaNumber?: number;
  departmentId: string; // Changed from number to string
}

// ✅ Utility function to create a new Station
export const createStation = (
  name: string,
  description: string,
  departmentId: string, // Changed from number to string
  orderIds: string[] = []
): Station => {
  return {
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    description,
    orderIds,
    status: 'active', // Default
    departmentId // ✅ Assign it
  };
};

// ✅ Helper function to convert number departmentId to string if needed
export const convertDepartmentId = (id: number | string): string => {
  return id.toString();
};