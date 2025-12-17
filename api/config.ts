/**
 * API Configuration
 * Handles both development and production environments
 */

export const getApiBaseUrl = (): string => {
  // Production: Use environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Development: Use Vite proxy (relative path)
  if (import.meta.env.DEV) {
    return ''; // Empty string uses relative path (Vite proxy)
  }
  
  // Fallback: Try to construct from current host
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  
  // If on Vercel or production, backend should be on separate service
  // For now, return empty to use relative paths
  return '';
};

export const getApiEndpoint = (path: string): string => {
  const baseUrl = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return baseUrl ? `${baseUrl}${cleanPath}` : cleanPath;
};

