// src/services/settingsService.ts

import { apiClient } from "@/utils/api"; // ✅ your real API client
import { Department } from "@/types/departments";
import { Station } from "@/types/stations";

// ✅ Fetch all departments (with stations inside)
export async function fetchDepartments(): Promise<Department[]> {
  return await apiClient.get<Department[]>("/departments");
}

// ✅ Fetch stations for a specific department
export async function fetchStations(departmentId: number): Promise<Station[]> {
  return await apiClient.get<Station[]>(`/departments/${departmentId}/stations`);
}

// ✅ Create a new department (full object: name, description, color)
export async function createDepartment(data: {
  name: string;
  description: string;
  color: string;
}): Promise<Department> {
  return await apiClient.post<Department>("/departments", data);
}

export async function getAuditLogs() {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/audit-logs`, { credentials: 'include' });
  if (!response.ok) throw new Error("Failed to load audit logs");
  return await response.json();
  
}

// ✅ Create a new station (full object: name, description, antennaNumber)
export async function createStation(
  departmentId: number,
  name: string,
  description: string,
  antennaNumber: number
): Promise<Station> {
  return apiClient.post<Station>(`/departments/${departmentId}/stations`, {
    name,
    description,
    antennaNumber,
  });



}
