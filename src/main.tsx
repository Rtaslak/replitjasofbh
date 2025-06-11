import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Add debugging BEFORE anything else
console.log('🚨 MAIN.TSX STARTING - Current URL:', window.location.href);

// Track any programmatic navigation
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

history.pushState = function(state, title, url) {
  console.log('🚨 HISTORY.PUSHSTATE CALLED:', url, 'from:', window.location.href);
  console.trace('History pushState call stack:');
  return originalPushState.apply(this, arguments);
};

history.replaceState = function(state, title, url) {
  console.log('🚨 HISTORY.REPLACESTATE CALLED:', url, 'from:', window.location.href);
  console.trace('History replaceState call stack:');
  return originalReplaceState.apply(this, arguments);
};

// Track page unload/redirect
window.addEventListener('beforeunload', () => {
  console.log('🚨 PAGE IS UNLOADING/REDIRECTING FROM:', window.location.href);
});

// Prevent auth page redirect loops - integrated from fixInfiniteLoop.js
(function() {
  // Only run this on the auth page
  if (window.location.pathname.includes('/auth')) {
    // Check if we have auth tokens
    const hasToken = window.sessionStorage.getItem('accessToken') || 
                      window.localStorage.getItem('accessToken');
    
    if (hasToken) {
      console.log("💥 LOOP BREAKER: Detected auth tokens on auth page. Forcing redirect to dashboard.");
      window.location.href = '/dashboard';
      return; // Stop execution to prevent app from rendering
    }
  }
})();

// Check if storage is working correctly
try {
  const testKey = 'storage_test_' + Date.now();
  const testValue = 'test_value';
  
  // Test sessionStorage
  sessionStorage.setItem(testKey, testValue);
  const sessionTest = sessionStorage.getItem(testKey);
  sessionStorage.removeItem(testKey);
  
  // Test localStorage
  localStorage.setItem(testKey, testValue);
  const localTest = localStorage.getItem(testKey);
  localStorage.removeItem(testKey);
  
  console.log('Storage test results:', {
    sessionStorage: sessionTest === testValue ? 'Working' : 'Failed',
    localStorage: localTest === testValue ? 'Working' : 'Failed'
  });
} catch (storageError) {
  console.error('Browser storage is not available:', storageError);
}

// Add debugging for the e-filter error
window.addEventListener('error', function(event) {
  if (event.error && event.error.toString().includes('e-filter is not a function')) {
    console.error('e-filter error details:', {
      message: event.error.message,
      stack: event.error.stack,
    });
  }
});

// Override console.error to catch and trace e-filter errors
console.error = (function(originalConsoleError) {
  return function(error, ...args) {
    if (error && error.toString && error.toString().includes('e-filter is not a function')) {
      console.trace('e-filter error stack trace:');
    }
    originalConsoleError.apply(console, [error, ...args]);
  };
})(console.error);

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Root element not found");
}

console.log("✅ App initialized with custom Cognito auth");