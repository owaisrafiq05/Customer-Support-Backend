import { Response, NextFunction } from "express";
import { User, UserRole } from "../models/user.model";
import { Ticket } from "../models/ticket.model";
import { AuthRequest } from "../middlewares/auth.middleware";
import { throwError } from "../utils/helpers";

// Get all tickets (with pagination and filters)
export const getAllTickets = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      category,
      assignedTo,
    } = req.query;

    const filter: Record<string, any> = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (assignedTo) filter.assignedTo = assignedTo;

    const tickets = await Ticket.find(filter)
      .populate("customer", "name email")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit);

    const total = await Ticket.countDocuments(filter);

    return res.status(200).json({
      success: true,
      message: "Tickets retrieved successfully",
      data: {
        tickets,
        pagination: {
          page: +page,
          limit: +limit,
          total,
          pages: Math.ceil(total / +limit),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

// Get all users (for role management)
export const getAllUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { page = 1, limit = 10, role } = req.query;

    const filter: Record<string, any> = {};
    if (role) filter.role = role;

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit);

    const total = await User.countDocuments(filter);

    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: {
        users,
        pagination: {
          page: +page,
          limit: +limit,
          total,
          pages: Math.ceil(total / +limit),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

// Update user role
export const updateUserRole = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role || !Object.values(UserRole).includes(role)) {
      return next(throwError("Invalid role provided", 400));
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select("-password");

    if (!user) {
      return next(throwError("User not found", 404));
    }

    return res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
      data: user,
    });
  } catch (error) {
    return next(error);
  }
};

// Assign ticket to team member
export const assignTicket = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { ticketId } = req.params;
    const { assignedTo } = req.body;

    // Verify assignee exists and is team/admin
    if (assignedTo) {
      const assignee = await User.findById(assignedTo);
      if (!assignee) {
        return next(throwError("Assignee not found", 404));
      }
      if (!["admin", "team"].includes(assignee.role)) {
        return next(throwError("Can only assign to team members or admins", 400));
      }
    }

    const ticket = await Ticket.findByIdAndUpdate(
      ticketId,
      { assignedTo: assignedTo || null },
      { new: true }
    )
      .populate("customer", "name email")
      .populate("assignedTo", "name email");

    if (!ticket) {
      return next(throwError("Ticket not found", 404));
    }

    return res.status(200).json({
      success: true,
      message: assignedTo ? "Ticket assigned successfully" : "Ticket unassigned",
      data: ticket,
    });
  } catch (error) {
    return next(error);
  }
};

// Get dashboard stats
export const getDashboardStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      totalUsers,
      totalTeamMembers,
    ] = await Promise.all([
      Ticket.countDocuments(),
      Ticket.countDocuments({ status: "open" }),
      Ticket.countDocuments({ status: "in_progress" }),
      Ticket.countDocuments({ status: "resolved" }),
      User.countDocuments({ role: "customer" }),
      User.countDocuments({ role: { $in: ["admin", "team"] } }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Dashboard stats retrieved",
      data: {
        tickets: {
          total: totalTickets,
          open: openTickets,
          inProgress: inProgressTickets,
          resolved: resolvedTickets,
        },
        users: {
          customers: totalUsers,
          teamMembers: totalTeamMembers,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};
