// src/pages/OrderForm.tsx
import { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AccessDenied } from "@/components/orders/form/AccessDenied";
import { SalesInformation } from "@/components/orders/form/SalesInformation";
import { ProductInformation } from "@/components/orders/form/ProductInformation";
import { ProductDetails } from "@/components/orders/form/ProductDetails";
import { OrderFormContainer } from "@/components/orders/form/OrderFormContainer";
import { OrderFormFooter } from "@/components/orders/form/OrderFormFooter";
import { useOrderForm } from "@/hooks/useOrderForm";
import { useOrders } from "@/context/orders/OrdersContext";
import { createNewOrder, updateExistingOrder } from "@/components/orders/form/OrderFormUtils";
import { useAuthUser } from "@/context/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, User, Package, FileText, Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

// Simple email validation function
const validateEmail = (email: string) => {
  if (!email) return false;
  return email.toLowerCase().endsWith("@jasonofbh.com");
}

export default function OrderForm() {
  const {
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
    getImagesToSave,
  } = useOrderForm();

  const { refreshOrders } = useOrders();
  const [isFormValid, setIsFormValid] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const { user, isAuthenticated, isLoading: authIsLoading } = useAuthUser();
  
  // Track when auth data is available
  useEffect(() => {
    if (!authIsLoading) {
      setAuthLoading(false);
      console.log("User authentication state:", { 
        isAuthenticated, 
        user: user ? `${user.name} (${user.email})` : 'Not logged in',
        role: user?.role || 'None'
      });
    }
  }, [user, isAuthenticated, authIsLoading]);

  const currentUser = {
    name: user?.name || "",
    email: user?.email || "",
    role: user?.role || "User",
  };

  const isValidUserEmail = validateEmail(currentUser.email);

  const handleCancel = () => {
    navigate("/orders");
  };

  const handleSuccess = () => {
    form.reset();
    setImages([]);
    setExistingImages([]);
    refreshOrders();
    navigate("/orders");
  };

  const handleDuplicate = () => {
    try {
      // Get current form data
      const currentFormData = form.getValues();
      
      // Create a copy of the data without order number and system fields
      const duplicatedData = {
        ...currentFormData,
        orderNumber: undefined, // Clear order number for new order
        submittedBy: undefined,
        salesperson: undefined,
        updatedAt: undefined,
        // ✅ Ensure dates are properly formatted as Date objects
        orderDate: currentFormData.orderDate ? new Date(currentFormData.orderDate) : new Date(),
        dueDate: currentFormData.dueDate ? new Date(currentFormData.dueDate) : undefined,
      };
      
      // Copy the image metadata (S3 references)
      const imageData = {
        existingImages: existingImages || [],
        newImages: images || []
      };
      
      // Store both form data AND image metadata in sessionStorage
      sessionStorage.setItem('duplicatedOrderData', JSON.stringify(duplicatedData));
      sessionStorage.setItem('duplicatedOrderImages', JSON.stringify(imageData));
      
      // Navigate to new order creation URL - this will open a fresh form with the data
      navigate("/orders/new?duplicated=true");
      
      // Show success notification
      showNotification(
        "Order Duplicated",
        "Opening new order form with copied details. Modify as needed and submit."
      );
      
      console.log("✅ Order duplicated successfully", {
        originalOrder: currentOrder?.orderNumber,
        duplicatedData: duplicatedData,
        imageData: imageData
      });
      
    } catch (error) {
      console.error("❌ Order duplication failed:", error);
      showNotification(
        "Duplication Error", 
        "Failed to duplicate order. Please try again."
      );
    }
  };

  const handleSubmit = async (data: any) => {
    console.log("🔍 Form data being submitted:", data);
    console.log("🔍 Metal tones specifically:", data.metal?.tones);
    setIsFormValid(true);

    try {
      if (!isValidUserEmail) {
        showNotification(
          "Authentication Error",
          "Your email address is not authorized to submit orders."
        );
        return;
      }

      // Get the final list of images to save (existing + new, minus any marked for deletion)
      const finalImages = getImagesToSave();

      if (isEditing && orderId) {
        await updateExistingOrder(orderId, data, currentUser.email, finalImages);
        showNotification(
          "Order Updated",
          `Order ${currentOrder?.orderNumber ?? orderId} has been successfully updated.`
        );
      } else {
        const newOrder = await createNewOrder(data, currentUser.email, currentUser.name, finalImages);
        showNotification(
          "New Order Submitted",
          `Order ${newOrder?.orderNumber ?? "unknown"} has been successfully created.`
        );
      }
      handleSuccess();
    } catch (error) {
      console.error("❌ Order submission failed:", error);
      showNotification("Error", "Failed to submit order. Please try again.");
    }
  };

  // Show loading state while checking authentication
  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Loading order form...</p>
      </div>
    );
  }

  // Show access denied if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="container py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            You need to be logged in to access this page.
          </AlertDescription>
        </Alert>
        <div className="flex justify-center mt-6">
          <button 
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
            onClick={() => navigate("/auth")}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Show access denied if email is invalid
  if (!isValidUserEmail) {
    return <AccessDenied />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate("/orders")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Orders
            </Button>
            {isEditing && currentOrder?.orderNumber && (
              <Badge variant="secondary" className="text-sm">
                Editing Order #{currentOrder.orderNumber}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{currentUser.name}</p>
              <p className="text-xs text-slate-600">{currentUser.email}</p>
            </div>
            <Badge variant={currentUser.role === "Admin" ? "default" : "secondary"}>
              {currentUser.role}
            </Badge>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              {isEditing ? `Edit Order ${currentOrder?.orderNumber ?? orderId}` : "Create New Order"}
            </CardTitle>
            <CardDescription className="text-slate-600">
              {isEditing ? "Make changes to your existing order" : "Fill out the form below to create a new order"}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Main Form */}
      <Card className="shadow-xl">
        <CardContent className="p-8">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit, (errors) => {
                setIsFormValid(false);
                console.error("Form validation errors:", errors);
                showNotification(
                  "Validation Error",
                  "Please fill out all required fields marked with an asterisk (*)"
                );
              })}
              className="space-y-8"
            >
              {/* Sales Information Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Sales Information</h3>
                    <p className="text-sm text-slate-600">Customer and sales representative details</p>
                  </div>
                </div>
                <SalesInformation 
                  control={form.control} 
                  userRole={currentUser.role} 
                />
              </div>

              <Separator className="my-8" />

              {/* Product Information Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Product Information</h3>
                    <p className="text-sm text-slate-600">Product specifications and requirements</p>
                  </div>
                </div>
                <ProductInformation control={form.control} />
              </div>

              <Separator className="my-8" />

              {/* Product Details Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Product Details</h3>
                    <p className="text-sm text-slate-600">Additional specifications and attachments</p>
                  </div>
                </div>
                <ProductDetails control={form.control} />
              </div>

              {/* Footer Section */}
              <div className="pt-8 border-t border-slate-200">
                <OrderFormFooter
                  isEditing={isEditing}
                  orderId={orderId}
                  images={images || []}
                  setImages={setImages}
                  existingImages={existingImages || []}
                  setExistingImages={setExistingImages}
                  formData={form.getValues()}
                  onCancel={handleCancel}
                  onSuccess={handleSuccess}
                  onDuplicate={handleDuplicate}
                  currentUserEmail={currentUser.email}
                  currentUserName={currentUser.name}
                  showNotification={showNotification}
                  isFormValid={form.formState.isValid}
                  currentOrderNumber={currentOrder?.orderNumber}
                />
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}