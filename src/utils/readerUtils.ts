
import { toast } from "sonner";

export const departments = [
  { id: 1, name: "Designers" },
  { id: 2, name: "Jewelers" },
  { id: 3, name: "Setters" },
  { id: 4, name: "Polishers" },
  { id: 5, name: "Diamond Counting" },
  { id: 6, name: "Shipping" }
];

export const getDepartmentStations = (departmentId: number) => {
  switch (departmentId) {
    case 1: // Designers
      return [
        { name: "Designers", description: "Main design station" },
        { name: "Jed's Office", description: "Creative design hub" },
      ];
    case 2: // Jewelers
      return [
        { name: "Roger", description: "Master jeweler" },
        { name: "Tro", description: "Gold specialist" },
        { name: "Vicken", description: "Platinum expert" },
        { name: "Simon", description: "Casting specialist" },
        { name: "Hratch", description: "Assembly technician" },
        { name: "Ara", description: "Stone setting prep" },
        { name: "Hrant", description: "Metals fabrication" },
        { name: "Ardziv", description: "Fine details specialist" },
        { name: "Engraving", description: "Custom engraving station" },
      ];
    case 3: // Setters
      return [
        { name: "Sako", description: "Diamond setting expert" },
        { name: "Paolo", description: "Precision setting specialist" },
        { name: "Hovig", description: "Fine detail setter" },
        { name: "Steve Tch", description: "Technical setting expert" },
        { name: "Steve", description: "Custom setting specialist" },
      ];
    case 4: // Polishers
      return [
        { name: "Polisher", description: "Main polishing station" }
      ];
    case 5: // Diamond Counting
      return [
        { name: "Diamond Counting", description: "Diamond verification station" }
      ];
    case 6: // Shipping
      return [
        { name: "Shipping", description: "Final shipping station" }
      ];
    default:
      return [];
  }
};

export const getAllDepartmentStations = () => {
  const allStations = [];

  for (const dept of departments) {
    const deptStations = getDepartmentStations(dept.id);
    allStations.push(...deptStations.map(station => ({
      ...station,
      departmentId: dept.id,
      departmentName: dept.name
    })));
  }

  return allStations;
};

export const mapAntennaToStation = async (
  rfidService: any, 
  departmentId: number, 
  readerId: string, 
  antennaNumber: string, 
  stationIndex: string
): Promise<boolean> => {
  try {
    // Special cases for different readers and antennas
    let effectiveDepartmentId = departmentId;

    // Setters reader antenna 6 maps to Polishers
    if (readerId.toLowerCase() === 'fx96006e8fb7' && antennaNumber === '6') {
      effectiveDepartmentId = 4; // Polisher department
    }
    // Designers reader antenna 6 maps to Jewelers (Ardziv)
    else if (readerId.toLowerCase() === 'fx96006e906c' && antennaNumber === '6') {
      effectiveDepartmentId = 2; // Jewelers department
    }

    // Try to map the antenna via socket if available
    try {
      await rfidService.mapAntennaToStation(effectiveDepartmentId, antennaNumber, Number(stationIndex));
    } catch (socketError) {
      console.log('Socket not available for mapping, will update UI only:', socketError);
      // Continue even if socket connection fails - we'll just update the UI
    }

    const department = departments.find(d => d.id === effectiveDepartmentId);
    const departmentStations = getDepartmentStations(effectiveDepartmentId);
    const station = departmentStations[Number(stationIndex)];

    toast.success(
      `Antenna ${antennaNumber} of Reader ${readerId} mapped to ${station?.name || 'unknown'} in ${department?.name}`
    );

    return true;
  } catch (error) {
    toast.error('Failed to map antenna to station');
    console.error('Error mapping antenna to station:', error);
    return false;
  }
};
