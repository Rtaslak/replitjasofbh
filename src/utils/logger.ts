/**
 * Log levels enum
 */
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    NONE = 4,
  }
  
  // Set the minimum log level
  // In production, we might want to set this to WARN or ERROR
  const MIN_LOG_LEVEL = process.env.NODE_ENV === 'production' 
    ? LogLevel.WARN 
    : LogLevel.DEBUG;
  
  /**
   * Enhanced logger utility with log levels, timestamps, and context
   */
  class Logger {
    private static instance: Logger;
    private logLevel: LogLevel;
  
    private constructor() {
      this.logLevel = MIN_LOG_LEVEL;
    }
  
    /**
     * Get the singleton instance
     */
    public static getInstance(): Logger {
      if (!Logger.instance) {
        Logger.instance = new Logger();
      }
      return Logger.instance;
    }
  
    /**
     * Set the log level
     */
    public setLogLevel(level: LogLevel): void {
      this.logLevel = level;
    }
  
    /**
     * Log debug message
     */
    public debug(message: string, ...args: any[]): void {
      if (this.logLevel <= LogLevel.DEBUG) {
        console.debug(`[${this.timestamp()}] [DEBUG] ${message}`, ...args);
      }
    }
  
    /**
     * Log info message
     */
    public info(message: string, ...args: any[]): void {
      if (this.logLevel <= LogLevel.INFO) {
        console.info(`[${this.timestamp()}] [INFO] ${message}`, ...args);
      }
    }
  
    /**
     * Log warning message
     */
    public warn(message: string, ...args: any[]): void {
      if (this.logLevel <= LogLevel.WARN) {
        console.warn(`[${this.timestamp()}] [WARN] ${message}`, ...args);
      }
    }
  
    /**
     * Log error message
     */
    public error(message: string, ...args: any[]): void {
      if (this.logLevel <= LogLevel.ERROR) {
        console.error(`[${this.timestamp()}] [ERROR] ${message}`, ...args);
      }
    }
  
    /**
     * Log with context
     */
    public logWithContext(level: LogLevel, context: string, message: string, ...args: any[]): void {
      switch (level) {
        case LogLevel.DEBUG:
          this.debug(`[${context}] ${message}`, ...args);
          break;
        case LogLevel.INFO:
          this.info(`[${context}] ${message}`, ...args);
          break;
        case LogLevel.WARN:
          this.warn(`[${context}] ${message}`, ...args);
          break;
        case LogLevel.ERROR:
          this.error(`[${context}] ${message}`, ...args);
          break;
      }
    }
  
    /**
     * Get current timestamp
     */
    private timestamp(): string {
      return new Date().toISOString();
    }
  }
  
  // Export the singleton instance
  export const logger = Logger.getInstance();
  
  // Export convenience methods
  export const logDebug = (message: string, ...args: any[]) => logger.debug(message, ...args);
  export const logInfo = (message: string, ...args: any[]) => logger.info(message, ...args);
  export const logWarn = (message: string, ...args: any[]) => logger.warn(message, ...args);
  export const logError = (message: string, ...args: any[]) => logger.error(message, ...args);
  export const logWithContext = (level: LogLevel, context: string, message: string, ...args: any[]) => 
    logger.logWithContext(level, context, message, ...args);