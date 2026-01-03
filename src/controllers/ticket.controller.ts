import { NextFunction, Request, Response } from "express";
import { Ticket, TicketStatus } from "../models/ticket.model";
import { TicketMessage, SenderRole } from "../models/ticketMessage.model";
import { throwError } from "../utils/helpers";
import { AuthRequest } from "../middlewares/auth.middleware";
import {
  uploadFile,
  removeFile,
  getImageUrl,
} from "../services/storage.service";
import { getPaginatedData } from "../utils/helpers";

export const createTicket = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    if (!req.user) return next(throwError("Unauthorized Access", 401));

    const { title, description, priority, category, tags } = req.body;

    if (!title) return next(throwError("Title is required", 400));
    if (!description)
      return next(throwError("Description is required", 400));

    const attachments = [];

    // Handle multiple file uploads if present
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        try {
          const { filename } = await uploadFile(file, "uploads/tickets");
          const fileUrl = getImageUrl(filename);
          attachments.push({
            filename: file.originalname,
            url: fileUrl,
            mimeType: file.mimetype,
            size: file.size,
            uploadedAt: new Date(),
          });
        } catch (error) {
          return next(throwError("Failed to upload attachment", 500));
        }
      }
    }

    const ticket = await Ticket.create({
      title,
      description,
      priority: priority || "medium",
      category: category || "general",
      customer: req.user._id,
      tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
      attachments,
    });

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate("customer", "name email avatar")
      .populate("assignedTo", "name email avatar");

    return res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      data: populatedTicket,
    });
  } catch (error) {
    return next(error);
  }
};

export const getTickets = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    if (!req.user) return next(throwError("Unauthorized Access", 401));

    const page = +(req.query.page || 1);
    const limit = +(req.query.limit || 10);
    const search = req.query.search || "";
    const status = req.query.status || "";
    const priority = req.query.priority || "";
    const category = req.query.category || "";
    const assignedTo = req.query.assignedTo || "";

    const query: any = {};

    // Role-based filtering
    if (req.user.role === "customer") {
      // Customers can only see their own tickets
      query.customer = req.user._id;
    } else if (req.user.role === "team") {
      // Team members can see tickets assigned to them or unassigned tickets
      if (assignedTo) {
        query.assignedTo = assignedTo;
      }
    }
    // Admins can see all tickets (no additional filter)

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { ticketNumber: { $regex: search, $options: "i" } },
      ];
    }
    if (status) {
      query.status = status;
    }
    if (priority) {
      query.priority = priority;
    }
    if (category) {
      query.category = category;
    }

    const { data, pagination } = await getPaginatedData({
      model: Ticket,
      query,
      page,
      limit,
      sort: { createdAt: -1 },
      populate: [
        {
          path: "customer",
          select: "name email avatar",
        },
        {
          path: "assignedTo",
          select: "name email avatar",
        },
      ],
      select: "",
    });

    return res.status(200).json({
      success: true,
      data,
      pagination,
    });
  } catch (error) {
    return next(error);
  }
};

