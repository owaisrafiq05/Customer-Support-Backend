import { Router } from "express";
import { verifyAuth } from "../middlewares/auth.middleware";
import { upload } from "../services/storage.service";
import {
  createTicket,
  getTickets,
  getTicket,
  updateTicket,
  deleteTicket,
  addTicketMessage,
  getTicketMessages,
  getTicketStats,
} from "../controllers/ticket.controller";

const router = Router();

// All routes require authentication
router.use(verifyAuth());

// Get ticket statistics
router.get("/stats", getTicketStats);

// Create a ticket (with optional file attachments)
router.post("/", upload.array("attachments", 5), createTicket);

// Get all tickets (with filtering and pagination)
router.get("/", getTickets);

// Get single ticket by ID
router.get("/:id", getTicket);

// Update ticket (with optional file attachments)
router.put("/:id", upload.array("attachments", 5), updateTicket);

// Delete ticket (admin only)
router.delete("/:id", deleteTicket);

// Add a message to a ticket (with optional file attachments)
router.post("/:id/messages", upload.array("attachments", 5), addTicketMessage);

// Get all messages for a ticket
router.get("/:id/messages", getTicketMessages);

export default router;
