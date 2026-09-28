// Mirrors the backend's ApiResponseClass<T> envelope shape.
export interface ApiResponseType<T> {
  data: T | null;
  success: boolean;
  message: string;
  errors: string[] | null;
  statusCode: number;
}

