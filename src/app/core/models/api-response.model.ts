export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface ApiError {
  success: false;
  statusCode: number;
  timestamp: string;
  path: string;
  message: string | string[];
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
