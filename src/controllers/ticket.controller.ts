import { Response, NextFunction } from "express";
import { Ticket, TicketStatus } from "../models/ticket.model";
import { TicketMessage } from "../models/ticketMessage.model";
import { AuthRequest } from "../middlewares/auth.middleware";
import { throwError } from "../utils/helpers";
import { analyzeTicket } from "../services/ai.service";

// Create ticket (customer)
export const createTicket = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { title, description, category, attachments } = req.body;

    if (!title) return next(throwError("Title is required", 400));
    if (!description) return next(throwError("Description is required", 400));

    // Create ticket
    const ticket = await Ticket.create({
      title,
      description,
      category,
      attachments,
      customer: req.user?._id,
    });

    // Run AI analysis in background and update ticket
    analyzeTicket({ title, description })
      .then(async (aiResult) => {
        await Ticket.findByIdAndUpdate(ticket._id, aiResult);
      })
      .catch((err) => console.error("AI analysis failed:", err));

    return res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      data: ticket,
    });
  } catch (error) {
    return next(error);
  }
};

// Get customer's tickets
export const getMyTickets = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const filter: Record<string, any> = { customer: req.user?._id };
    if (status) filter.status = status;

    const tickets = await Ticket.find(filter)
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit);

    const total = await Ticket.countDocuments(filter);

    return res.status(200).json({
      success: true,
      message: "Tickets retrieved",
      data: {
        tickets,
        pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / +limit) },
      },
    });
  } catch (error) {
    return next(error);
  }
};

// Get single ticket
export const getTicket = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { ticketId } = req.params;

    const ticket = await Ticket.findById(ticketId)
      .populate("customer", "name email")
      .populate("assignedTo", "name email");

    if (!ticket) return next(throwError("Ticket not found", 404));

    // Customers can only view their own tickets
    const customerId = (ticket.customer as any)._id || ticket.customer;
    const isOwner = customerId.toString() === req.user?._id?.toString();
    const isStaff = ["admin", "team"].includes(req.user?.role || "");

    if (!isOwner && !isStaff) {
      return next(throwError("Access denied", 403));
    }

    return res.status(200).json({
      success: true,
      message: "Ticket retrieved",
      data: ticket,
    });
  } catch (error) {
    return next(error);
  }
};

// Update ticket status (team/admin)
export const updateTicketStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    if (!Object.values(TicketStatus).includes(status)) {
      return next(throwError("Invalid status", 400));
    }

    const updateData: Record<string, any> = { status };

    if (status === TicketStatus.RESOLVED) {
      updateData.resolvedAt = new Date();
    } else if (status === TicketStatus.CLOSED) {
      updateData.closedAt = new Date();
    }

    const ticket = await Ticket.findByIdAndUpdate(ticketId, updateData, { new: true })
      .populate("customer", "name email")
      .populate("assignedTo", "name email");

    if (!ticket) return next(throwError("Ticket not found", 404));

    return res.status(200).json({
      success: true,
      message: `Ticket status updated to ${status}`,
      data: ticket,
    });
  } catch (error) {
    return next(error);
  }
};

// Add message to ticket
export const addMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { ticketId } = req.params;
    const { content, isInternal, attachments } = req.body;

    if (!content) return next(throwError("Message content is required", 400));

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return next(throwError("Ticket not found", 404));

    const isOwner = ticket.customer.toString() === req.user?._id?.toString();
    const isStaff = ["admin", "team"].includes(req.user?.role || "");

    if (!isOwner && !isStaff) {
      return next(throwError("Access denied", 403));
    }

    // Determine sender role
    let senderRole: "customer" | "agent" = "customer";
    if (isStaff) senderRole = "agent";

    const message = await TicketMessage.create({
      ticket: ticketId,
      sender: req.user?._id,
      senderRole,
      content,
      isInternal: isStaff ? isInternal || false : false,
      attachments,
    });

    // Update firstResponseAt if this is first agent response
    if (senderRole === "agent" && !ticket.firstResponseAt) {
      await Ticket.findByIdAndUpdate(ticketId, { firstResponseAt: new Date() });
    }

    return res.status(201).json({
      success: true,
      message: "Message added",
      data: message,
    });
  } catch (error) {
    return next(error);
  }
};

// Get ticket messages
export const getTicketMessages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { ticketId } = req.params;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return next(throwError("Ticket not found", 404));

    const isOwner = ticket.customer.toString() === req.user?._id?.toString();
    const isStaff = ["admin", "team"].includes(req.user?.role || "");

    if (!isOwner && !isStaff) {
      return next(throwError("Access denied", 403));
    }

    // Customers don't see internal messages
    const filter: Record<string, any> = { ticket: ticketId };
    if (!isStaff) filter.isInternal = false;

    const messages = await TicketMessage.find(filter)
      .populate("sender", "name email role")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      message: "Messages retrieved",
      data: messages,
    });
  } catch (error) {
    return next(error);
  }
};
