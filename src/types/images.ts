// src/types/images.ts

export interface UploadedImage {
  // Primary identifiers - at least one should always be present
  id?: string;
  key?: string;
  
  // S3 storage keys
  thumbnailKey?: string;
  
  // Image URLs - at least one should be present
  originalUrl?: string;
  thumbnailUrl?: string;
  url: string; // Required for uploadToServer compatibility
  
  // File metadata
  name?: string;
  size?: number;
  mimetype?: string;
  uploadedAt?: string;
}

// Helper type for when we know we have a properly formed image
export interface CompleteUploadedImage extends UploadedImage {
  id: string;
  key: string;
  originalUrl: string;
  name: string;
  size: number;
  mimetype: string;
  uploadedAt: string;
}

// Type guard to check if an image has the minimum required fields
export function isValidUploadedImage(img: any): img is UploadedImage {
  return img && 
    (img.id || img.key) && 
    img.url &&
    (img.originalUrl || img.url || img.thumbnailUrl);
}

// Type guard for complete images
export function isCompleteUploadedImage(img: UploadedImage): img is CompleteUploadedImage {
  return !!(img.id && img.key && img.originalUrl && img.name && img.size && img.mimetype && img.uploadedAt);
}