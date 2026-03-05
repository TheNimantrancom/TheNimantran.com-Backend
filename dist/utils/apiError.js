class ApiError extends Error {
    statusCode;
    success;
    errors;
    data;
    constructor(statusCode, message = "The operation has been failed", errors = [], stack) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.success = false;
        this.errors = errors;
        this.data = null;
        if (stack) {
            this.stack = stack;
        }
        else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
export default ApiError;
