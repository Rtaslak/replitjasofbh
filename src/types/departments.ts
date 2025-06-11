// src/types/departments.ts

import { Station } from "@/types/stations";
import { Order } from "@/types/orders";

export interface Department {
  id: number;
  name: string;
  description?: string;
  color?: string;
  stations?: Station[]; // ✅ Department can have stations inside
  orders?: Order[]; // or orders?: any[]
}


 // ✅ Utility function to create a new Department
 export const createDepartment = (
   id: number,
   name: string,
   description: string,
   color: string,
   stations: Station[] = [],
   orders: string[] = []
 ): Department => {
   return {
     id,
     name,
     description,
    color,
     stations,
   };
 };
