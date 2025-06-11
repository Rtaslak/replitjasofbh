// src/services/stationService.ts
import requestHandler from "@/utils/api/requestHandler";

export interface Station {
  id: string;
  name: string;
  departmentId?: string;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Cache keys
const STATIONS_CACHE_KEY = 'stations';
const STATION_DETAIL_CACHE_PREFIX = 'station_';

export const stationService = {
  /**
   * Get all stations with caching
   */
  getAllStations: async (): Promise<Station[]> => {
    try {
      return await requestHandler.get<Station[]>("stations");
    } catch (error) {
      console.error('❌ Error fetching stations:', error);
      return [];
    }
  },
  
  /**
   * Get stations by department ID
   */
  getStationsByDepartment: async (departmentId: string): Promise<Station[]> => {
    try {
      return await requestHandler.get<Station[]>(`departments/${departmentId}/stations`);
    } catch (error) {
      console.error(`❌ Error fetching stations for department ${departmentId}:`, error);
      return [];
    }
  },

  /**
   * Get a station by ID with caching
   */
  getStationById: async (id: string): Promise<Station | null> => {
    try {
      return await requestHandler.get<Station>(`stations/${id}`);
    } catch (error) {
      console.error(`❌ Error fetching station ${id}:`, error);
      return null;
    }
  },

  /**
   * Create a new station
   */
  createStation: async (station: Omit<Station, 'id'>): Promise<Station | null> => {
    try {
      return await requestHandler.post<Station>("stations", station);
    } catch (error) {
      console.error('❌ Error creating station:', error);
      throw error;
    }
  },

  /**
   * Update an existing station
   */
  updateStation: async (id: string, station: Partial<Station>): Promise<Station | null> => {
    try {
      return await requestHandler.put<Station>(`stations/${id}`, station);
    } catch (error) {
      console.error(`❌ Error updating station ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a station by ID
   */
  deleteStation: async (id: string): Promise<boolean> => {
    try {
      await requestHandler.delete<void>(`stations/${id}`);
      return true;
    } catch (error) {
      console.error(`❌ Error deleting station ${id}:`, error);
      return false;
    }
  },
  
  /**
   * Update station order within a department
   */
  updateStationOrder: async (stationId: string, order: number): Promise<Station | null> => {
    try {
      return await requestHandler.patch<Station>(`stations/${stationId}/order`, { order });
    } catch (error) {
      console.error(`❌ Error updating station order ${stationId}:`, error);
      return null;
    }
  }
};

export default stationService;