import express from "express";
import {
  addRating,
  editRating,
  removeRating,
  deleteAudiobook,
  getAudiobooks,
  updateAudiobook,
  getAudiobookById,
  getAudiobooksByCategory,
  searchAudiobooks,
  uploadAudiobook,
  getAudiobookCoverImage,
} from "../controllers/audiobookController.js";
import {
  checkAuthorToken,
  checkUserToken,
} from "../middlewares/authMiddleware.js";
import { upload } from "../controllers/gridfs.js";

const router = express.Router();

// Public routes (no authentication required)
router.get("/getbooks", getAudiobooks);
router.get("/cover-image/:filename", getAudiobookCoverImage);
router.get("/search", searchAudiobooks);
router.get("/category/:category", getAudiobooksByCategory);

// Author-only routes
router.post("/uploadaudiobook", checkAuthorToken, upload, uploadAudiobook);
router.delete("/:id/delete", checkAuthorToken, deleteAudiobook); // Changed route
router.put("/:id/update", checkAuthorToken, upload, updateAudiobook); // Changed route
router.get("/:id/get", checkAuthorToken, getAudiobookById); // Changed route

// User rating route
router.post("/:id/review/user", checkUserToken, addRating);

// Author rating route
router.post("/:id/review/author", checkAuthorToken, addRating);

// User remove a rating
router.delete("/:id/review/user", checkUserToken, removeRating);

// Author remove a rating
router.delete("/:id/review/author", checkAuthorToken, removeRating);

// User Route to edit a rating
router.put("/:id/review/user", checkUserToken, editRating);

// Author Route to edit a rating
router.put("/:id/review/author", checkAuthorToken, editRating);

export default router;
