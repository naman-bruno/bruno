import React, { Component, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addDebugError } from 'providers/ReduxStore/slices/logs';

// React Error Boundary Component (keeping minimal for critical React errors)
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Only capture critical React errors that would break the app
    if (this.props.onError) {
      this.props.onError({
        message: error.message,
        stack: error.stack,
        error: error,
        timestamp: new Date().toISOString()
      });
    }

    // Reset error state after a short delay
    setTimeout(() => {
      this.setState({ hasError: false });
    }, 100);
  }

  render() {
    return this.props.children;
  }
}

// Helper function to serialize arguments safely
const serializeArgs = (args) => {
  return args.map(arg => {
    try {
      if (arg === null) return 'null';
      if (arg === undefined) return 'undefined';
      if (typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean') {
        return arg;
      }
      if (arg instanceof Error) {
        return {
          __type: 'Error',
          name: arg.name,
          message: arg.message,
          stack: arg.stack
        };
      }
      if (typeof arg === 'object') {
        // Try to serialize object, fallback to string representation
        try {
          return JSON.parse(JSON.stringify(arg));
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    } catch (e) {
      return '[Unserializable]';
    }
  });
};

// Helper function to extract file and line info from stack trace
const extractFileInfo = (stack) => {
  if (!stack) return { filename: null, lineno: null, colno: null };
  
  try {
    // Look for the first line that's not from this error capture file
    const lines = stack.split('\n');
    for (let line of lines) {
      // Skip lines that contain ErrorCapture or are just "Error"
      if (line.includes('ErrorCapture') || line.trim() === 'Error') continue;
      
      // Match patterns like "at filename:line:column" or "(filename:line:column)"
      const match = line.match(/(?:at\s+.*?\s+)?\(?([^)]+):(\d+):(\d+)\)?/);
      if (match) {
        return {
          filename: match[1],
          lineno: parseInt(match[2]),
          colno: parseInt(match[3])
        };
      }
    }
  } catch (e) {
    // Ignore parsing errors
  }
  
  return { filename: null, lineno: null, colno: null };
};

// Global Error Capture Hook
const useGlobalErrorCapture = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Store original console.error
    const originalConsoleError = console.error;

    // Override console.error to capture all error calls
    console.error = (...args) => {
      // Get the stack trace before calling original console.error
      const currentStack = new Error().stack;
      
      // Call original console.error first
      originalConsoleError.apply(console, args);

      // Check if this error is from the IPC listener and skip it
      if (currentStack && currentStack.includes('useIpcEvents.js')) {
        return; // Skip errors from IPC event handlers
      }

      // Also check the error message content for removeConsoleLogListener
      const errorMessage = args.join(' ');
      if (errorMessage.includes('removeConsoleLogListener')) {
        return; // Skip this error
      }

      // Extract file and line information
      const { filename, lineno, colno } = extractFileInfo(currentStack);

      // Serialize arguments to avoid Redux non-serializable warnings
      const serializedArgs = serializeArgs(args);

      // Capture the error for debug tab
      dispatch(addDebugError({
        message: errorMessage,
        stack: currentStack,
        filename: filename,
        lineno: lineno,
        colno: colno,
        args: serializedArgs,
        timestamp: new Date().toISOString()
      }));
    };

    // Cleanup function
    return () => {
      // Restore original console.error
      console.error = originalConsoleError;
    };
  }, [dispatch]);
};

// Main ErrorCapture Component
const ErrorCapture = ({ children }) => {
  const dispatch = useDispatch();
  
  // Set up global error capture
  useGlobalErrorCapture();

  const handleReactError = (errorData) => {
    dispatch(addDebugError(errorData));
  };

  return (
    <ErrorBoundary onError={handleReactError}>
      {children}
    </ErrorBoundary>
  );
};

export default ErrorCapture; 