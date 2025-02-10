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
  getCategories, // Import the getCategories function
  searchAudiobooks,
  uploadAudiobook,
  getAudiobookCoverImage,
  getAudiobooksByAuthor,
  getAudioFile,
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
router.post(
  "/uploadaudiobook",
  checkAuthorToken, // Check authentication first
  upload, // **Apply the multer middleware here**
  uploadAudiobook // Then call your controller
);
router.delete("/:id/delete", checkAuthorToken, deleteAudiobook); // Changed route
// Add this debug section
router.put(
  "/:id/update",
  checkAuthorToken, // Check authentication first
  (req, res, next) => {
    console.log("REQUEST BODY", req.body);
    console.log("REQUEST FILES", req.files);
    next(); // Pass control to the next middleware
  },
  upload, // Apply the multer middleware here**
  updateAudiobook // Then call your controller
);
router.get("/:id/get", checkAuthorToken, getAudiobookById); // Changed route
router.get("/:id/getbyauthor", checkAuthorToken, getAudiobooksByAuthor); // Changed route

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
router.get("/audio/:filename", getAudioFile); // The new audio file route
router.get("/categories", getCategories);

export default router;
