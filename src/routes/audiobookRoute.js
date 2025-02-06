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
  getAudiobookCoverImage, // <-- ADD THIS IMPORT for getAudiobookCoverImage
} from "../controllers/audiobookController.js"; // Make sure the path to your controller is correct
import { checkUserOrAuthorToken } from "../middlewares/checkUserOrAuthor.js";
import {
  checkAuthorToken,
  checkUserToken,
} from "../middlewares/authMiddleware.js";
import { upload } from "../controllers/gridfs.js";

const router = express.Router();

router.get("/getbooks", checkAuthorToken, getAudiobooks); // Only fetch books, no upload
router.get("/cover-image/:filename", getAudiobookCoverImage); // <-- ADD THIS NEW ROUTE to serve cover images from GridFS
router.post(
  "/uploadaudiobook",
  checkAuthorToken, // Add the middleware to check token before the controller
  upload, // File upload middleware
  uploadAudiobook // Controller function
);
router.delete("/deleteaudiobooks/:id", checkAuthorToken, deleteAudiobook);
router.put(
  "/updateaudiobook/:id",
  checkAuthorToken, // Middleware to verify the author
  upload, // File upload middleware (if updating files)
  updateAudiobook // Controller function to update audiobook details
);
router.get("/getaudiobook/:id", checkAuthorToken, getAudiobookById);
router.get("/search", searchAudiobooks);
router.get("/category/:category", getAudiobooksByCategory);
router.post("/:id/review", checkUserOrAuthorToken, addRating);
// Route to remove a rating
router.delete("/:id/review", checkUserOrAuthorToken, removeRating);

// Route to edit a rating
router.put("/:id/review", checkUserOrAuthorToken, editRating);

export default router;
