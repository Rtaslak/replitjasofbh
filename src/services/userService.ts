import requestHandler from '@/utils/api/requestHandler';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  enabled?: boolean;
  createdAt?: string;
}

export const getUsers = async (): Promise<User[]> => {
  try {
    return await requestHandler.get<User[]>('/users');
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const createUser = async (userData: { 
  email: string; 
  name: string; 
  role: string; 
  password: string;
}): Promise<User | null> => {
  try {
    return await requestHandler.post<User>('/users', userData);
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const updateUser = async (id: string, userData: Partial<User>): Promise<User | null> => {
  try {
    return await requestHandler.put<User>(`/users/${id}`, userData);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async (id: string): Promise<boolean> => {
  try {
    await requestHandler.delete(`/users/${id}`);
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
};

export const resetUserPassword = async (id: string): Promise<string | null> => {
  try {
    const response = await requestHandler.post<{ tempPassword: string }>(`/users/${id}/reset-password`);
    return response.tempPassword;
  } catch (error) {
    console.error('Error resetting user password:', error);
    return null;
  }
};