export const getTicket = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    if (!req.user) return next(throwError("Unauthorized Access", 401));

    const { id } = req.params;

    const ticket = await Ticket.findById(id)
      .populate("customer", "name email avatar")
      .populate("assignedTo", "name email avatar");

    if (!ticket) return next(throwError("Ticket not found", 404));

    // Authorization check
    const customerId = typeof ticket.customer === 'object' && 'id' in ticket.customer 
      ? ticket.customer.id 
      : ticket.customer.toString();
    
    if (
      req.user.role === "customer" &&
      customerId !== req.user.id
    ) {
      return next(throwError("You can only view your own tickets", 403));
    }

    return res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateTicket = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    if (!req.user) return next(throwError("Unauthorized Access", 401));

    const { id } = req.params;
    const { title, description, status, priority, category, tags, assignedTo } =
      req.body;

    const ticket = await Ticket.findById(id);

    if (!ticket) return next(throwError("Ticket not found", 404));

    // Authorization check
    if (req.user.role === "customer") {
      if (ticket.customer.toString() !== req.user.id) {
        return next(throwError("You can only update your own tickets", 403));
      }
      // Customers can only update title and description
      if (title) ticket.title = title;
      if (description) ticket.description = description;
    } else {
      // Team and admin can update all fields
      if (title) ticket.title = title;
      if (description) ticket.description = description;
      if (status) ticket.status = status;
      if (priority) ticket.priority = priority;
      if (category) ticket.category = category;
      if (tags) ticket.tags = Array.isArray(tags) ? tags : [tags];
      if (assignedTo !== undefined) ticket.assignedTo = assignedTo;

      // Set resolved/closed timestamps
      if (status === TicketStatus.RESOLVED && !ticket.resolvedAt) {
        ticket.resolvedAt = new Date();
      }
      if (status === TicketStatus.CLOSED && !ticket.closedAt) {
        ticket.closedAt = new Date();
      }
    }

    // Handle new attachments
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        try {
          const { filename } = await uploadFile(file, "uploads/tickets");
          const fileUrl = getImageUrl(filename);
          ticket.attachments.push({
            filename: file.originalname,
            url: fileUrl,
            mimeType: file.mimetype,
            size: file.size,
            uploadedAt: new Date(),
          });
        } catch (error) {
          return next(throwError("Failed to upload attachment", 500));
        }
      }
    }

    await ticket.save();

    const updatedTicket = await Ticket.findById(id)
      .populate("customer", "name email avatar")
      .populate("assignedTo", "name email avatar");

    return res.status(200).json({
      success: true,
      message: "Ticket updated successfully",
      data: updatedTicket,
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteTicket = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    if (!req.user) return next(throwError("Unauthorized Access", 401));

    const { id } = req.params;

    const ticket = await Ticket.findById(id);

    if (!ticket) return next(throwError("Ticket not found", 404));

    // Only admins can delete tickets
    if (req.user.role !== "admin") {
      return next(throwError("Only admins can delete tickets", 403));
    }

    // Delete associated attachments from storage
    for (const attachment of ticket.attachments) {
      try {
        const filename = attachment.url.split("/").pop();
        if (filename) {
          await removeFile(filename);
        }
      } catch (error) {
        console.error("Failed to delete attachment:", error);
      }
    }

    // Delete associated ticket messages
    await TicketMessage.deleteMany({ ticket: id });

    await Ticket.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};

export const addTicketMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    if (!req.user) return next(throwError("Unauthorized Access", 401));

    const { id } = req.params;
    const { content } = req.body;

    if (!content) return next(throwError("Message content is required", 400));

    const ticket = await Ticket.findById(id);

    if (!ticket) return next(throwError("Ticket not found", 404));

    // Authorization check
    if (
      req.user.role === "customer" &&
      ticket.customer.toString() !== req.user.id
    ) {
      return next(
        throwError("You can only add messages to your own tickets", 403)
      );
    }

    const attachments = [];

    // Handle multiple file uploads if present
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        try {
          const { filename } = await uploadFile(
            file,
            "uploads/ticket-messages"
          );
          const fileUrl = getImageUrl(filename);
          attachments.push({
            filename: file.originalname,
            url: fileUrl,
            mimeType: file.mimetype,
            size: file.size,
            uploadedAt: new Date(),
          });
        } catch (error) {
          return next(throwError("Failed to upload attachment", 500));
        }
      }
    }

    // Determine sender role
    let senderRole = SenderRole.CUSTOMER;
    if (req.user.role === "admin" || req.user.role === "team") {
      senderRole = SenderRole.AGENT;
    }

    const message = await TicketMessage.create({
      ticket: id,
      sender: req.user._id,
      senderRole,
      content,
      attachments,
    });

    const populatedMessage = await TicketMessage.findById(message._id).populate(
      "sender",
      "name email avatar"
    );

    return res.status(201).json({
      success: true,
      message: "Message added successfully",
      data: populatedMessage,
    });
  } catch (error) {
    return next(error);
  }
};

export const getTicketMessages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    if (!req.user) return next(throwError("Unauthorized Access", 401));

    const { id } = req.params;
    const page = +(req.query.page || 1);
    const limit = +(req.query.limit || 50);

    const ticket = await Ticket.findById(id);

    if (!ticket) return next(throwError("Ticket not found", 404));

    // Authorization check
    if (
      req.user.role === "customer" &&
      ticket.customer.toString() !== req.user.id
    ) {
      return next(
        throwError("You can only view messages from your own tickets", 403)
      );
    }

    const { data, pagination } = await getPaginatedData({
      model: TicketMessage,
      query: { ticket: id },
      page,
      limit,
      sort: { createdAt: 1 },
      populate: {
        path: "sender",
        select: "name email avatar",
      },
      select: "",
    });

    return res.status(200).json({
      success: true,
      data,
      pagination,
    });
  } catch (error) {
    return next(error);
  }
};

export const getTicketStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    if (!req.user) return next(throwError("Unauthorized Access", 401));

    const query: any = {};

    // Role-based filtering
    if (req.user.role === "customer") {
      query.customer = req.user._id;
    } else if (req.user.role === "team") {
      query.assignedTo = req.user._id;
    }

    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      pendingTickets,
      resolvedTickets,
      closedTickets,
    ] = await Promise.all([
      Ticket.countDocuments(query),
      Ticket.countDocuments({ ...query, status: TicketStatus.OPEN }),
      Ticket.countDocuments({ ...query, status: TicketStatus.IN_PROGRESS }),
      Ticket.countDocuments({ ...query, status: TicketStatus.PENDING }),
      Ticket.countDocuments({ ...query, status: TicketStatus.RESOLVED }),
      Ticket.countDocuments({ ...query, status: TicketStatus.CLOSED }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalTickets,
        openTickets,
        inProgressTickets,
        pendingTickets,
        resolvedTickets,
        closedTickets,
      },
    });
  } catch (error) {
    return next(error);
  }
};
