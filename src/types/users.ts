export type UserRole = 'Administrator' | 'Salesperson' | 'Operator';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  password?: string; // Password field is optional in the main type
  enabled?: boolean; // Added for Cognito integration
}

export interface UserCreateInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  password: string;
  confirmPassword?: string;
}

export interface UserUpdateInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  password?: string;
  name?: string; // Added name field to allow updates
  enabled?: boolean; // Added for Cognito integration
}

// Added for password reset functionality
export interface PasswordResetResult {
  email: string;
  tempPassword?: string;
  success: boolean;
  message?: string;
}

// Helper function to split a full name into first and last name
export const splitFullName = (fullName: string): { firstName: string, lastName: string } => {
  const nameParts = fullName.trim().split(/\s+/);
  if (nameParts.length === 1) {
    return {
      firstName: nameParts[0],
      lastName: ''
    };
  }
  return {
    firstName: nameParts[0],
    lastName: nameParts.slice(1).join(' ')
  };
};

// Helper function to create full name from first and last name
export const createFullName = (firstName: string, lastName: string): string => {
  return `${firstName} ${lastName}`.trim();
};