
// Centralized environment configuration
export const ENV = {
  // Consolidate BACKEND_URL and RFID_SERVER_URL since they point to the same endpoint
  API_BASE_URL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000',
  
  // MQTT broker configuration
  MQTT_BROKER_URL: import.meta.env.VITE_MQTT_BROKER_URL || 'indigoalkali-lr5usy.a01.euc1.aws.hivemq.cloud',
  MQTT_PORT: parseInt(import.meta.env.VITE_MQTT_PORT || '8883'),
  MQTT_USERNAME: import.meta.env.VITE_MQTT_USERNAME || '',
  MQTT_PASSWORD: import.meta.env.VITE_MQTT_PASSWORD || '',
  MQTT_TOPIC_PREFIX: import.meta.env.VITE_MQTT_TOPIC_PREFIX || 'JBH/',
  MQTT_USE_TLS: import.meta.env.VITE_MQTT_USE_TLS === 'true' || true,
  
  // Add getter functions to maintain backward compatibility
  get BACKEND_URL() {
    return this.API_BASE_URL;
  },
  get RFID_SERVER_URL() {
    return this.API_BASE_URL;
  }
};
