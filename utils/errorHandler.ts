/**
 * Error Handling Utilities
 * Centralized error handling for API calls
 */

import { Alert } from 'react-native';

interface APIError {
  response?: {
    status: number;
    data?: {
      detail?: string;
      message?: string;
    };
  };
  message?: string;
  code?: string;
}

export const handleAPIError = (error: any, customMessage?: string): string => {
  // Network errors
  if (!error.response) {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return 'Request timeout. Please check your internet connection and try again.';
    }
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      return 'Network error. Please check your internet connection.';
    }
    return customMessage || 'Unable to connect to server. Please try again later.';
  }

  const status = error.response.status;
  const detail = error.response.data?.detail || error.response.data?.message;

  // Handle specific status codes
  switch (status) {
    case 400:
      return detail || 'Invalid request. Please check your input and try again.';
    case 401:
      return 'Your session has expired. Please login again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return detail || 'The requested resource was not found.';
    case 409:
      return detail || 'This action conflicts with existing data.';
    case 422:
      return detail || 'Validation error. Please check your input.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Server error. Please try again later.';
    case 502:
    case 503:
      return 'Service temporarily unavailable. Please try again in a few moments.';
    default:
      return detail || customMessage || 'An unexpected error occurred. Please try again.';
  }
};

export const showErrorAlert = (error: any, title: string = 'Error', customMessage?: string) => {
  const message = handleAPIError(error, customMessage);
  Alert.alert(title, message);
};

export const showSuccessAlert = (message: string, title: string = 'Success') => {
  Alert.alert(title, message);
};

/**
 * Retry wrapper for API calls
 */
export const withRetry = async <T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on client errors (4xx)
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        throw error;
      }
      
      // Wait before retrying
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError;
};
