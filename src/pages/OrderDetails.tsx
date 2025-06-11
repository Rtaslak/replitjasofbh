// src/pages/OrderDetails.tsx - Updated for New Metal Structure + View History
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { orderService } from "@/services/orderService";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ImageIcon, ZoomIn, ChevronLeft, ChevronRight, Download, X, ArrowLeft, User, Calendar, MapPin, Package, Gem, FileText, Clock, Shield } from "lucide-react";
import { UploadedImage } from "@/types/images";
import { useToast } from "@/hooks/use-toast";
import { useTagHistory } from '@/hooks/useTagHistory';
import TagHistoryDialog from '@/components/settings/TagHistoryDialog';

export default function OrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  
  // Tag History functionality
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const { 
    selectedOrderHistory, 
    isLoadingHistory, 
    historyError, 
    fetchOrderHistory, 
    clearOrderHistory 
  } = useTagHistory();
  
  const { toast } = useToast();

  const handleBackClick = () => {
    navigate(-1);
  };

  // Tag History functions
  const handleViewHistory = async () => {
    if (order?.id) {
      await fetchOrderHistory(order.id);
      setHistoryDialogOpen(true);
    }
  };

  const handleCloseHistoryDialog = () => {
    setHistoryDialogOpen(false);
    clearOrderHistory();
  };

  const handleRefreshHistory = async (orderId: string) => {
    await fetchOrderHistory(orderId);
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await orderService.getOrderById(id!);
        setOrder(data);
      } catch (err) {
        console.error("Failed to fetch order details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setImageDialogOpen(true);
  };

  const handlePrevImage = () => {
    if (order.images && order.images.length > 0) {
      setSelectedImageIndex((prev) => 
        prev === 0 ? order.images.length - 1 : prev - 1
      );
    }
  };

  const handleNextImage = () => {
    if (order.images && order.images.length > 0) {
      setSelectedImageIndex((prev) => 
        prev === order.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handleDownloadImage = () => {
    if (order.images && order.images[selectedImageIndex]) {
      const image = order.images[selectedImageIndex];
      const link = document.createElement('a');
      link.href = image.originalUrl || image.url || image.thumbnailUrl;
      link.download = image.name || `order-${order.orderNumber}-image-${selectedImageIndex + 1}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Helper function to get metal colors that are selected
  const getSelectedMetalColors = (metal: any) => {
    if (!metal?.tones) return [];
    
    const colors = [];
    if (metal.tones.yellow) colors.push('Yellow');
    if (metal.tones.white) colors.push('White');
    if (metal.tones.rose) colors.push('Rose');
    if (metal.tones.black) colors.push('Black');
    
    return colors;
  };

  // Helper function to render metal color badges
  const renderMetalColorBadges = (metal: any) => {
    const selectedColors = getSelectedMetalColors(metal);
    
    if (selectedColors.length === 0) {
      return <span className="text-white">—</span>;
    }
    
    return (
      <div className="flex flex-wrap gap-1">
        {selectedColors.map((color) => (
          <Badge 
            key={color} 
            variant="secondary" 
            className="text-xs bg-slate-700 text-gray-300"
          >
            {color}
          </Badge>
        ))}
      </div>
    );
  };

  // Status color mapping for dark mode
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-900/50 text-green-200 border-green-700';
      case 'in progress':
        return 'bg-blue-900/50 text-blue-200 border-blue-700';
      case 'pending':
        return 'bg-yellow-900/50 text-yellow-200 border-yellow-700';
      case 'cancelled':
        return 'bg-red-900/50 text-red-200 border-red-700';
      default:
        return 'bg-gray-800/50 text-gray-300 border-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">Loading order details</h3>
            <p className="text-gray-300">Please wait while we fetch your order information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 bg-slate-800 border-slate-700">
          <CardContent className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-white mb-2">Order not found</h2>
            <p className="text-gray-300 mb-6">The order you're looking for doesn't exist or has been removed.</p>
            <Button onClick={handleBackClick} variant="outline" className="border-slate-600 text-gray-300 hover:bg-slate-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const images: UploadedImage[] = order.images || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
         <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackClick}
              className="gap-2 hover:bg-slate-700/60 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            
            {/* Updated button group with View History */}
            <div className="flex gap-3">
              {/* Only show View History if order has a tag */}
              {order?.tagId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewHistory}
                  className="gap-2 border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white"
                >
                  <Clock className="h-4 w-4" />
                  View History
                </Button>
              )}
              
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate(`/orders/${order.id}`)}
                className="gap-2 bg-primary hover:bg-primary/90 text-white"
              >
                <FileText className="h-4 w-4" />
                Update Order
              </Button>
            </div>
          </div>
          
          <div className="bg-slate-800 rounded-2xl shadow-sm border border-slate-700/20 p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold text-white mb-3">
                  Order {order.orderNumber}
                </h1>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge 
                    className={`px-3 py-1 font-medium border ${getStatusColor(order.status)}`}
                    variant="outline"
                  >
                    {order.status}
                  </Badge>
                  {order.currentDepartment && (
                    <Badge variant="secondary" className="px-3 py-1 bg-slate-700 text-gray-300">
                      <Shield className="h-3 w-3 mr-1" />
                      {order.currentDepartment}
                    </Badge>
                  )}
                  {images.length > 0 && (
                    <Badge variant="default" className="px-3 py-1">
                      <ImageIcon className="h-3 w-3 mr-1" />
                      {images.length} image{images.length === 1 ? '' : 's'}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-gray-400">Created</p>
                <p className="font-semibold text-white">
                  {order.createdAt ? format(new Date(order.createdAt), "MMM dd, yyyy") : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Images Gallery */}
        {images.length > 0 && (
          <Card className="mb-8 overflow-hidden border-0 shadow-sm bg-slate-800/60 backdrop-blur-sm border-slate-700">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-2xl text-white">
                <ImageIcon className="h-6 w-6 text-primary" />
                Order Images
                <Badge variant="outline" className="ml-auto border-slate-600 text-gray-300">
                  {images.length} total
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {images.map((img: UploadedImage, index: number) => {
                  return (
                    <div
                      key={img.id || index}
                      className="relative group transition-all duration-300 hover:scale-105"
                    >
                      <div 
                        className="aspect-square rounded-xl border-2 border-slate-600 overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800 shadow-sm cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-primary/30"
                        onClick={() => handleImageClick(index)}
                      >
                        <img
                          src={img.thumbnailUrl || img.originalUrl || img.url}
                          alt={img.name || `Image ${index + 1}`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          loading="lazy"
                        />
                        
                        {/* Hover overlay with zoom icon */}
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl flex items-center justify-center pointer-events-none">
                          <ZoomIn className="h-8 w-8 text-white transform scale-75 group-hover:scale-100 transition-transform duration-300" />
                        </div>
                      </div>
                      
                      {/* Only zoom button - no delete */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 z-10">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImageClick(index);
                          }}
                        >
                          <ZoomIn className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      {/* Image number badge */}
                      <Badge 
                        variant="secondary" 
                        className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white border-0 text-xs px-2 py-1 pointer-events-none"
                      >
                        {index + 1}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Information Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Customer & Contact Info */}
          <Card className="border-0 shadow-sm bg-slate-800/60 backdrop-blur-sm border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <User className="h-5 w-5 text-primary" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-700">
                  <span className="text-gray-300 font-medium">Customer</span>
                  <span className="font-semibold text-white">{order.customer}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-300 font-medium">Salesperson</span>
                  <span className="text-white">{order.submittedBy || "—"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline & Dates */}
          <Card className="border-0 shadow-sm bg-slate-800/60 backdrop-blur-sm border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <Calendar className="h-5 w-5 text-primary" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-700">
                  <span className="text-gray-300 font-medium">Order Date</span>
                  <span className="text-white">{order.orderDate ? format(new Date(order.orderDate), "PPP") : (order.createdAt ? format(new Date(order.createdAt), "PPP") : "—")}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-700">
                  <span className="text-gray-300 font-medium">Due Date</span>
                  <span className="text-white">{order.dueDate ? format(new Date(order.dueDate), "PPP") : "—"}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-300 font-medium">Last Updated</span>
                  <span className="text-white">{order.updatedAt ? format(new Date(order.updatedAt), "PPP") : "—"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Store & Location */}
          <Card className="border-0 shadow-sm bg-slate-800/60 backdrop-blur-sm border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <MapPin className="h-5 w-5 text-primary" />
                Store Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-700">
                  <span className="text-gray-300 font-medium">Store Location</span>
                  <span className="text-white">{order.storeLocation || "—"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-700">
                  <span className="text-gray-300 font-medium">Designer</span>
                  <span className="text-white">{order.designer || "—"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-700">
                  <span className="text-gray-300 font-medium">Serial Number</span>
                  <span className="text-white">{order.serialNumber || "—"}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-300 font-medium">Sale Price</span>
                  <span className="font-semibold text-white">${order.salePrice || "—"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tracking */}
          <Card className="border-0 shadow-sm bg-slate-800/60 backdrop-blur-sm border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <Clock className="h-5 w-5 text-primary" />
                Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-700">
                  <span className="text-gray-300 font-medium">Tag ID</span>
                  <span className="text-white">{order.tagId || "—"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-700">
                  <span className="text-gray-300 font-medium">Current Department</span>
                  <span className="text-white">{order.currentDepartment || "—"}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-300 font-medium">Current Station</span>
                  <span className="text-white">{order.currentStation || "—"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Product Details */}
        <Card className="border-0 shadow-sm bg-slate-800/60 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl text-white">
              <Gem className="h-6 w-6 text-primary" />
              Product Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="font-semibold text-white text-lg">Specifications</h4>
                <div className="grid gap-3">
                  <div className="flex justify-between items-center py-2 border-b border-slate-700">
                    <span className="text-gray-300 font-medium">Product Type</span>
                    <span className="text-white">{order.productType || "—"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-700">
                    <span className="text-gray-300 font-medium">Primary Metal</span>
                    <span className="text-white">{order.metal?.primaryMetal || "—"}</span>
                  </div>
                  <div className="flex justify-between items-start py-2">
                    <span className="text-gray-300 font-medium">Metal Colors</span>
                    {renderMetalColorBadges(order.metal)}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-white text-lg">Details</h4>
                <div className="grid gap-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-300 font-medium">Stone Details</span>
                    <span className="text-white">{order.stoneDetails || "—"}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {order.additionalNotes && (
              <>
                <Separator className="my-6 bg-slate-700" />
                <div className="space-y-3">
                  <h4 className="font-semibold text-white text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Additional Notes
                  </h4>
                  <div className="bg-gradient-to-r from-slate-700 to-slate-600 rounded-xl p-4 border border-slate-600">
                    <p className="text-white leading-relaxed">{order.additionalNotes}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Image Lightbox Dialog */}
        <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
          <DialogContent className="max-w-7xl max-h-[95vh] p-0 bg-black border-0">
            <DialogTitle className="sr-only">
              Order {order.orderNumber} - Image {selectedImageIndex + 1} of {images.length}
            </DialogTitle>
            
            {images.length > 0 && images[selectedImageIndex] && (
              <div className="relative">
                <img
                  src={images[selectedImageIndex].originalUrl || images[selectedImageIndex].url || images[selectedImageIndex].thumbnailUrl}
                  alt={images[selectedImageIndex].name || `Image ${selectedImageIndex + 1}`}
                  className="w-full h-auto max-h-[85vh] object-contain"
                />
                
                {/* Navigation Controls */}
                {images.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 rounded-full h-12 w-12"
                      onClick={handlePrevImage}
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 rounded-full h-12 w-12"
                      onClick={handleNextImage}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </>
                )}
                
                {/* Top Controls */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 rounded-full h-10 w-10"
                    onClick={handleDownloadImage}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 rounded-full h-10 w-10"
                    onClick={() => setImageDialogOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Image Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-6">
                  <h3 className="font-bold text-xl mb-1">Order {order.orderNumber}</h3>
                  <p className="text-gray-200 mb-3">{images[selectedImageIndex].name}</p>
                  <div className="flex justify-between items-center">
                    <p className="text-gray-300">
                      Image {selectedImageIndex + 1} of {images.length}
                    </p>
                    {images[selectedImageIndex].uploadedAt && (
                      <p className="text-gray-300">
                        Uploaded: {format(new Date(images[selectedImageIndex].uploadedAt), "PPp")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Tag History Dialog */}
        <TagHistoryDialog
          isOpen={historyDialogOpen}
          onClose={handleCloseHistoryDialog}
          orderHistory={selectedOrderHistory}
          isLoading={isLoadingHistory}
          error={historyError}
          onRefreshHistory={handleRefreshHistory}
        />
      </div>
    </div>
  );
}