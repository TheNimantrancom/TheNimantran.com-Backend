class ApiResponse {
    success;
    statusCode;
    message;
    data;
    constructor(statusCode, data, message = "Successful") {
        this.success = statusCode < 400;
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
    }
}
export default ApiResponse;
