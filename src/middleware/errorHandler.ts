import { Request, Response, NextFunction } from 'express';

/**
 * Centralized error handling middleware.
 * Must be registered LAST in the Express middleware chain.
 * Catches all unhandled errors from controllers and middleware.
 */
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  const timestamp = new Date().toISOString();
  const isDev = process.env.NODE_ENV !== 'production';

  console.error(`[${timestamp}] ❌ Unhandled Error:`, {
    method: req.method,
    path: req.path,
    message: err.message,
    ...(isDev && { stack: err.stack }),
  });

  res.status(500).json({
    success: false,
    error: isDev ? err.message : 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(isDev && { stack: err.stack }),
  });
}
