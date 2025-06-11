import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { useAuthUser } from "@/context/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthUser();

  // Remove the problematic useEffect that redirects to /auth
  // Let the routing system handle authentication instead
  
  // If user is not authenticated, show a loading state or return null
  // The routing system will handle the proper redirects
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/10 p-4">
      <Card className="max-w-3xl w-full">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Welcome to Jewelry Tracker Hub</CardTitle>
          <CardDescription className="text-lg">
            Your comprehensive solution for jewelry order management and workflow tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <DashboardCard 
              title="Dashboard" 
              description="View real-time status of all departments"
              onClick={() => navigate("/dashboard")}
            />
            <DashboardCard 
              title="Orders" 
              description="Manage and track customer orders"
              onClick={() => navigate("/orders")}
            />
            <DashboardCard 
              title="Stations" 
              description="Monitor production stations"
              onClick={() => navigate("/stations")}
            />
            <DashboardCard 
              title="Create Order" 
              description="Create a new customer order"
              onClick={() => navigate("/orders/new")}
              primary
            />
            <DashboardCard 
              title="Settings" 
              description="Configure system settings and users"
              onClick={() => navigate("/settings")}
            />
          </div>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground mb-2">
              Need help getting started? Check out our documentation.
            </p>
            <Button variant="link" className="font-normal">
              View Documentation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface DashboardCardProps {
  title: string;
  description: string;
  onClick: () => void;
  primary?: boolean;
}

const DashboardCard = ({ title, description, onClick, primary }: DashboardCardProps) => (
  <div 
    className={`rounded-lg border p-4 hover:bg-muted/50 transition-colors cursor-pointer 
      ${primary ? 'bg-primary/10 border-primary/20' : ''}`}
    onClick={onClick}
  >
    <h3 className="font-medium text-lg mb-1">{title}</h3>
    <p className="text-muted-foreground text-sm mb-2">{description}</p>
    <div className="flex justify-end">
      <ArrowRight size={16} className="text-muted-foreground" />
    </div>
  </div>
);

export default Index;