import { Router } from "express";
import { verifyAuth } from "../middlewares/auth.middleware";
import { upload } from "../services/storage.service";
import {
  createDataEntry,
  getDataEntries,
  getDataEntry,
  updateDataEntry,
  deleteDataEntry,
} from "../controllers/dataEntry.controller";

const router = Router();

// Create data entry (with optional image upload)
router.post(
  "/",
  verifyAuth(),
  upload.single("image"),
  createDataEntry
);

// Get all data entries (public, but can filter by createdBy)
router.get("/", getDataEntries);

// Get single data entry by ID
router.get("/:id", getDataEntry);

// Update data entry (with optional image upload)
router.put(
  "/:id",
  verifyAuth(),
  upload.single("image"),
  updateDataEntry
);

// Delete data entry
router.delete("/:id", verifyAuth(), deleteDataEntry);

export default router;

