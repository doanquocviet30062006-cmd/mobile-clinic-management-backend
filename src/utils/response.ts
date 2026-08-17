import { Response } from 'express';

export const sendSuccess = (res: Response, data: any, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
};

export const sendError = (res: Response, message: string, statusCode = 500, errorCode?: string) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errorCode,
  });
};
