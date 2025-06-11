import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
  useRef,
} from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { useAuthUser } from "@/context/AuthContext";

interface SocketContextType {
  socket: Socket | null;
  status: "disconnected" | "connecting" | "connected" | "error";
  connect: () => void;
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<"disconnected" | "connecting" | "connected" | "error">("disconnected");
  const socketRef = useRef<Socket | null>(null);
  const connectionAttempts = useRef<number>(0);
  const { isAuthenticated } = useAuthUser();

  // Make socket instance globally available for debugging
  useEffect(() => {
    if (socketRef.current) {
      (window as any).socketInstance = socketRef.current;
    }
  }, [socketRef.current]);

  const getServerUrl = useCallback(() => {
    // Try multiple sources for the WebSocket URL
    const url = import.meta.env.VITE_WS_URL || 
                import.meta.env.VITE_API_URL || 
                window.location.origin.replace('https://', 'wss://').replace('http://', 'ws://');
    
    console.log("🌐 WebSocket URL =", url);
    return url;
  }, []);

  const connect = useCallback(() => {
    // We always connect regardless of authentication status
    
    if (socketRef.current?.connected) {
      console.log("Socket already connected");
      setStatus("connected");
      return;
    }

    const serverUrl = getServerUrl();
    console.log(`🔌 Connecting to WebSocket server at ${serverUrl}`);
    setStatus("connecting");

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    try {
      // Increment connection attempts
      connectionAttempts.current++;

      const newSocket = io(serverUrl, {
        transports: ["websocket"],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
        forceNew: true, // Force new connection to avoid stale state
        auth: {
          token: sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken')
        }
      });

      newSocket.on("connect", () => {
        console.log("✅ Socket connected");
        setStatus("connected");
        connectionAttempts.current = 0; // Reset counter on successful connection
        newSocket.emit("get_mqtt_status"); // 🔁 Refresh status after reconnect
      });

      newSocket.on("disconnect", (reason) => {
        console.warn(`⚠️ Socket disconnected: ${reason}`);
        setStatus("disconnected");

        if (reason !== "io client disconnect" && reason !== "transport close") {
          toast.error("Disconnected from server. Reconnecting...");
        }
      });

      newSocket.on("reconnect", (attempt) => {
        console.log(`♻️ Reconnected after ${attempt} attempts`);
        setStatus("connected");
        newSocket.emit("get_mqtt_status"); // 🔁 Refresh again after reconnect
      });

      newSocket.on("connect_error", (err) => {
        console.error("❌ Connection error:", err.message);
        setStatus("error");
        
        // Only show toast for the first few errors to avoid spamming
        if (connectionAttempts.current <= 3) {
          toast.error(`Server connection error: ${err.message}`);
        }
        
        // If too many connection errors, stop reconnecting automatically
        if (connectionAttempts.current > 10) {
          console.error("Too many connection attempts, stopping auto-reconnect");
          newSocket.disconnect();
        }
      });

      socketRef.current = newSocket;
      
      // Set a timeout to reset status if still connecting after 10 seconds
      const timeout = setTimeout(() => {
        if (status === "connecting") {
          console.warn("Socket connection timeout");
          setStatus("error");
        }
      }, 10000);
      
      return () => clearTimeout(timeout);
    } catch (error) {
      console.error("Error setting up socket:", error);
      setStatus("error");
      toast.error("Failed to connect to server");
    }
  }, [getServerUrl]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log("Manually disconnecting socket");
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setStatus("disconnected");
  }, []);

  // Connect when component mounts
  useEffect(() => {
    connect();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [connect]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, status, connect, disconnect }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useSocket must be used within a SocketProvider");
  return context;
};