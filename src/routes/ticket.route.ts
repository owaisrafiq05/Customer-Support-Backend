import { Router } from "express";
import { verifyAuth } from "../middlewares/auth.middleware";
import { isTeamOrAdmin } from "../middlewares/role.middleware";
import {
  createTicket,
  getMyTickets,
  getTicket,
  updateTicketStatus,
  addMessage,
  getTicketMessages,
} from "../controllers/ticket.controller";

const router = Router();

// All routes require authentication
router.use(verifyAuth());

// Customer routes
router.post("/", createTicket);
router.get("/my-tickets", getMyTickets);

// Shared routes (access controlled in controller)
router.get("/:ticketId", getTicket);
router.post("/:ticketId/messages", addMessage);
router.get("/:ticketId/messages", getTicketMessages);

// Team/Admin only
router.patch("/:ticketId/status", isTeamOrAdmin, updateTicketStatus);

export default router;
