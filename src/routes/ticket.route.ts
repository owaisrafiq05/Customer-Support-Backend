import { Router } from "express";
import { verifyAuth } from "../middlewares/auth.middleware";
import { isTeamOrAdmin } from "../middlewares/role.middleware";
import { upload } from "../services/storage.service";
import {
  createTicket,
  getMyTickets,
  getTicket,
  updateTicket,
  updateTicketStatus,
  addMessage,
  getTicketMessages,
  deleteTicket,
} from "../controllers/ticket.controller";

const router = Router();

// All routes require authentication
router.use(verifyAuth());

// Customer routes
router.post("/", upload.array("attachments", 5), createTicket);
router.get("/my-tickets", getMyTickets);

// Shared routes (access controlled in controller)
router.get("/:ticketId", getTicket);
router.put("/:ticketId", upload.array("attachments", 5), updateTicket);
router.delete("/:ticketId", deleteTicket);
router.post("/:ticketId/messages", upload.array("attachments", 5), addMessage);
router.get("/:ticketId/messages", getTicketMessages);

// Team/Admin only
router.patch("/:ticketId/status", isTeamOrAdmin, updateTicketStatus);

export default router;
