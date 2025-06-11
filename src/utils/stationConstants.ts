// src/utils/stationConstants.ts

// Used to style departments consistently by ID
export const departmentColors: Record<number, string> = {
  4: "#3b82f6", // Designers
  5: "#f59e0b", // Jewelers
  6: "#10b981", // Setters
  7: "#8b5cf6", // Polishers
  8: "#ec4899", // Diamond Counting
  9: "#6366f1"  // Shipping
};

// Departments that should not show station cards in the UI
export const departmentsWithoutStations = [8, 9]; // Diamond Counting, Shipping
