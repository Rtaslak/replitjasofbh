// src/pages/OrderForm.tsx
import { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { Form } from "@/components/ui/form";
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
import { AlertCircle } from "lucide-react";

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

  const handleSubmit = async (data: any) => {
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
    <OrderFormContainer title={isEditing ? `Edit Order ${currentOrder?.orderNumber ?? orderId}` : "New Order"}>
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
          <SalesInformation 
            control={form.control} 
            userRole={currentUser.role} 
          />
          <Separator className="my-8" />
          <ProductInformation control={form.control} />
          <Separator className="my-8" />
          <ProductDetails control={form.control} />

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
            currentUserEmail={currentUser.email}
            currentUserName={currentUser.name}
            showNotification={showNotification}
            isFormValid={form.formState.isValid}
            currentOrderNumber={currentOrder?.orderNumber}
          />
        </form>
      </Form>
    </OrderFormContainer>
  );
}