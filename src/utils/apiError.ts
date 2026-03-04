class ApiError extends Error {
  statusCode: number
  success: boolean
  errors: unknown[]
  data: null

  constructor(
    statusCode: number,
    message: string = "The operation has been failed",
    errors: unknown[] = [],
    stack?: string
  ) {
    super(message)

    this.statusCode = statusCode
    this.message = message
    this.success = false
    this.errors = errors
    this.data = null

    if (stack) {
      this.stack = stack
    } else {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

export default ApiError