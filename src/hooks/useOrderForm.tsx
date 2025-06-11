// src/hooks/useOrderForm.tsx
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useNotifications } from "@/context/NotificationContext";
import { formSchema, FormValues } from "@/components/orders/form/FormSchema";
import {
  formatOrderDataForForm,
  getDefaultDueDate,
} from "@/components/orders/form/OrderFormUtils";
import { orderService } from "@/services/orderService";
import { UploadedImage } from "@/types/images";

export const useOrderForm = () => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [existingImages, setExistingImages] = useState<UploadedImage[]>([]);
  const navigate = useNavigate();
  const { id: orderId } = useParams();
  const [searchParams] = useSearchParams();
  const { showNotification } = useNotifications();

  // Check if this is a duplicated order
  const isDuplicated = searchParams.get('duplicated') === 'true';
  const duplicatedOrderNumber = searchParams.get('orderNumber');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      storeLocation: "",
      customer: "",
      orderDate: new Date(),
      dueDate: getDefaultDueDate(),
      designer: "",
      serialNumber: "",
      productType: "",
      salePrice: "",
      metal: {
        primaryMetal: "",
        secondaryMetal: "",
        isMultiTone: false,
        tones: {
          yellow: false,
          white: false,
          rose: false,
          black: false,
        },
      },
      stoneDetails: "",
      additionalNotes: "",
    },
  });

  // ✅ Helper function to normalize image data consistently
  const normalizeImageData = (img: any): UploadedImage => {
    return {
      id: img.id || img.key || `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      key: img.key || img.id || "",
      thumbnailKey: img.thumbnailKey || img.key?.replace('orders/images/', 'orders/thumbnails/') || "",
      originalUrl: img.originalUrl || img.url || "",
      thumbnailUrl: img.thumbnailUrl || img.originalUrl || img.url || "",
      name: img.name || "image",
      size: img.size || 0,
      mimetype: img.mimetype || "image/jpeg",
      uploadedAt: img.uploadedAt || new Date().toISOString(),
      // Required url field for uploadToServer compatibility
      url: img.url || img.originalUrl || "",
    };
  };

  // ✅ Handle duplicated orders
  useEffect(() => {
    if (isDuplicated && !orderId) {
      console.log(`🔄 Loading duplicated order data`);
      
      try {
        // Get duplicated data from sessionStorage
        const duplicatedDataStr = sessionStorage.getItem('duplicatedOrderData');
        const duplicatedImagesStr = sessionStorage.getItem('duplicatedOrderImages');
        
        if (duplicatedDataStr) {
          const duplicatedData = JSON.parse(duplicatedDataStr);
          console.log("[Duplicate Debug] Loaded duplicated data:", duplicatedData);
          
          // Pre-fill form with duplicated data
          form.reset(duplicatedData);
          
          // ✅ Ensure dates are properly set in the form as Date objects
          if (duplicatedData.orderDate) {
            const orderDate = new Date(duplicatedData.orderDate);
            form.setValue('orderDate', orderDate);
            console.log("🗓️ Set order date:", orderDate);
          }
          if (duplicatedData.dueDate) {
            const dueDate = new Date(duplicatedData.dueDate);
            form.setValue('dueDate', dueDate);
            console.log("🗓️ Set due date:", dueDate);
          }
          
          // Load the copied images (S3 references)
          if (duplicatedImagesStr) {
            const imageData = JSON.parse(duplicatedImagesStr);
            console.log("[Duplicate Debug] Loading copied images:", imageData);
            setExistingImages(imageData.existingImages || []);
            setImages(imageData.newImages || []);
          }
          
          // Set as creating mode (not editing)
          setIsEditing(false);
          setCurrentOrder(null);
          
          // Clear the sessionStorage to prevent reuse
          sessionStorage.removeItem('duplicatedOrderData');
          sessionStorage.removeItem('duplicatedOrderImages');
          
          console.log(`✅ Duplicated order #${duplicatedOrderNumber} data loaded for creation`);
        }
      } catch (error) {
        console.error("❌ Failed to load duplicated order data:", error);
        showNotification("Error", "Failed to load duplicated order data.");
      }
      
      setIsLoading(false);
      return;
    }
  }, [isDuplicated, duplicatedOrderNumber, orderId, form, showNotification]);

  useEffect(() => {
    // Skip if this is a duplicated order (handled above)
    if (isDuplicated && !orderId) {
      return;
    }

    const fetchOrder = async () => {
      if (!orderId) {
        setIsLoading(false);
        return;
      }

      try {
        console.log(`🔍 Loading order for editing: ${orderId}`);
        const order = await orderService.getOrderById(orderId);
        console.log("[Order Debug] Loaded order:", order);
        console.log("[Order Debug] Order images:", order.images);

        setIsEditing(true);
        setCurrentOrder(order);

        const formattedData = formatOrderDataForForm(order);
        form.reset(formattedData);

        // ✅ Process existing images with proper normalization
        if (order.images && Array.isArray(order.images) && order.images.length > 0) {
          console.log(`📷 Processing ${order.images.length} existing images`);
          
          const normalizedExistingImages = order.images.map((img: any) => {
            const normalized = normalizeImageData(img);
            console.log("Normalized existing image:", normalized);
            return normalized;
          });
          
          setExistingImages(normalizedExistingImages || []);
          console.log("✅ Existing images set:", normalizedExistingImages);
        } else {
          console.log("ℹ️ No existing images found for this order");
          setExistingImages([]);
        }
        
        // ✅ Reset new images when loading an order for editing
        setImages([]);
        
      } catch (err) {
        console.error("❌ Failed to load order for editing:", err);
        showNotification("Failed to load order", "Please try again later.");
        setExistingImages([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, form, showNotification, isDuplicated]);

  // ✅ Debug logging for image state changes
  useEffect(() => {
    console.log("📷 Images state changed:", {
      newImages: (images || []).length,
      existingImages: (existingImages || []).length,
      totalImages: (images || []).length + (existingImages || []).length
    });
  }, [images, existingImages]);

  // ✅ Function to get all images (existing + new) for form submission
  const getAllImages = (): UploadedImage[] => {
    return [...(existingImages || []), ...(images || [])];
  };

  // ✅ Function to clear all images
  const clearAllImages = () => {
    setImages([]);
    setExistingImages([]);
  };

  // ✅ Function to get images that should be saved (combines existing and new)
  const getImagesToSave = (): UploadedImage[] => {
    // Return the current state of existing images (which may have deletions) plus new images
    return [...(existingImages || []), ...(images || [])];
  };

  return {
    form,
    images,
    setImages,
    isEditing,
    currentOrder,
    isLoading,
    existingImages,
    setExistingImages,
    orderId,
    navigate,
    showNotification,
    // ✅ Additional helper functions
    getAllImages,
    clearAllImages,
    normalizeImageData,
    getImagesToSave,
    // ✅ Duplicate-related properties
    isDuplicated,
    duplicatedOrderNumber,
  };
};