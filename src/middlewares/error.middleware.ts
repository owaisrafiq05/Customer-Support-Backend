import { Request, Response, NextFunction } from "express";
import { Error as MongooseError } from "mongoose";

interface DefaultError {
  statusCode: number;
  message: string;
}

interface MongoError extends Error {
  code?: number;
  keyValue?: Record<string, any>;
}

export interface CustomError extends Error {
  statusCode?: number;
}

export const errorMiddleware = (
  err: MongooseError | MongoError | CustomError | string,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const defaultError: DefaultError = {
    statusCode: 500,
    message: "An unknown error occurred",
  };

  if (typeof err === "string") {
    defaultError.message = err;
    defaultError.statusCode = 400;
  } else if (err instanceof Error) {
    defaultError.message = err.message;
    if ("statusCode" in err && typeof err.statusCode === "number") {
      defaultError.statusCode = err.statusCode;
    }
  }

  if (err instanceof MongooseError.ValidationError) {
    defaultError.statusCode = 400;
    defaultError.message = Object.values(err.errors)
      .map((item) => item.message)
      .join(", ");
  }

  if (typeof err === "object" && "code" in err && err.code === 11000) {
    defaultError.statusCode = 400;
    defaultError.message = `${Object.keys(
      (err as MongoError).keyValue || {}
    ).join(", ")} already in use`;
  }

  res.status(defaultError.statusCode).json({
    message: defaultError.message,
    statusCode: defaultError.statusCode,
  });
};
