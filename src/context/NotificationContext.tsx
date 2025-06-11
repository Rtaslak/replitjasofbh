
import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

type NotificationContextType = {
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  showNotification: (title: string, message: string) => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  
  // Load notification settings from localStorage on mount
  useEffect(() => {
    const storedValue = localStorage.getItem("notificationsEnabled");
    if (storedValue !== null) {
      setNotificationsEnabled(storedValue === "true");
    }
  }, []);
  
  // Save notification settings to localStorage when changed
  useEffect(() => {
    localStorage.setItem("notificationsEnabled", notificationsEnabled.toString());
  }, [notificationsEnabled]);
  
  const showNotification = (title: string, message: string) => {
    if (notificationsEnabled) {
      toast(title, {
        description: message,
        duration: 5000,
      });
    }
  };
  
  return (
    <NotificationContext.Provider 
      value={{ 
        notificationsEnabled, 
        setNotificationsEnabled, 
        showNotification 
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
