import { Router } from "express";
import { verifyAuth } from "../middlewares/auth.middleware";
import { getUsers } from "../controllers/user.controller";
const router = Router();

router.get("/", verifyAuth(), getUsers);

export default router;
