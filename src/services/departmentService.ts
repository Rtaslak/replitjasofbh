// src/services/departmentService.ts
import requestHandler from "@/utils/api/requestHandler";

export interface Department {
  id: string;
  name: string;
  color?: string;
  readerId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Cache keys
const DEPARTMENTS_CACHE_KEY = 'departments';
const DEPARTMENT_DETAIL_CACHE_PREFIX = 'department_';

export const departmentService = {
  /**
   * Get all departments with caching
   */
  getAllDepartments: async (): Promise<Department[]> => {
    try {
      return await requestHandler.get<Department[]>("departments");
    } catch (error) {
      console.error('❌ Error fetching departments:', error);
      return [];
    }
  },

  /**
   * Get a department by ID with caching
   */
  getDepartmentById: async (id: string): Promise<Department | null> => {
    try {
      return await requestHandler.get<Department>(`departments/${id}`);
    } catch (error) {
      console.error(`❌ Error fetching department ${id}:`, error);
      return null;
    }
  },

  /**
   * Create a new department
   */
  createDepartment: async (department: Omit<Department, 'id'>): Promise<Department | null> => {
    try {
      return await requestHandler.post<Department>("departments", department);
    } catch (error) {
      console.error('❌ Error creating department:', error);
      throw error;
    }
  },

  /**
   * Update an existing department
   */
  updateDepartment: async (id: string, department: Partial<Department>): Promise<Department | null> => {
    try {
      return await requestHandler.put<Department>(`departments/${id}`, department);
    } catch (error) {
      console.error(`❌ Error updating department ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a department by ID
   */
  deleteDepartment: async (id: string): Promise<boolean> => {
    try {
      await requestHandler.delete<void>(`departments/${id}`);
      return true;
    } catch (error) {
      console.error(`❌ Error deleting department ${id}:`, error);
      return false;
    }
  },
  
  /**
   * Assign a reader to a department
   */
  assignReaderToDepartment: async (departmentId: string, readerId: string): Promise<Department | null> => {
    try {
      return await requestHandler.patch<Department>(`departments/${departmentId}/reader`, { readerId });
    } catch (error) {
      console.error(`❌ Error assigning reader to department ${departmentId}:`, error);
      return null;
    }
  }
};

export default departmentService;