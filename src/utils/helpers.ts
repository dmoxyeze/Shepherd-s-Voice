import { Request, Response, NextFunction } from "express";
import logger from "@/lib/logger";
import { IApiResponse } from "@/types";

export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Response helper class
 */
export class ResponseFormatter {
  /**
   * Send a successful response
   */
  static sendSuccess<T>(
    res: Response,
    data: T,
    message = "Operation successful",
    code = 200
  ): Response<IApiResponse<T>> {
    const response: IApiResponse<T> = {
      success: true,
      message,
      data,
      code,
    };

    logger.info(`Success: ${message}`);
    return res.status(code).json(response);
  }

  /**
   * Send a paginated response
   */
  static sendPaginated<T>(
    res: Response,
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
    },
    message = "Data retrieved successfully"
  ): Response<IApiResponse<T[]>> {
    const totalPages = Math.ceil(pagination.total / pagination.limit);

    const response: IApiResponse<T[]> = {
      success: true,
      message,
      data,
      code: 200,
      pagination: {
        ...pagination,
        totalPages,
      },
    };

    logger.info(`Paginated data fetched (Page ${pagination.page})`);
    return res.status(200).json(response);
  }

  /**
   * Send an error response
   */
  static sendError(
    res: Response,
    message = "An error occurred",
    code = 500,
    error?: unknown
  ): Response<IApiResponse<null>> {
    const errorMessage = error instanceof Error ? error.message : String(error);

    const response: IApiResponse<null> = {
      success: false,
      message,
      error: errorMessage,
      code,
    };

    logger.error(`Error ${code}: ${message}`, error);
    return res.status(code).json(response);
  }

  /**
   * Handle validation errors (e.g., Zod, Joi)
   */
  static sendValidationError(
    res: Response,
    error: unknown
  ): Response<IApiResponse<null>> {
    let message = "Validation failed";
    let details: string[] = [];

    if (error instanceof Error) {
      // Handle Zod errors
      if ("errors" in error) {
        details = (error as any).errors.map((e: any) => e.message);
      } else {
        details = [error.message];
      }
    }

    const response: IApiResponse<null> = {
      success: false,
      message,
      error: details.join(", "),
      code: 422,
    };

    logger.warn(`Validation error: ${details.join(", ")}`);
    return res.status(422).json(response);
  }

  /**
   * Send a "Not Found" response
   */
  static sendNotFound(
    res: Response,
    entity = "Resource"
  ): Response<IApiResponse<null>> {
    const response: IApiResponse<null> = {
      success: false,
      message: `${entity} not found`,
      code: 404,
    };

    logger.warn(`Not Found: ${entity}`);
    return res.status(404).json(response);
  }

  /**
   * Send an "Unauthorized" response
   */
  static sendUnauthorized(
    res: Response,
    message = "Unauthorized"
  ): Response<IApiResponse<null>> {
    const response: IApiResponse<null> = {
      success: false,
      message,
      code: 401,
    };

    logger.warn(`Unauthorized: ${message}`);
    return res.status(401).json(response);
  }
}
