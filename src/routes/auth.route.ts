import { Router } from "express";
import { verifyAuth } from "../middlewares/auth.middleware";
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
} from "../controllers/auth.controller";
const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/current-user", verifyAuth(), getCurrentUser);
router.post("/logout", verifyAuth(), logoutUser);

export default router;
