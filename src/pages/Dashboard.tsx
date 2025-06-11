import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  PenTool,
  Hammer,
  Gem,
  Star,
  CheckCircle,
  Truck,
  FileText,
  Users,
  AlertTriangle,
  Calendar,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useOrders } from "@/context/orders/OrdersContext";
import StationCard from "@/components/dashboard/StationCard";
import ProgressTracker from "@/components/dashboard/ProgressTracker";
import PageTransition from "@/components/layout/PageTransition";
import { useDepartmentData } from "@/utils/orders/departmentManagement";
import { useAuthUser } from "@/context/AuthContext";

// Department structure for pipeline
const pipelineDepartments = [
  { id: 4, name: "Designers" },
  { id: 5, name: "Jewelers" },
  { id: 8, name: "Diamond Counting" },
  { id: 6, name: "Setters" },
  { id: 7, name: "Polishers" },
  { id: 9, name: "Shipping" }
];

export default function Dashboard() {
  // Log that Dashboard is being mounted
  useEffect(() => {
    return () => console.log("Dashboard component unmounting");
  }, []);

  const { user } = useAuthUser();
  const { orders = [], rfidOnlyOrders = [], offSiteOrders = [] } = useOrders();
  const { departments = [] } = useDepartmentData();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Image modal state
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentImages, setCurrentImages] = useState<any[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!isInitialized && ((departments && departments.length > 0) || (orders && orders.length > 0))) {
      setIsInitialized(true);
    }
  }, [departments, orders, isInitialized]);

  const departmentIcons: Record<string, JSX.Element> = {
    Designers: <PenTool className="h-6 w-6" />,
    Jewelers: <Hammer className="h-6 w-6" />,
    "Diamond Counting": <CheckCircle className="h-6 w-6" />,
    Setters: <Gem className="h-6 w-6" />,
    Polishers: <Star className="h-6 w-6" />,
    Shipping: <Truck className="h-6 w-6" />,
  };

  // Calculate days remaining until due date
  const calculateDaysRemaining = (dueDate: string | null) => {
    if (!dueDate) return null;
    
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // Get color for days remaining badge
  const getDaysRemainingColor = (days: number | null) => {
    if (days === null) return "bg-gray-100 text-gray-800";
    if (days < 0) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"; // Overdue
    if (days <= 3) return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"; // Due soon
    if (days <= 7) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"; // Due this week
    return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"; // Plenty of time
  };

  // Format days remaining text
  const formatDaysRemaining = (days: number | null) => {
    if (days === null) return "No due date";
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return "Due today";
    if (days === 1) return "Due tomorrow";
    return `${days} days left`;
  };

  // Get current department index for pipeline
  const getCurrentDepartmentIndex = (order: any) => {
    if (!order.currentDepartment) return 0;
    const index = pipelineDepartments.findIndex(
      dept => dept.name.toLowerCase() === order.currentDepartment?.toLowerCase()
    );
    return index !== -1 ? index : 0;
  };

  // Get filtered orders based on search query
  const filteredOrders = useMemo(() => {
    if (!orders || !Array.isArray(orders) || orders.length === 0 || !searchQuery) {
      return [];
    }

    const query = searchQuery.toLowerCase();
    return orders.filter(order => {
      if (!order) return false;
      
      // Search by order number (as string)
      const orderNumberMatch = order.orderNumber && 
        order.orderNumber.toString().toLowerCase().includes(query);
      
      // Search by customer name
      const customerMatch = order.customer && 
        order.customer.toString().toLowerCase().includes(query);
      
      // Search by designer/salesperson
      const designerMatch = order.designer && 
        order.designer.toString().toLowerCase().includes(query);
        
      // Search by submittedBy
      const submittedByMatch = order.submittedBy && 
        order.submittedBy.toString().toLowerCase().includes(query);
      
      return orderNumberMatch || customerMatch || designerMatch || submittedByMatch;
    });
  }, [orders, searchQuery]);

  // Flag to indicate if we're showing search results
  const showingSearchResults = Boolean(searchQuery && filteredOrders.length > 0);

  // Get filtered departments using RFID-only orders for counting
  const filteredDepartments = useMemo(() => {
    // If we have a search query that matches orders, don't show departments
    if (showingSearchResults) {
      return [];
    }
    
    if (!departments || !Array.isArray(departments) || departments.length === 0) {
      return [];
    }
    
    try {
      
      // Safely filter departments
      return departments
        .filter(d => {
          // Skip filtering if search is empty
          if (!searchQuery) return true;
          
          // First check if d and d.name exist before using them
          if (!d || typeof d.name !== 'string') {
            console.log("Invalid department found:", d);
            return false;
          }
          return d.name.toLowerCase().includes(searchQuery.toLowerCase());
        })
        .map(dept => {
          // Count orders for this department using all orders
          let count = 0;
          if (orders && Array.isArray(orders)) {
            count = orders.filter(o => o && o.currentDepartment === dept.name).length;
          }
          
  
          
          return {
            ...dept,
            count,
            icon: departmentIcons[dept.name] || <Star className="h-6 w-6" />,
          };
        });
    } catch (error) {
      console.error("Error filtering departments:", error);
      return [];
    }
  }, [departments, orders, searchQuery, showingSearchResults]);

  const completedOrdersCount = useMemo(() => {
    if (!orders || !Array.isArray(orders)) return 0;
    return orders.filter(order => order && order.status === "completed").length;
  }, [orders]);

  const handleDepartmentClick = (dept: any) => {
    navigate(`/stations?dept=${dept.id}&name=${encodeURIComponent(dept.name)}`);
  };

  const handleOrderClick = (order: any) => {
    navigate(`/orders/view/${order.id}`); // Navigate to details page
  };

  const handleOffSiteCardClick = () => {
    navigate("/off-site");
  };

  // Image modal handlers
  const openImageModal = (images: any[], startIndex: number = 0) => {
    setCurrentImages(images);
    setCurrentImageIndex(startIndex);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setCurrentImages([]);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % currentImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + currentImages.length) % currentImages.length);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isImageModalOpen) return;
      
      if (e.key === 'Escape') {
        closeImageModal();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      } else if (e.key === 'ArrowLeft') {
        prevImage();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isImageModalOpen, currentImages.length]);

  // Show a loading state if departments aren't loaded yet
  if (!isInitialized) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center h-screen">
          <div className="text-center p-4">
            <h2 className="text-2xl font-bold mb-2">Loading dashboard...</h2>
            <p className="text-muted-foreground">Please wait while we fetch your dashboard data.</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 p-6 md:p-8">
        <div className="flex justify-between mb-2">
          <h1 className="text-2xl font-bold">Welcome, {user?.name || 'User'}</h1>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search orders, customers or departments"
              className="w-full pl-9 pr-4"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Enhanced search results with new layout */}
        {showingSearchResults && (
          <div>
            <h2 className="text-xl font-semibold mb-3">Search Results ({filteredOrders.length})</h2>
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const daysRemaining = calculateDaysRemaining(order.dueDate);
                const currentDeptIndex = getCurrentDepartmentIndex(order);
                const images = order.images || [];
                const firstImage = images[0];

                return (
                  <div
                    key={order.id}
                    onClick={() => handleOrderClick(order)}
                    className="border rounded-xl bg-card hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
                  >
                    {/* Top Row: Order Info Header */}
                    <div className="grid grid-cols-4 gap-4 p-4 border-b bg-muted/30">
                      <div>
                        <div className="text-2xl font-bold text-primary">{order.orderNumber}</div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-muted-foreground mb-1">Order Date</div>
                        <div className="text-lg font-medium">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                      <div className="flex justify-center">
                        <Badge 
                          variant="outline" 
                          className={`text-lg px-4 py-2 ${getDaysRemainingColor(daysRemaining)}`}
                        >
                          {formatDaysRemaining(daysRemaining)}
                        </Badge>
                      </div>
                      <div className="flex-1 text-right">
                        <div className="text-sm font-medium text-muted-foreground mb-1">Due Date</div>
                        <div className="text-lg font-medium">
                          {order.dueDate ? new Date(order.dueDate).toLocaleDateString() : 'No due date'}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Section: Picture + Production Pipeline (same line) */}
                    <div className="flex items-center gap-8 p-6">
                      {/* Left: Picture */}
                      <div className="flex-shrink-0">
                        {firstImage ? (
                          <div 
                            className="w-32 h-32 rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity relative group"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent order card click
                              openImageModal(images, 0);
                            }}
                          >
                            <img
                              src={firstImage.thumbnailUrl || firstImage.originalUrl || firstImage.url}
                              alt={`Order ${order.orderNumber}`}
                              className="w-full h-full object-cover"
                            />
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-32 h-32 rounded-lg bg-muted flex items-center justify-center">
                            <ImageIcon className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        {images.length > 1 && (
                          <Badge variant="secondary" className="text-xs mt-2">
                            <ImageIcon className="h-3 w-3 mr-1" />
                            +{images.length - 1} more
                          </Badge>
                        )}
                      </div>

                    {/* Right: Progress Bar OR Completed Status */}
                      <div className="flex-1">
                        {order.status === 'completed' ? (
                          // ✅ Show completed status instead of progress bar
                          <div className="flex items-center justify-center h-full">
                            <div className="flex items-center gap-3 bg-green-100 dark:bg-green-900/30 px-6 py-4 rounded-lg">
                              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                              <div>
                                <div className="text-xl font-bold text-green-800 dark:text-green-300">
                                  Order Completed
                                </div>
                                <div className="text-sm text-green-600 dark:text-green-400">
                                  {order.updatedAt 
                                    ? `Completed on ${new Date(order.updatedAt).toLocaleDateString()}`
                                    : 'Recently completed'
                                  }
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          // ✅ Show progress bar for active orders
                          <>
                            <div className="text-sm font-medium text-muted-foreground mb-3">Progress Bar</div>
                            <ProgressTracker 
                              currentDepartment={currentDeptIndex} 
                              departments={pipelineDepartments}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Show departments if we have them and not showing search results */}
        {filteredDepartments && filteredDepartments.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {filteredDepartments.map((dept) => (
              <StationCard
                key={dept.id}
                name={dept.name}
                icon={dept.icon}
                color={dept.color || "#1e293b"}
                count={dept.count}
                onClick={() => handleDepartmentClick(dept)}
                departmentId={dept.id}
                className="h-40"
              />
            ))}

            {/* Off-Site Orders Card */}
            <StationCard
              key="off-site"
              name="Off-Site"
              icon={<AlertTriangle className="h-6 w-6" />}
              color="#dc2626"
              count={offSiteOrders.length}
              onClick={handleOffSiteCardClick}
              departmentId={-1}
              className="h-40"
            />

            <div
  onClick={() => navigate("/completed-orders")}
  className="flex flex-col items-center justify-center border rounded-lg bg-green-100 dark:bg-green-900/20 p-6 hover:shadow-md transition cursor-pointer"
>
  <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-300 mb-2" />
  <div className="text-lg font-bold text-green-800 dark:text-green-300">
    {completedOrdersCount}
  </div>
  <div className="text-sm text-muted-foreground">Completed Orders</div>
</div>
          </div>
        )}

        {/* Show no results message if applicable */}
        {searchQuery && filteredDepartments.length === 0 && filteredOrders.length === 0 && (
          <div className="flex justify-center items-center p-8">
            <div className="text-center">
              <h2 className="text-xl font-bold mb-2">No results found</h2>
              <p className="text-muted-foreground">
                No orders, customers, or departments match your search: "{searchQuery}"
              </p>
            </div>
          </div>
        )}

        {/* Show default no departments message */}
        {!searchQuery && filteredDepartments.length === 0 && (
          <div className="flex justify-center items-center p-8">
            <div className="text-center">
              <h2 className="text-xl font-bold mb-2">No departments found</h2>
              <p className="text-muted-foreground">Please check your configuration or try again later.</p>
            </div>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {isImageModalOpen && currentImages.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" onClick={closeImageModal}>
          <div className="relative max-w-4xl max-h-full p-4" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-all"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Image */}
            <div className="relative">
              <img
                src={currentImages[currentImageIndex]?.originalUrl || currentImages[currentImageIndex]?.url}
                alt={`Image ${currentImageIndex + 1}`}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />

              {/* Navigation arrows (only show if more than 1 image) */}
              {currentImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-all"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-all"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>

            {/* Image counter */}
            {currentImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-black bg-opacity-50 text-white rounded-full text-sm">
                {currentImageIndex + 1} / {currentImages.length}
              </div>
            )}
          </div>
        </div>
      )}
    </PageTransition>
  );
}