import { useState, useCallback } from 'react';
import { useAuthUser } from '@/context/AuthContext';
import requestHandler from '@/utils/api/requestHandler';
import { toast } from 'sonner';

type ApiMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

interface UseApiRequestOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
}

/**
 * Custom hook for making API requests with automatic error handling
 * and loading state management
 */
export function useApiRequest<T = any>(defaultOptions: UseApiRequestOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);
  const { isAuthenticated } = useAuthUser();

  const request = useCallback(async <R = T>(
    method: ApiMethod,
    endpoint: string,
    payload?: any,
    options: UseApiRequestOptions = {}
  ): Promise<R | null> => {
    // Merge default options with request-specific options
    const opts = { ...defaultOptions, ...options };
    const { 
      onSuccess, 
      onError, 
      showSuccessToast = false, 
      showErrorToast = true,
      successMessage 
    } = opts;
    
    // Check authentication if needed
    if (!isAuthenticated) {
      const authError = new Error('You must be logged in to perform this action');
      setError(authError);
      
      if (showErrorToast) {
        toast.error(authError.message);
      }
      
      if (onError) {
        onError(authError);
      }
      
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      let result: R;
      
      // Make the appropriate type of request
      switch (method) {
        case 'get':
          result = await requestHandler.get<R>(endpoint);
          break;
        case 'post':
          result = await requestHandler.post<R>(endpoint, payload);
          break;
        case 'put':
          result = await requestHandler.put<R>(endpoint, payload);
          break;
        case 'patch':
          result = await requestHandler.patch<R>(endpoint, payload);
          break;
        case 'delete':
          result = await requestHandler.delete<R>(endpoint);
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
      
      // Update state with the result
      setData(result as unknown as T);
      
      // Show success toast if requested
      if (showSuccessToast && successMessage) {
        toast.success(successMessage);
      }
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      
      // Update error state
      setError(error);
      
      // Show error toast if requested
      if (showErrorToast) {
        toast.error(error.message);
      }
      
      // Call error callback if provided
      if (onError) {
        onError(error);
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, defaultOptions]);

  // Convenience methods for common request types
  const get = useCallback(<R = T>(endpoint: string, options?: UseApiRequestOptions) => 
    request<R>('get', endpoint, undefined, options), [request]);
    
  const post = useCallback(<R = T>(endpoint: string, data?: any, options?: UseApiRequestOptions) => 
    request<R>('post', endpoint, data, options), [request]);
    
  const put = useCallback(<R = T>(endpoint: string, data?: any, options?: UseApiRequestOptions) => 
    request<R>('put', endpoint, data, options), [request]);
    
  const patch = useCallback(<R = T>(endpoint: string, data?: any, options?: UseApiRequestOptions) => 
    request<R>('patch', endpoint, data, options), [request]);
    
  const del = useCallback(<R = T>(endpoint: string, options?: UseApiRequestOptions) => 
    request<R>('delete', endpoint, undefined, options), [request]);

  return {
    isLoading,
    error,
    data,
    request,
    get,
    post,
    put,
    patch,
    delete: del
  };
}