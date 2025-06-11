// src/utils/uploadToServer.ts

export interface UploadedImage {
  url: string;
  id: string;
  key: string;
  thumbnailKey: string;
  originalUrl: string;
  thumbnailUrl: string;
  name: string;
  size: number;
  mimetype: string;
  uploadedAt: string;
}

// ✅ Get the API base URL from environment variable
const getApiBaseUrl = () => {
  // Check if we have the environment variable set
  const envApiUrl = import.meta.env.VITE_API_BASE_URL;
  
  if (envApiUrl) {
    console.log("Using API URL from env:", envApiUrl);
    return envApiUrl;
  }
  
  // Fallback logic based on current domain
  if (window.location.hostname === 'app.jasonofbh.net') {
    console.log("Production: using api.jasonofbh.net");
    return 'https://api.jasonofbh.net/api';
  } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log("Development: using relative path");
    return '/api';
  } else {
    console.log("Unknown environment, using relative path");
    return '/api';
  }
};

export async function uploadImageToServer(file: File): Promise<UploadedImage> {
  const formData = new FormData();
  formData.append("image", file);

  try {
    const apiUrl = `${getApiBaseUrl()}/upload`;
    console.log("📤 Uploading to:", apiUrl);
    
    const res = await fetch(apiUrl, {
      method: "POST",
      body: formData,
      credentials: 'include', // Add credentials for CORS
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: "Upload failed" }));
      throw new Error(errorData.error || `Upload failed with status ${res.status}`);
    }

    const result = await res.json();
    console.log("✅ Image uploaded successfully:", result);
    
    return result;
  } catch (error) {
    console.error("❌ Upload error:", error);
    throw error;
  }
}

export async function uploadMultipleImages(files: File[]): Promise<UploadedImage[]> {
  const formData = new FormData();
  
  files.forEach((file) => {
    formData.append("images", file);
  });

  try {
    const apiUrl = `${getApiBaseUrl()}/upload-multiple`;
    console.log("📤 Uploading multiple images to:", apiUrl);
    
    const res = await fetch(apiUrl, {
      method: "POST",
      body: formData,
      credentials: 'include', // Add credentials for CORS
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: "Upload failed" }));
      throw new Error(errorData.error || `Upload failed with status ${res.status}`);
    }

    const result = await res.json();
    console.log("✅ Multiple images uploaded successfully:", result);
    
    return result.images;
  } catch (error) {
    console.error("❌ Multiple upload error:", error);
    throw error;
  }
}

export async function deleteImageFromServer(imageKey: string): Promise<void> {
  try {
    const apiUrl = `${getApiBaseUrl()}/delete/${encodeURIComponent(imageKey)}`;
    console.log("🗑️ Deleting image from:", apiUrl);
    
    const res = await fetch(apiUrl, {
      method: "DELETE",
      credentials: 'include', // Add credentials for CORS
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: "Delete failed" }));
      throw new Error(errorData.error || `Delete failed with status ${res.status}`);
    }

    console.log("✅ Image deleted successfully:", imageKey);
  } catch (error) {
    console.error("❌ Delete error:", error);
    throw error;
  }
}