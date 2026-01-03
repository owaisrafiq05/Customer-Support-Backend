import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { throwError } from "../utils/helpers";

export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(throwError("Unauthorized Access", 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(throwError("Forbidden: Insufficient permissions", 403));
    }

    next();
  };
};

export const isAdmin = requireRole("admin");
export const isTeamOrAdmin = requireRole("admin", "team");
