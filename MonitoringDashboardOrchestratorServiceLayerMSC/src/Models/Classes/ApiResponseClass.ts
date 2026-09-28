export default class ApiResponseClass<T> {
    public readonly data: T | null;
    public readonly success: boolean;
    public readonly message: string;
    public readonly errors: string[] | null;
    public readonly statusCode: number;

    private constructor(data: T | null, success: boolean, message: string, errors: string[] | null, statusCode: number) {
        this.data = data;
        this.success = success;
        this.message = message;
        this.errors = errors;
        this.statusCode = statusCode;
    }

    public static succeeded<T>(data: T, message: string = 'Operation completed successfully.', statusCode: number = 200): ApiResponseClass<T> {
        return new ApiResponseClass<T>(data, true, message, null, statusCode);
    }

    public static failed<T = null>(message: string, errors: string[] | null = null, statusCode: number = 400): ApiResponseClass<T> {
        return new ApiResponseClass<T>(null, false, message, errors ?? [message], statusCode);
    }
}
