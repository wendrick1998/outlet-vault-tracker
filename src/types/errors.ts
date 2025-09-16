// Specific error types for better error handling

export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  context?: Record<string, unknown>;
}

export interface ValidationError extends AppError {
  field?: string;
  value?: unknown;
}

export interface NetworkError extends AppError {
  method?: string;
  url?: string;
  response?: Response;
}

export interface DOMError extends AppError {
  element?: string;
  operation?: string;
}

export interface AuthError extends AppError {
  userId?: string;
  operation?: string;
}

export type ErrorType = 
  | 'validation'
  | 'network' 
  | 'dom_race'
  | 'auth'
  | 'permission'
  | 'unknown';

export interface ErrorInfo {
  type: ErrorType;
  timestamp: string;
  userAgent?: string;
  url?: string;
  userId?: string;
}

export class AppErrorFactory {
  static validation(message: string, field?: string, value?: unknown): ValidationError {
    const error = new Error(message) as ValidationError;
    error.name = 'ValidationError';
    error.code = 'VALIDATION_ERROR';
    error.field = field;
    error.value = value;
    return error;
  }

  static network(message: string, method?: string, url?: string, response?: Response): NetworkError {
    const error = new Error(message) as NetworkError;
    error.name = 'NetworkError';
    error.code = 'NETWORK_ERROR';
    error.method = method;
    error.url = url;
    error.response = response;
    error.statusCode = response?.status;
    return error;
  }

  static domRace(message: string, element?: string, operation?: string): DOMError {
    const error = new Error(message) as DOMError;
    error.name = 'DOMError';
    error.code = 'DOM_RACE_ERROR';
    error.element = element;
    error.operation = operation;
    return error;
  }

  static auth(message: string, userId?: string, operation?: string): AuthError {
    const error = new Error(message) as AuthError;
    error.name = 'AuthError';
    error.code = 'AUTH_ERROR';
    error.userId = userId;
    error.operation = operation;
    return error;
  }
}