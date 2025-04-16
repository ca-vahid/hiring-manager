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
};

// Node.js colors for terminal
const nodeColors = {
  info: '\x1b[36m%s\x1b[0m', // Cyan
  success: '\x1b[32m%s\x1b[0m', // Green
  warning: '\x1b[33m%s\x1b[0m', // Yellow
  error: '\x1b[31m%s\x1b[0m', // Red
  firebase: '\x1b[35m%s\x1b[0m', // Purple
};

// Create browser or node specific logger
const createLogger = (type: 'info' | 'success' | 'warning' | 'error' | 'firebase') => {
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

// Browser-friendly error logger
const logError = (message: string, error?: any) => {
  if (isBrowser) {
    console.log(`%c[ERROR] ${message}`, browserColors.error);
    if (error) {
      if (error instanceof Error) {
        console.log(`%c${error.name}: ${error.message}`, browserColors.error);
        console.log(error.stack);
      } else {
        console.log(error);
      }
    }
  } else {
    console.log(nodeColors.error, `[ERROR] ${message}`);
    if (error) {
      if (error instanceof Error) {
        console.log(nodeColors.error, `${error.name}: ${error.message}`);
        console.log(error.stack);
      } else {
        console.log(error);
      }
    }
  }
};

export const debug = {
  info: createLogger('info'),
  success: createLogger('success'),
  warning: createLogger('warning'),
  error: logError,
  firebase: createLogger('firebase')
}; 