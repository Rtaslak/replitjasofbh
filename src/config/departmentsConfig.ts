// Department ID → Color (used in UI styling)
export const departmentColors: Record<number, string> = {
  4: "#3b82f6", // Designers
  5: "#f59e0b", // Jewelers
  6: "#10b981", // Setters
  7: "#8b5cf6", // Polishers
  8: "#ec4899", // Diamond Counting
  9: "#6366f1", // Shipping
};

// Reader hostname (lowercase) → Department ID
export const readerToDepartmentMap = new Map<string, number>([
  ["fx96006e8f12", 5], // Jewelers
  ["fx96006e8fb7", 6], // Setters
  ["fx96006e906c", 4], // Designers
]);

// Department-specific antenna number → Station index
export const departmentAntennaMap: Record<number, Record<string, number>> = {
  4: { // Designers
    "1": 0, "2": 1, "3": 2, "4": 3, "5": 4,
  },
  5: { // Jewelers
    "1": 0, "2": 1, "3": 2, "4": 3,
    "5": 4, "6": 5, "7": 6, "8": 7,
  },
  6: { // Setters
    "1": 0, "2": 1, "3": 2, "4": 3, "5": 4,
  },
};

// Special antenna overrides (e.g. antenna X on reader Y goes to department Z)
export const specialCaseAntennaMap: Array<{
  readerId: string;
  antenna: string;
  departmentId: number;
}> = [
  {
    readerId: "fx96006e8fb7",
    antenna: "6",
    departmentId: 7, // Polishers
  },
];
