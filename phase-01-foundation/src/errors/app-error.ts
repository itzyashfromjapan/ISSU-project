export interface AppErrorParams {
  code: string;
  message: string;
  cause?: unknown;
  recoverable?: boolean;
  details?: unknown;
}

export interface AppErrorJson {
  name: string;
  code: string;
  message: string;
  recoverable: boolean;
  cause?: unknown;
  details?: unknown;
}

export class AppError extends Error {
  readonly code: string;
  readonly recoverable: boolean;
  readonly details?: unknown;
  readonly cause?: unknown;

  constructor(params: AppErrorParams) {
    super(params.message);
    this.name = "AppError";
    this.code = params.code;
    this.recoverable = params.recoverable ?? true;
    if (params.cause !== undefined) {
      this.cause = params.cause;
    }
    if (params.details !== undefined) {
      this.details = params.details;
    }
  }

  toJSON(): AppErrorJson {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      recoverable: this.recoverable,
      ...(this.cause !== undefined ? { cause: this.cause } : {}),
      ...(this.details !== undefined ? { details: this.details } : {}),
    };
  }
}
