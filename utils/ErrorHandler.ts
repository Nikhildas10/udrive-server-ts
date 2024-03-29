class ErrorHandler extends Error {
  statusCode: number;

  constructor(message: any, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
      Error.captureStackTrace(this, this.constructor);

      // Add a console.log statement for debugging
      console.log(`Error Handler created: ${this.message} - Status Code: ${this.statusCode}`);
  }
}

export default ErrorHandler;
