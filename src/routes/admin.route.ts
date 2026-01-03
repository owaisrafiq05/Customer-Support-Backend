import { Router } from "express";
import { verifyAuth } from "../middlewares/auth.middleware";
import { isAdmin } from "../middlewares/role.middleware";
import {
  getAllTickets,
  getAllUsers,
  updateUserRole,
  assignTicket,
  getDashboardStats,
} from "../controllers/admin.controller";

const router = Router();

// All routes require admin role
router.use(verifyAuth(), isAdmin);

router.get("/dashboard", getDashboardStats);
router.get("/tickets", getAllTickets);
router.get("/users", getAllUsers);
router.patch("/users/:userId/role", updateUserRole);
router.patch("/tickets/:ticketId/assign", assignTicket);

export default router;
