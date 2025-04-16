/**
 * Debug utility for colorful console logging
 */

// Check if running in browser environment
const isBrowser = typeof window !== 'undefined';

// Browser-friendly colors (using CSS styling)
const browserColors = {
  info: 'color: #0284c7; font-weight: bold;', // Blue
  success: 'color: #16a34a; font-weight: bold;', // Green
  warning: 'color: #ca8a04; font-weight: bold;', // Yellow
  error: 'color: #dc2626; font-weight: bold;', // Red
  firebase: 'color: #9333ea; font-weight: bold;', // Purple
  apiRequest: 'color: #0891b2; font-weight: bold;', // Cyan
  apiResponse: 'color: #4f46e5; font-weight: bold;', // Indigo
  apiError: 'color: #be123c; font-weight: bold;', // Red/Pink
};

// Node.js colors for terminal
const nodeColors = {
  info: '\x1b[36m%s\x1b[0m', // Cyan
  success: '\x1b[32m%s\x1b[0m', // Green
  warning: '\x1b[33m%s\x1b[0m', // Yellow
  error: '\x1b[31m%s\x1b[0m', // Red
  firebase: '\x1b[35m%s\x1b[0m', // Purple
  apiRequest: '\x1b[36m%s\x1b[0m', // Cyan
  apiResponse: '\x1b[34m%s\x1b[0m', // Blue
  apiError: '\x1b[91m%s\x1b[0m', // Bright Red
};

// Create browser or node specific logger
const createLogger = (type: 'info' | 'success' | 'warning' | 'error' | 'firebase' | 'apiRequest' | 'apiResponse' | 'apiError') => {
  return (message: string, data?: any) => {
    const prefix = `[${type.toUpperCase()}]`;
    
    if (isBrowser) {
      // Browser logging with styled console
      console.log(`%c${prefix} ${message}`, browserColors[type]);
      if (data) console.log(data);
    } else {
      // Node.js terminal logging
      console.log(nodeColors[type], `${prefix} ${message}`);
      if (data) console.log(data);
    }
  };
};

// Export debug functions
export const debug = {
  info: createLogger('info'),
  success: createLogger('success'),
  warning: createLogger('warning'),
  error: createLogger('error'),
  firebase: createLogger('firebase'),
  apiRequest: createLogger('apiRequest'),
  apiResponse: createLogger('apiResponse'),
  apiError: createLogger('apiError'),
};

// API Request wrapper with logging
export async function loggedApiCall<T>(
  endpoint: string, 
  method: string, 
  body?: any, 
  headers?: HeadersInit
): Promise<T> {
  try {
    // Log API request
    debug.apiRequest(`${method} ${endpoint}`, body ? { body } : undefined);
    
    // Start time for performance logging
    const startTime = performance.now();
    
    // Make the actual request
    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    
    // Calculate the request time
    const requestTime = (performance.now() - startTime).toFixed(2);
    
    // Check if response is OK
    if (!response.ok) {
      const errorText = await response.text();
      debug.apiError(`Request failed (${response.status}) in ${requestTime}ms`, {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      throw new Error(`API error: ${response.status} ${response.statusText}\n${errorText}`);
    }
    
    // Parse JSON response
    let data: T;
    try {
      data = await response.json();
    } catch (e) {
      // Handle non-JSON responses
      const text = await response.text();
      debug.apiResponse(`Non-JSON response received in ${requestTime}ms:`, text);
      return text as unknown as T;
    }
    
    // Log successful response
    debug.apiResponse(`Response received in ${requestTime}ms:`, data);
    
    return data;
  } catch (error) {
    // Log any unexpected errors
    debug.apiError('Request failed with exception:', error);
    throw error;
  }
} 