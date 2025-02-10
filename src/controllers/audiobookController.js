// import { getGridFSBucket } from "./gridfs.js"; // ✅ Use the getter function
// import asyncHandler from "express-async-handler";
// import Audiobook from "../models/audiobookModel.js";
// import Author from "../models/authorModel.js";
// import jwt from "jsonwebtoken";
// import dotenv from "dotenv";
// import mongoose from "mongoose";

// dotenv.config();

// const db = mongoose.connection.db; // Use the default connection's db instance

// const uploadAudiobook = asyncHandler(async (req, res, next) => {
//   try {
//     // Extract from request
//     const { title, description, category } = req.body; // Access text fields

//     // Validate the text inputs
//     if (!title || !description || !category) {
//       return res
//         .status(400)
//         .json({ error: "Please provide title, description, and category." });
//     }

//     // Access the files
//     const audiobookFile = req.files["audiobook"][0];
//     const imageFile = req.files["image"][0];

//     // Get GridFSBucket instance
//     let gridfsBucket = getGridFSBucket();

//     let audioFileId;
//     // Upload audiobook and image concurrently
//     const uploadAudioPromise = new Promise((resolve, reject) => {
//       const audioUploadStream = gridfsBucket.openUploadStream(
//         audiobookFile.originalname,
//         { contentType: audiobookFile.mimetype }
//       );

//       audioUploadStream.on("finish", async () => {
//         audioFileId = audioUploadStream.id;
//         resolve();
//       });
//       audioUploadStream.on("error", reject);
//       audioUploadStream.end(audiobookFile.buffer);
//     });

//     const uploadImagePromise = new Promise((resolve, reject) => {
//       const imageUploadStream = gridfsBucket.openUploadStream(
//         imageFile.originalname,
//         { contentType: imageFile.mimetype }
//       );
//       imageUploadStream.on("finish", resolve);
//       imageUploadStream.on("error", reject);
//       imageUploadStream.end(imageFile.buffer);
//     });

//     await Promise.all([uploadAudioPromise, uploadImagePromise]);

//     // Save metadata in the Audiobook collection
//     const newAudiobook = new Audiobook({
//       authorId: req.author.id,
//       authorName: req.author.first_name,
//       title: title, // Use the title from reqx.body
//       coverImage: imageFile.originalname,
//       audioFile: audiobookFile.originalname, // Store the filename!
//       uploadedAt: new Date(),
//       description: description, // Use the description from req.body
//       category: category, // Use the category from req.body
//       genre: "Add genre here", // Optional
//     });
//     console.log({ newAudiobook });
//     await newAudiobook.save();

//     res.status(201).json({
//       message: "Files and metadata uploaded successfully",
//       authorId: req.author._id,
//     });
//   } catch (error) {
//     console.error(error);
//     return next(error);
//   }
// });
// const getAudiobooks = asyncHandler(async (req, res) => {
//   try {
//     // Extract the authorId from the request's query parameters
//     const authorId = req.query.authorId;

//     // Construct the base query to find audiobooks
//     let query = {};

//     // If authorId is provided, add it to the query to filter by author
//     if (authorId) {
//       query = { authorId: authorId };
//     }

//     const audiobooks = await Audiobook.find(query);

//     if (!audiobooks.length) {
//       return res.status(404).json({
//         success: false,
//         message: "No audiobooks found",
//       });
//     }

//     const formattedBooks = await Promise.all(
//       // Use Promise.all to handle asynchronous operations in map
//       audiobooks.map(async (book) => {
//         console.log(book);
//         // Make the mapping function async
//         let base64Image = null;
//         try {
//           const bucket = getGridFSBucket();
//           const coverImageFile = await bucket
//             .find({ filename: book.coverImage })
//             .toArray();

//           if (coverImageFile.length > 0) {
//             const downloadStream = bucket.openDownloadStreamByName(
//               book.coverImage
//             );
//             const chunks = [];
//             for await (const chunk of downloadStream) {
//               // Asynchronously iterate over stream chunks
//               chunks.push(chunk);
//             }
//             const buffer = Buffer.concat(chunks);
//             base64Image = buffer.toString("base64"); // Convert buffer to base64 string
//           }
//         } catch (error) {
//           console.error("Error fetching cover image from GridFS:", error);
//           // Handle error appropriately, e.g., set base64Image to null or a default image
//         }

//         return {
//           id: book._id,
//           author: book.authorId,
//           // coverImageData: base64Image, // New field to hold base64 image data
//           url: `/api/audiobooks/cover-image/${book.coverImage}`, // Keep the file serving URL for potential future use or fallback
//           audioFile: audioFile.originalname, //audio file
//           name: book.title,
//           publisher: book.authorName || "Unknown",
//         };
//       })
//     );

//     res.status(200).json({
//       success: true,
//       data: formattedBooks,
//     });

//     console.log(formattedBooks);
//   } catch (error) {
//     console.error("Error in getAudiobooks:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// });

// const getAudioFile = asyncHandler(async (req, res) => {
//   try {
//     const filename = req.params.filename; // Get filename from the URL
//     const gridfsBucket = getGridFSBucket(); // Get GridFSBucket instance
//     console.log("filename", filename);
//     const downloadStream = gridfsBucket.openDownloadStreamByName(filename); //Open download stream

//     downloadStream.on("data", (chunk) => {
//       res.write(chunk); // Stream the data to the response
//     });

//     downloadStream.on("error", (error) => {
//       console.error("GridFS stream error:", error);
//       res.status(404).send("Audio not found"); // Handle file not found
//     });

//     downloadStream.on("end", () => {
//       res.end(); // End the response
//     });
//   } catch (error) {
//     console.error("Error in getAudioFile:", error);
//     res.status(500).send("Server error"); // Handle server errors
//   }
// });
// // New controller function to serve cover images from GridFS
// const getAudiobookCoverImage = asyncHandler(async (req, res) => {
//   try {
//     const filename = req.params.filename;
//     const bucket = getGridFSBucket(); // ✅ Get GridFSBucket instance

//     const downloadStream = bucket.openDownloadStreamByName(filename);

//     downloadStream.on("data", (chunk) => {
//       res.write(chunk); // Stream chunks to response
//     });

//     downloadStream.on("error", (error) => {
//       if (error.code === "ENOENT") {
//         return res.status(404).send("Image not found"); // Handle file not found
//       }
//       console.error("GridFS download stream error:", error);
//       res.status(500).send("Error retrieving image"); // Handle other errors
//     });

//     downloadStream.on("end", () => {
//       res.end(); // End the response when stream ends
//     });
//   } catch (error) {
//     console.error("Error in getAudiobookCoverImage:", error);
//     res.status(500).send("Server error"); // Handle server errors
//   }
// });

// // delete a book
// const deleteAudiobook = asyncHandler(async (req, res, next) => {
//   try {
//     const { id } = req.params; // Ensure the ID comes from req.params

//     // Check if the audiobook exists
//     const audiobook = await Audiobook.findById(id);
//     if (!audiobook) {
//       return res.status(404).json({ error: "Audiobook not found" });
//     }

//     console.log("Audiobook title:", audiobook.title); // Log the audiobook title

//     // Check if the authenticated author matches the audiobook's author
//     const token = req.headers.authorization.split(" ")[1]; // Assuming JWT token is passed
//     const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

//     if (audiobook.authorId.toString() !== decodedToken.authorId) {
//       return res
//         .status(403)
//         .json({ error: "You are not authorized to delete this audiobook" });
//     }

//     // Get GridFSBucket instance safely
//     let gridfsBucket;
//     try {
//       gridfsBucket = getGridFSBucket();
//     } catch (error) {
//       return res.status(500).json({ error: "GridFSBucket is not initialized" });
//     }

//     // Check for the file in GridFS using the actual filename
//     const audiobookFile = await gridfsBucket
//       .find({ filename: "file_example_MP3_700KB.mp3" }) // Use the actual filename here
//       .toArray();

//     console.log("Audiobook file found:", audiobookFile);

//     if (audiobookFile.length > 0) {
//       // Delete audiobook file from GridFS
//       await gridfsBucket.delete(audiobookFile[0]._id);
//       console.log("Audiobook file deleted from GridFS");
//     } else {
//       console.log("Audiobook file not found in GridFS");
//     }

//     // Check for the cover image in GridFS
//     const coverImageFile = await gridfsBucket
//       .find({ filename: audiobook.coverImage })
//       .toArray();

//     if (coverImageFile.length > 0) {
//       await gridfsBucket.delete(coverImageFile[0]._id);
//       console.log("Cover image file deleted from GridFS");
//     }

//     // Delete audiobook metadata from MongoDB
//     await Audiobook.findByIdAndDelete(id);

//     res.status(200).json({ message: "Audiobook deleted successfully" });
//   } catch (error) {
//     console.error(error);
//     return next(error);
//   }
// });

// //update a book details
// const updateAudiobook = asyncHandler(async (req, res, next) => {
//   try {
//     console.log("Received audiobook ID for update:", req.params.id);

//     // Validate ID format
//     if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
//       return res.status(400).json({ error: "Invalid audiobook ID format" });
//     }

//     // Convert ID to ObjectId
//     const audiobookId = new mongoose.Types.ObjectId(req.params.id);

//     // Find the audiobook by ID
//     let audiobook = await Audiobook.findById(audiobookId);
//     if (!audiobook) {
//       return res.status(404).json({ error: "Audiobook not found" });
//     }

//     console.log("Found audiobook for update:", audiobook);

//     // Ensure the author is authenticated
//     if (!req.author) {
//       return res.status(401).json({ error: "Unauthorized, author not found" });
//     }

//     // Check if the authorId matches
//     if (audiobook.authorId.toString() !== req.author._id.toString()) {
//       return res
//         .status(403)
//         .json({ error: "You are not authorized to update this audiobook" });
//     }

//     // Prepare updated data
//     const updateData = {};
//     if (req.body.title) updateData.title = req.body.title;
//     if (req.body.description) updateData.description = req.body.description;
//     if (req.body.category) updateData.category = req.body.category;
//     if (req.body.genre) updateData.genre = req.body.genre;

//     // Handle file uploads if provided
//     if (req.files) {
//       if (req.files["image"]) {
//         const imageFile = req.files["image"][0];

//         // Delete old cover image from GridFS
//         const oldImageFile = await gridfsBucket
//           .find({ filename: audiobook.coverImage })
//           .toArray();
//         if (oldImageFile.length > 0) {
//           await gridfsBucket.delete(oldImageFile[0]._id);
//           console.log("Deleted old cover image:", audiobook.coverImage);
//         }

//         // Upload new cover image
//         const imageUploadStream = gridfsBucket.openUploadStream(
//           imageFile.originalname,
//           {
//             contentType: imageFile.mimetype,
//           }
//         );
//         imageUploadStream.end(imageFile.buffer);
//         await new Promise((resolve, reject) => {
//           imageUploadStream.on("finish", resolve);
//           imageUploadStream.on("error", reject);
//         });

//         updateData.coverImage = imageFile.originalname;
//       }

//       if (req.files["audiobook"]) {
//         const audiobookFile = req.files["audiobook"][0];

//         // Delete old audiobook file from GridFS
//         const oldAudioFile = await gridfsBucket
//           .find({ filename: audiobook.title })
//           .toArray();
//         if (oldAudioFile.length > 0) {
//           await gridfsBucket.delete(oldAudioFile[0]._id);
//           console.log("Deleted old audiobook file:", audiobook.title);
//         }

//         // Upload new audiobook file
//         const audioUploadStream = gridfsBucket.openUploadStream(
//           audiobookFile.originalname,
//           {
//             contentType: audiobookFile.mimetype,
//           }
//         );
//         audioUploadStream.end(audiobookFile.buffer);
//         await new Promise((resolve, reject) => {
//           audioUploadStream.on("finish", resolve);
//           audioUploadStream.on("error", reject);
//         });

//         updateData.title = audiobookFile.originalname;
//       }
//     }

//     // Update audiobook in database
//     audiobook = await Audiobook.findByIdAndUpdate(audiobookId, updateData, {
//       new: true,
//     });
//     console.log("Updated audiobook:", audiobook);

//     res.status(200).json({
//       message: "Audiobook updated successfully",
//       audiobook,
//     });
//   } catch (error) {
//     console.error("Error in updateAudiobook:", error);
//     return next(error);
//   }
// });

// // get a single book by it's id
// const getAudiobookById = asyncHandler(async (req, res, next) => {
//   try {
//     console.log("Received request for audiobook ID:", req.params.id);

//     // Validate the ID format
//     if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
//       return res.status(400).json({ error: "Invalid audiobook ID format" });
//     }

//     // Convert ID to ObjectId
//     const audiobookId = new mongoose.Types.ObjectId(req.params.id);

//     // Find the audiobook by ID
//     const audiobook = await Audiobook.findById(audiobookId);
//     if (!audiobook) {
//       return res.status(404).json({ error: "Audiobook not found" });
//     }

//     console.log("Found audiobook:", audiobook);

//     // Ensure the author is authenticated
//     if (!req.author) {
//       return res.status(401).json({ error: "Unauthorized, author not found" });
//     }

//     console.log("Requesting author:", req.author);

//     // Check if the authorId matches (optional, depending on use case)
//     if (audiobook.authorId.toString() !== req.author._id.toString()) {
//       return res
//         .status(403)
//         .json({ error: "You are not authorized to view this audiobook" });
//     }

//     // Send the audiobook details in the response
//     res.status(200).json({
//       message: "Audiobook retrieved successfully",
//       audiobook,
//     });
//   } catch (error) {
//     console.error("Error in getAudiobookById:", error);
//     return next(error);
//   }
// });
// const getAudiobooksByAuthor = asyncHandler(async (req, res, next) => {
//   try {
//     console.log("Received request for audiobooks by author");
//     console.log(
//       "Current author ID ..........................................",
//       req.author._id
//     );

//     // Ensure the author is authenticated
//     if (!req.author) {
//       return res.status(401).json({ error: "Unauthorized, author not found" });
//     }

//     const authorId = req.author._id; // Get the author's ID directly from req.author

//     // Find all audiobooks where the authorId field matches the logged-in author's ID
//     const audiobooks = await Audiobook.find({ authorId: authorId });

//     if (!audiobooks || audiobooks.length === 0) {
//       return res
//         .status(404)
//         .json({ error: "No audiobooks found for this author" });
//     }

//     console.log("Found audiobooks:", audiobooks);

//     // Crucial Authorization Check: Verify that *all* audiobooks belong to this author.
//     for (const audiobook of audiobooks) {
//       // **Added Check: Handle missing or invalid authorId**
//       if (!audiobook.authorId) {
//         console.error("Audiobook missing authorId:", audiobook); // Log the problematic audiobook
//         return res.status(500).json({
//           // Or 400 Bad Request, depending on the situation
//           error:
//             "Internal Server Error: One or more audiobooks have a missing authorId.  Please contact support.",
//         });
//       }

//       if (audiobook.authorId.toString() !== authorId.toString()) {
//         return res.status(403).json({
//           error:
//             "Unauthorized: One or more audiobooks do not belong to this author.",
//         });
//       }
//     }

//     // Send the audiobooks in the response
//     res.status(200).json({
//       message: "Audiobooks retrieved successfully",
//       audiobooks,
//     });
//   } catch (error) {
//     console.error("Error in getAudiobooksByAuthor:", error);
//     return next(error);
//   }
// });
// // search books
// const searchAudiobooks = asyncHandler(async (req, res) => {
//   try {
//     // Get the search query from the request
//     const { q } = req.query;

//     // If no query is provided, return an error
//     if (!q || q.trim() === "") {
//       return res.status(400).json({
//         success: false,
//         message: "Search query is required",
//       });
//     }

//     // Create a search filter for title, description, and genre using regular expressions
//     const searchQuery = {
//       $or: [
//         { title: { $regex: q, $options: "i" } }, // case-insensitive search
//         { description: { $regex: q, $options: "i" } },
//         { genre: { $regex: q, $options: "i" } },
//         { author: { $regex: q, $options: "i" } },
//         { category: { $regex: q, $options: "i" } },
//       ],
//     };

//     // Query the database with the search filter
//     const audiobooks = await Audiobook.find(searchQuery);

//     if (!audiobooks.length) {
//       return res.status(404).json({
//         success: false,
//         message: "No audiobooks found matching your search",
//       });
//     }

//     // Return the matching audiobooks
//     res.status(200).json({
//       success: true,
//       data: audiobooks,
//     });
//   } catch (error) {
//     console.error("Error in searchAudiobooks:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// });

// // get audiobooks by category
// const getAudiobooksByCategory = asyncHandler(async (req, res) => {
//   try {
//     const { category } = req.params;

//     const audiobooks = await Audiobook.find({
//       $or: [{ category: category }, { genre: category }],
//     });

//     if (!audiobooks.length) {
//       return res.status(404).json({
//         success: false,
//         message: `No audiobooks found for category: ${category}`,
//       });
//     }

//     const formattedBooks = audiobooks.map((book) => ({
//       id: book._id,
//       title: book.title,
//       description: book.description,
//       category: book.category,
//       genre: book.genre,
//       url: `./images/${book.coverImage}`,
//     }));

//     res.status(200).json({
//       success: true,
//       data: formattedBooks,
//     });
//   } catch (error) {
//     console.error("Error in getAudiobooksByCategory:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// });

// // const addRating = async (req, res, next) => {
// //   const { audiobookId, rating, review, ratingSource, ratingDate } = req.body; // New fields
// //   console.log(req.body);
// //   console.log("req.user:", req.user);
// //   console.log("req.author:", req.author);
// //   const userId = req.user ? req.user._id : req.author ? req.author._id : null;
// //   if (!userId) {
// //     return res
// //       .status(401)
// //       .json({ message: "Not authorized, user or author required" });
// //   }

// //   // Here you can proceed to add the rating to the audiobook
// //   try {
// //     const audiobook = await Audiobook.findById(audiobookId);
// //     if (!audiobook) {
// //       return res.status(404).json({ message: "Audiobook not found" });
// //     }

// //     // Check if the user/author has already rated this audiobook
// //     const existingRating = audiobook.ratings.find(
// //       (rating) =>
// //         rating.userId && rating.userId.toString() === userId.toString()
// //     );
// //     if (existingRating) {
// //       return res
// //         .status(400)
// //         .json({ message: "You have already rated this audiobook" });
// //     }

// //     // Add the new rating to the array, including new fields
// //     audiobook.ratings.push({
// //       userId,
// //       rating,
// //       review,
// //       ratingSource, // New field
// //       ratingDate, // New field
// //     });

// //     // Call the method to update the average rating, total ratings, and total count
// //     await audiobook.calculateAverageRating();

// //     // Save the updated audiobook
// //     await audiobook.save();

// //     return res.status(200).json({ message: "Rating added successfully" });
// //   } catch (error) {
// //     console.error("Error adding rating:", error);
// //     return res.status(500).json({ message: "Internal server error" });
// //   }
// // };
// // audiobookController.js
// const addRating = async (req, res, next) => {
//   const { audiobookId, rating, review, ratingSource, ratingDate } = req.body;

//   let userId;
//   if (req.user) {
//     userId = req.user._id;
//   } else if (req.author) {
//     userId = req.author._id;
//   } else {
//     return res
//       .status(401)
//       .json({ message: "Not authorized, user or author required" });
//   }

//   try {
//     const audiobook = await Audiobook.findById(audiobookId);
//     if (!audiobook) {
//       return res.status(404).json({ message: "Audiobook not found" });
//     }

//     // Check if the user/author has already rated this audiobook
//     const existingRating = audiobook.ratings.find(
//       (rating) =>
//         rating.userId && rating.userId.toString() === userId.toString()
//     );
//     if (existingRating) {
//       return res
//         .status(400)
//         .json({ message: "You have already rated this audiobook" });
//     }

//     audiobook.ratings.push({
//       userId,
//       rating,
//       review,
//       ratingSource,
//       ratingDate,
//     });

//     await audiobook.calculateAverageRating();
//     await audiobook.save();

//     return res.status(200).json({ message: "Rating added successfully" });
//   } catch (error) {
//     console.error("Error adding rating:", error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };
// const removeRating = async (req, res, next) => {
//   const { audiobookId } = req.body;
//   const userId = req.user ? req.user._id : req.author ? req.author._id : null;

//   if (!userId) {
//     return res
//       .status(401)
//       .json({ message: "Not authorized, user or author required" });
//   }

//   try {
//     const audiobook = await Audiobook.findById(audiobookId);
//     if (!audiobook) {
//       return res.status(404).json({ message: "Audiobook not found" });
//     }

//     // Find the rating to remove
//     const ratingIndex = audiobook.ratings.findIndex(
//       (rating) =>
//         rating.userId && rating.userId.toString() === userId.toString() //  <--- ADDED CHECK
//     );
//     if (ratingIndex === -1) {
//       return res
//         .status(400)
//         .json({ message: "Rating not found for this audiobook" });
//     }

//     // Get the rating details (e.g., rating value) to update total ratings and total count
//     const ratingToRemove = audiobook.ratings[ratingIndex];
//     const removedRating = ratingToRemove.rating;

//     // Remove the rating from the array
//     audiobook.ratings.splice(ratingIndex, 1);

//     // Update total_ratings and total_count
//     audiobook.total_ratings -= removedRating;
//     audiobook.total_count -= 1;

//     // Recalculate average_rating (if total_count > 0, else set to 0)
//     audiobook.average_rating =
//       audiobook.total_count > 0
//         ? audiobook.total_ratings / audiobook.total_count
//         : 0;

//     // Save the updated audiobook
//     await audiobook.save();

//     return res.status(200).json({ message: "Rating removed successfully" });
//   } catch (error) {
//     console.error("Error removing rating:", error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };

// const editRating = async (req, res) => {
//   const { id } = req.params; // Capture the audiobookId from the route parameter
//   const { rating, review } = req.body; // Capture the rating and review from the body

//   console.log("Audiobook ID:", id); // Log the captured audiobookId
//   console.log("Rating:", rating); // Log the rating
//   console.log("Review:", review); // Log the review

//   try {
//     const audiobook = await Audiobook.findById(id); // Find the audiobook by ID
//     if (!audiobook) {
//       return res.status(404).json({ error: "Audiobook not found" });
//     }

//     // Add the new rating and review to the ratings array
//     audiobook.ratings.push({ rating, review });

//     // Recalculate the average rating
//     const totalRatings = audiobook.ratings.length;
//     const sumRatings = audiobook.ratings.reduce(
//       (acc, ratingObj) => acc + ratingObj.rating,
//       0
//     );
//     audiobook.average_rating = sumRatings / totalRatings;

//     // Update the total count of ratings
//     audiobook.total_ratings = totalRatings;

//     // Save the updated audiobook object
//     await audiobook.save();

//     res.status(200).json({
//       message: "Review updated successfully",
//       audiobook: {
//         _id: audiobook._id,
//         title: audiobook.title,
//         ratings: audiobook.ratings,
//         average_rating: audiobook.average_rating,
//         total_ratings: audiobook.total_ratings,
//       },
//     });
//   } catch (error) {
//     console.error(error);
//     res
//       .status(500)
//       .json({ error: "An error occurred while updating the review" });
//   }
// };

// export {
//   getAudiobooks,
//   uploadAudiobook,
//   deleteAudiobook,
//   updateAudiobook,
//   getAudiobookById,
//   getAudiobooksByAuthor,
//   searchAudiobooks,
//   getAudiobooksByCategory,
//   addRating,
//   removeRating,
//   editRating,
//   getAudiobookCoverImage,
//   getAudioFile,
// };
import { getGridFSBucket } from "./gridfs.js"; // ✅ Use the getter function
import asyncHandler from "express-async-handler";
import Audiobook from "../models/audiobookModel.js";
import Category from "../models/Category.js"; // Import your Category model

import Author from "../models/authorModel.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const db = mongoose.connection.db; // Use the default connection's db instance

const uploadAudiobook = asyncHandler(async (req, res, next) => {
  try {
    // Extract from request
    const { title, description, category } = req.body; // Access text fields

    // Validate the text inputs
    if (!title || !description || !category) {
      return res
        .status(400)
        .json({ error: "Please provide title, description, and category." });
    }

    // Access the files
    const audiobookFile = req.files["audiobook"][0];
    const imageFile = req.files["image"][0];

    if (!audiobookFile || !audiobookFile.originalname) {
      return res
        .status(400)
        .json({ error: "Audiobook file is missing or invalid." });
    }

    if (!imageFile || !imageFile.originalname) {
      return res
        .status(400)
        .json({ error: "Image file is missing or invalid." });
    }

    // Get GridFSBucket instance
    let gridfsBucket = getGridFSBucket();

    // let audioFileId;
    // Upload audiobook and image concurrently
    const uploadAudioPromise = new Promise((resolve, reject) => {
      const audioUploadStream = gridfsBucket.openUploadStream(
        audiobookFile.originalname,
        { contentType: audiobookFile.mimetype }
      );

      audioUploadStream.on("finish", async () => {
        // audioFileId = audioUploadStream.id;
        resolve();
      });
      audioUploadStream.on("error", reject);
      audioUploadStream.end(audiobookFile.buffer);
    });

    const uploadImagePromise = new Promise((resolve, reject) => {
      const imageUploadStream = gridfsBucket.openUploadStream(
        imageFile.originalname,
        { contentType: imageFile.mimetype }
      );
      imageUploadStream.on("finish", resolve);
      imageUploadStream.on("error", reject);
      imageUploadStream.end(imageFile.buffer);
    });

    await Promise.all([uploadAudioPromise, uploadImagePromise]);
    // console.log("Audiobook File Name:", audiobookFile.originalname);
    // Save metadata in the Audiobook collection
    const newAudiobook = new Audiobook({
      authorId: req.author.id,
      authorName: req.author.first_name,
      title: title, // Use the title from reqx.body
      coverImage: imageFile.originalname,
      audioFile: audiobookFile.originalname || "None", // Store the filename!
      uploadedAt: new Date(),
      description: description, // Use the description from req.body
      category: category, // Use the category from req.body
      genre: "Add genre here", // Optional
    });
    console.log("New Audiobook Object:", newAudiobook);
    await newAudiobook.save();

    res.status(201).json({
      message: "Files and metadata uploaded successfully",
      authorId: req.author._id,
    });
  } catch (error) {
    console.error(error);
    return next(error);
  }
});
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find(); // Fetch all categories from the Category model
    // console.log("Categories:", categories);
    res.status(200).json(categories); // Respond with the categories
  } catch (error) {
    console.error("Error fetching categories:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch categories", error: error.message });
  }
};
// const getAudiobooks = asyncHandler(async (req, res) => {
//   try {
//     // Extract the authorId from the request's query parameters
//     const authorId = req.query.authorId;

//     // Construct the base query to find audiobooks
//     let query = {};

//     // If authorId is provided, add it to the query to filter by author
//     if (authorId) {
//       query = { authorId: authorId };
//     }

//     const audiobooks = await Audiobook.find(query);
//     console.log("Raw audiobooks data:", audiobooks); // Add this line

//     if (!audiobooks.length) {
//       return res.status(404).json({
//         success: false,
//         message: "No audiobooks found",
//       });
//     }

//     const formattedBooks = await Promise.all(
//       // Use Promise.all to handle asynchronous operations in map
//       audiobooks.map(async (book) => {
//         console.log("Audiobook before formatting:", book); // Add this line
//         // Make the mapping function async
//         let base64Image = null;
//         let audioFileUrl = null;

//         try {
//           const bucket = getGridFSBucket();

//           // Fetch cover image
//           const coverImageFile = await bucket
//             .find({ filename: book.coverImage })
//             .toArray();

//           if (coverImageFile.length > 0) {
//             const downloadStream = bucket.openDownloadStreamByName(
//               book.coverImage
//             );
//             const chunks = [];
//             for await (const chunk of downloadStream) {
//               // Asynchronously iterate over stream chunks
//               chunks.push(chunk);
//             }
//             const buffer = Buffer.concat(chunks);
//             base64Image = buffer.toString("base64"); // Convert buffer to base64 string
//           }

//           // Fetch audio file URL
//           const audioFile = await bucket
//             .find({ filename: book.audioFile })
//             .toArray();

//           if (audioFile.length > 0) {
//             audioFileUrl = `/api/audiobooks/audio-file/${book.audioFile}`;
//           }
//         } catch (error) {
//           console.error(
//             "Error fetching cover image or audio file from GridFS:",
//             error
//           );
//           // Handle error appropriately, e.g., set base64Image and audioFileUrl to null or a default value
//         }

//         return {
//           id: book._id,
//           author: book.authorId,
//           coverImageData: base64Image, // New field to hold base64 image data
//           url: `/api/audiobooks/cover-image/${book.coverImage}`, // Keep the file serving URL for potential future use or fallback
//           audioFile: audioFileUrl, //audio file URL
//           title: book.title,
//           publisher: book.authorName || "Unknown",
//         };
//       })
//     );

//     res.status(200).json({
//       success: true,
//       data: formattedBooks,
//     });

//     // console.log(formattedBooks);
//   } catch (error) {
//     console.error("Error in getAudiobooks:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// });
const getAudiobooks = asyncHandler(async (req, res) => {
  try {
    // Extract the authorId from the request's query parameters
    const authorId = req.query.authorId;

    // Construct the base query to find audiobooks
    let query = {};

    // If authorId is provided, add it to the query to filter by author
    if (authorId) {
      query = { authorId: authorId };
    }

    const audiobooks = await Audiobook.find(query);
    console.log("Raw audiobooks data:", audiobooks);

    if (!audiobooks.length) {
      return res.status(404).json({
        success: false,
        message: "No audiobooks found",
      });
    }

    const formattedBooks = await Promise.all(
      audiobooks.map(async (book) => {
        console.log("Audiobook before formatting:", book);
        let base64Image = null;
        let base64Audio = null; // Change variable name to base64Audio

        try {
          const bucket = getGridFSBucket();

          // Fetch cover image and convert to base64
          const coverImageFile = await bucket
            .find({ filename: book.coverImage })
            .toArray();

          if (coverImageFile.length > 0) {
            const downloadStream = bucket.openDownloadStreamByName(
              book.coverImage
            );
            const chunks = [];
            for await (const chunk of downloadStream) {
              chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);
            base64Image = buffer.toString("base64");
          }

          // Fetch audio file and convert to base64
          const audioFile = await bucket
            .find({ filename: book.audioFile })
            .toArray();

          if (audioFile.length > 0) {
            const downloadStream = bucket.openDownloadStreamByName(
              book.audioFile
            );
            const chunks = [];
            for await (const chunk of downloadStream) {
              chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);
            base64Audio = buffer.toString("base64"); // Assign to base64Audio
          }
        } catch (error) {
          console.error(
            "Error fetching cover image or audio file from GridFS:",
            error
          );
          // Handle error appropriately
        }

        return {
          id: book._id,
          author: book.authorId,
          coverImageData: base64Image,
          audioBase64Data: base64Audio, // Use base64Audio here
          title: book.title,
          authorName: book.authorName || "Unknown", // Added authorName to response
          rating: book.average_rating,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: formattedBooks,
    });

    // console.log(formattedBooks);
  } catch (error) {
    console.error("Error in getAudiobooks:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// const getAudioFile = asyncHandler(async (req, res) => {
//   try {
//     const filename = req.params.filename; // Get filename from the URL
//     const gridfsBucket = getGridFSBucket(); // Get GridFSBucket instance
//     console.log("filename", filename);
//     const downloadStream = gridfsBucket.openDownloadStreamByName(filename); //Open download stream

//     // **Add this line to set the Content-Type header**
//     res.setHeader("Content-Type", "audio/mpeg"); // Set the correct MIME type for audio

//     downloadStream.on("data", (chunk) => {
//       res.write(chunk); // Stream the data to the response
//     });

//     downloadStream.on("error", (error) => {
//       console.error("GridFS stream error:", error);
//       res.status(404).send("Audio not found"); // Handle file not found
//     });

//     downloadStream.on("end", () => {
//       res.end(); // End the response
//     });
//   } catch (error) {
//     console.error("Error in getAudioFile:", error);
//     res.status(500).send("Server error"); // Handle server errors
//   }
// });
const getAudioFile = asyncHandler(async (req, res) => {
  try {
    const filename = req.params.filename;
    const gridfsBucket = getGridFSBucket();
    console.log("filename", filename);
    const downloadStream = gridfsBucket.openDownloadStreamByName(filename);

    const chunks = []; // Array to store chunks of audio data
    downloadStream.on("data", (chunk) => {
      chunks.push(chunk); // Collect chunks
    });

    downloadStream.on("error", (error) => {
      console.error("GridFS stream error:", error);
      res.status(404).json({ message: "Audio not found" }); // Send JSON error
    });

    downloadStream.on("end", () => {
      const buffer = Buffer.concat(chunks); // Concatenate all chunks into a Buffer
      const base64Audio = buffer.toString("base64"); // Convert Buffer to base64 string

      // Send base64 encoded audio in a JSON response
      res.status(200).json({
        success: true,
        audioBase64: base64Audio,
        contentType: "audio/mpeg", // Or determine dynamically as before
      });
    });
  } catch (error) {
    console.error("Error in getAudioFile:", error);
    res.status(500).json({ message: "Server error" }); // Send JSON error
  }
});
// New controller function to serve cover images from GridFS
const getAudiobookCoverImage = asyncHandler(async (req, res) => {
  try {
    const filename = req.params.filename;
    const bucket = getGridFSBucket(); // ✅ Get GridFSBucket instance

    const downloadStream = bucket.openDownloadStreamByName(filename);

    downloadStream.on("data", (chunk) => {
      res.write(chunk); // Stream chunks to response
    });

    downloadStream.on("error", (error) => {
      if (error.code === "ENOENT") {
        return res.status(404).send("Image not found"); // Handle file not found
      }
      console.error("GridFS download stream error:", error);
      res.status(500).send("Error retrieving image"); // Handle other errors
    });

    downloadStream.on("end", () => {
      res.end(); // End the response when stream ends
    });
  } catch (error) {
    console.error("Error in getAudiobookCoverImage:", error);
    res.status(500).send("Server error"); // Handle server errors
  }
});

// delete a book
const deleteAudiobook = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params; // Ensure the ID comes from req.params

    // Check if the audiobook exists
    const audiobook = await Audiobook.findById(id);
    if (!audiobook) {
      return res.status(404).json({ error: "Audiobook not found" });
    }

    console.log("Audiobook title:", audiobook.title); // Log the audiobook title

    // Check if the authenticated author matches the audiobook's author
    const token = req.headers.authorization.split(" ")[1]; // Assuming JWT token is passed
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    if (audiobook.authorId.toString() !== decodedToken.authorId) {
      return res
        .status(403)
        .json({ error: "You are not authorized to delete this audiobook" });
    }

    // Get GridFSBucket instance safely
    let gridfsBucket;
    try {
      gridfsBucket = getGridFSBucket();
    } catch (error) {
      return res.status(500).json({ error: "GridFSBucket is not initialized" });
    }

    // Delete files from GridFS first
    try {
      // Delete cover image
      const coverImageFile = await gridfsBucket
        .find({ filename: audiobook.coverImage })
        .toArray();

      if (coverImageFile.length > 0) {
        await gridfsBucket.delete(coverImageFile[0]._id);
        console.log("Cover image file deleted from GridFS");
      }

      // Delete audio file
      const audioFile = await gridfsBucket
        .find({ filename: audiobook.audioFile })
        .toArray();

      if (audioFile.length > 0) {
        await gridfsBucket.delete(audioFile[0]._id);
        console.log("Audio file deleted from GridFS");
      }
    } catch (gridFsError) {
      console.error("Error deleting files from GridFS:", gridFsError);
      // Consider if you want to stop the deletion process here, or continue deleting the metadata
    }

    // Delete audiobook metadata from MongoDB
    await Audiobook.findByIdAndDelete(id);

    res.status(200).json({ message: "Audiobook deleted successfully" });
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

//update a book details
// const updateAudiobook = asyncHandler(async (req, res, next) => {
//   try {
//     console.log("Received audiobook ID for update:", req.params.id);

//     // Validate ID format
//     if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
//       return res.status(400).json({ error: "Invalid audiobook ID format" });
//     }

//     // Convert ID to ObjectId
//     const audiobookId = new mongoose.Types.ObjectId(req.params.id);

//     // Find the audiobook by ID
//     let audiobook = await Audiobook.findById(audiobookId);
//     if (!audiobook) {
//       return res.status(404).json({ error: "Audiobook not found" });
//     }

//     console.log("Found audiobook for update:", audiobook);

//     // Ensure the author is authenticated
//     if (!req.author) {
//       return res.status(401).json({ error: "Unauthorized, author not found" });
//     }

//     // Check if the authorId matches
//     if (audiobook.authorId.toString() !== req.author._id.toString()) {
//       return res
//         .status(403)
//         .json({ error: "You are not authorized to update this audiobook" });
//     }

//     // Prepare updated data
//     const updateData = {};
//     if (req.body.title) updateData.title = req.body.title;
//     if (req.body.description) updateData.description = req.body.description;
//     if (req.body.category) updateData.category = req.body.category;
//     if (req.body.genre) updateData.genre = req.body.genre;

//     let gridfsBucket = getGridFSBucket();

//     // Handle file uploads if provided
//     if (req.files) {
//       if (req.files["image"]) {
//         const imageFile = req.files["image"][0];

//         // Delete old cover image from GridFS
//         try {
//           const oldImageFile = await gridfsBucket
//             .find({ filename: audiobook.coverImage })
//             .toArray();
//           if (oldImageFile.length > 0) {
//             await gridfsBucket.delete(oldImageFile[0]._id);
//             console.log("Deleted old cover image:", audiobook.coverImage);
//           }
//         } catch (gridFsError) {
//           console.error(
//             "Error deleting old cover image from GridFS:",
//             gridFsError
//           );
//         }

//         // Upload new cover image
//         const imageUploadStream = gridfsBucket.openUploadStream(
//           imageFile.originalname,
//           {
//             contentType: imageFile.mimetype,
//           }
//         );
//         imageUploadStream.end(imageFile.buffer);
//         await new Promise((resolve, reject) => {
//           imageUploadStream.on("finish", resolve);
//           imageUploadStream.on("error", reject);
//         });

//         updateData.coverImage = imageFile.originalname;
//       }

//       if (req.files["audiobook"]) {
//         const audiobookFile = req.files["audiobook"][0];

//         // Delete old audiobook file from GridFS
//         try {
//           const oldAudioFile = await gridfsBucket
//             .find({ filename: audiobook.audioFile })
//             .toArray();
//           if (oldAudioFile.length > 0) {
//             await gridfsBucket.delete(oldAudioFile[0]._id);
//             console.log("Deleted old audiobook file:", audiobook.audioFile);
//           }
//         } catch (gridFsError) {
//           console.error(
//             "Error deleting old audiobook file from GridFS:",
//             gridFsError
//           );
//         }

//         // Upload new audiobook file
//         const audioUploadStream = gridfsBucket.openUploadStream(
//           audiobookFile.originalname,
//           {
//             contentType: audiobookFile.mimetype,
//           }
//         );
//         audioUploadStream.end(audiobookFile.buffer);
//         await new Promise((resolve, reject) => {
//           audioUploadStream.on("finish", resolve);
//           audioUploadStream.on("error", reject);
//         });

//         updateData.audioFile = audiobookFile.originalname;
//       }
//     }

//     // Update audiobook in database
//     audiobook = await Audiobook.findByIdAndUpdate(audiobookId, updateData, {
//       new: true,
//     });
//     console.log("Updated audiobook:", audiobook);

//     res.status(200).json({
//       message: "Audiobook updated successfully",
//       audiobook,
//     });
//   } catch (error) {
//     console.error("Error in updateAudiobook:", error);
//     return next(error);
//   }
// });
const updateAudiobook = asyncHandler(async (req, res, next) => {
  try {
    console.log("Received audiobook ID for update:", req.params.id);

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid audiobook ID format" });
    }

    // Convert ID to ObjectId
    const audiobookId = new mongoose.Types.ObjectId(req.params.id);

    // Find the audiobook by ID
    let audiobook = await Audiobook.findById(audiobookId);
    if (!audiobook) {
      return res.status(404).json({ error: "Audiobook not found" });
    }

    console.log("Found audiobook for update:", audiobook);

    // Ensure the author is authenticated
    if (!req.author) {
      return res.status(401).json({ error: "Unauthorized, author not found" });
    }

    // Check if the authorId matches
    if (audiobook.authorId.toString() !== req.author._id.toString()) {
      return res
        .status(403)
        .json({ error: "You are not authorized to update this audiobook" });
    }

    // Prepare updated data
    const updateData = {};
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.description !== undefined)
      updateData.description = req.body.description;
    if (req.body.category !== undefined)
      updateData.category = req.body.category;
    if (req.body.genre !== undefined) updateData.genre = req.body.genre;

    let gridfsBucket = getGridFSBucket();

    // Handle file uploads if provided
    if (req.files) {
      if (req.files["image"]) {
        const imageFile = req.files["image"][0];

        // Delete old cover image from GridFS
        try {
          const oldImageFile = await gridfsBucket
            .find({ filename: audiobook.coverImage })
            .toArray();
          if (oldImageFile.length > 0) {
            await gridfsBucket.delete(oldImageFile[0]._id);
            console.log("Deleted old cover image:", audiobook.coverImage);
          }
        } catch (gridFsError) {
          console.error(
            "Error deleting old cover image from GridFS:",
            gridFsError
          );
        }

        // Upload new cover image
        const imageUploadStream = gridfsBucket.openUploadStream(
          imageFile.originalname,
          {
            contentType: imageFile.mimetype,
          }
        );
        imageUploadStream.end(imageFile.buffer);
        await new Promise((resolve, reject) => {
          imageUploadStream.on("finish", resolve);
          imageUploadStream.on("error", reject);
        });

        updateData.coverImage = imageFile.originalname;
      }

      if (req.files["audiobook"]) {
        const audiobookFile = req.files["audiobook"][0];

        // Delete old audiobook file from GridFS
        try {
          const oldAudioFile = await gridfsBucket
            .find({ filename: audiobook.audioFile })
            .toArray();
          if (oldAudioFile.length > 0) {
            await gridfsBucket.delete(oldAudioFile[0]._id);
            console.log("Deleted old audiobook file:", audiobook.audioFile);
          }
        } catch (gridFsError) {
          console.error(
            "Error deleting old audiobook file from GridFS:",
            gridFsError
          );
        }

        // Upload new audiobook file
        const audioUploadStream = gridfsBucket.openUploadStream(
          audiobookFile.originalname,
          {
            contentType: audiobookFile.mimetype,
          }
        );
        audioUploadStream.end(audiobookFile.buffer);
        await new Promise((resolve, reject) => {
          audioUploadStream.on("finish", resolve);
          audioUploadStream.on("error", reject);
        });

        updateData.audioFile = audiobookFile.originalname;
      }
    }

    // Update audiobook in database
    audiobook = await Audiobook.findByIdAndUpdate(audiobookId, updateData, {
      new: true,
    });
    console.log("Updated audiobook:", audiobook);

    res.status(200).json({
      message: "Audiobook updated successfully",
      audiobook,
    });
  } catch (error) {
    console.error("Error in updateAudiobook:", error);
    return next(error);
  }
});

// get a single book by it's id
const getAudiobookById = asyncHandler(async (req, res, next) => {
  try {
    console.log("Received request for audiobook ID:", req.params.id);

    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid audiobook ID format" });
    }

    // Convert ID to ObjectId
    const audiobookId = new mongoose.Types.ObjectId(req.params.id);

    // Find the audiobook by ID
    const audiobook = await Audiobook.findById(audiobookId);
    if (!audiobook) {
      return res.status(404).json({ error: "Audiobook not found" });
    }

    console.log("Found audiobook:", audiobook);

    // Ensure the author is authenticated
    if (!req.author) {
      return res.status(401).json({ error: "Unauthorized, author not found" });
    }

    console.log("Requesting author:", req.author);

    // Check if the authorId matches (optional, depending on use case)
    if (audiobook.authorId.toString() !== req.author._id.toString()) {
      return res
        .status(403)
        .json({ error: "You are not authorized to view this audiobook" });
    }

    // Send the audiobook details in the response
    res.status(200).json({
      message: "Audiobook retrieved successfully",
      audiobook,
    });
  } catch (error) {
    console.error("Error in getAudiobookById:", error);
    return next(error);
  }
});
const getAudiobooksByAuthor = asyncHandler(async (req, res, next) => {
  try {
    console.log("Received request for audiobooks by author");
    console.log(
      "Current author ID ..........................................",
      req.author._id
    );

    // Ensure the author is authenticated
    if (!req.author) {
      return res.status(401).json({ error: "Unauthorized, author not found" });
    }

    const authorId = req.author._id; // Get the author's ID directly from req.author

    // Find all audiobooks where the authorId field matches the logged-in author's ID
    const audiobooks = await Audiobook.find({ authorId: authorId });

    if (!audiobooks || audiobooks.length === 0) {
      return res
        .status(404)
        .json({ error: "No audiobooks found for this author" });
    }

    console.log("Found audiobooks:", audiobooks);

    // Crucial Authorization Check: Verify that *all* audiobooks belong to this author.
    for (const audiobook of audiobooks) {
      // **Added Check: Handle missing or invalid authorId**
      if (!audiobook.authorId) {
        console.error("Audiobook missing authorId:", audiobook); // Log the problematic audiobook
        return res.status(500).json({
          // Or 400 Bad Request, depending on the situation
          error:
            "Internal Server Error: One or more audiobooks have a missing authorId.  Please contact support.",
        });
      }

      if (audiobook.authorId.toString() !== authorId.toString()) {
        return res.status(403).json({
          error:
            "Unauthorized: One or more audiobooks do not belong to this author.",
        });
      }
    }

    // Send the audiobooks in the response
    res.status(200).json({
      message: "Audiobooks retrieved successfully",
      audiobooks,
    });
  } catch (error) {
    console.error("Error in getAudiobooksByAuthor:", error);
    return next(error);
  }
});
// search books
const searchAudiobooks = asyncHandler(async (req, res) => {
  try {
    // Get the search query from the request
    const { q } = req.query;

    // If no query is provided, return an error
    if (!q || q.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    // Create a search filter for title, description, and genre using regular expressions
    const searchQuery = {
      $or: [
        { title: { $regex: q, $options: "i" } }, // case-insensitive search
        { description: { $regex: q, $options: "i" } },
        { genre: { $regex: q, $options: "i" } },
        { author: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
      ],
    };

    // Query the database with the search filter
    const audiobooks = await Audiobook.find(searchQuery);

    if (!audiobooks.length) {
      return res.status(404).json({
        success: false,
        message: "No audiobooks found matching your search",
      });
    }

    // Return the matching audiobooks
    res.status(200).json({
      success: true,
      data: audiobooks,
    });
  } catch (error) {
    console.error("Error in searchAudiobooks:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// get audiobooks by category
// const getAudiobooksByCategory = asyncHandler(async (req, res) => {
//   try {
//     const { category } = req.params;
//     // Correct: Decode

//     const audiobooks = await Audiobook.find({
//       $or: [{ category: category }, { genre: category }],
//     });
//     console.log(audiobooks);

//     if (!audiobooks.length) {
//       return res.status(404).json({
//         success: false,
//         message: `No audiobooks found for category: ${category}`,
//       });
//     }

//     const formattedBooks = audiobooks.map((book) => ({
//       id: book._id,
//       title: book.title,
//       description: book.description,
//       category: book.category,
//       genre: book.genre,
//       url: `./images/${book.coverImage}`,
//     }));
//     console.log(formattedBooks);

//     res.status(200).json({
//       success: true,
//       data: formattedBooks,
//     });
//   } catch (error) {
//     console.error("Error in getAudiobooksByCategory:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// });
const getAudiobooksByCategory = asyncHandler(async (req, res) => {
  try {
    const { category } = req.params;
    const decodedCategory = decodeURIComponent(category); // Correct: Decode the URL before usage

    const audiobooks = await Audiobook.find({
      $or: [{ category: decodedCategory }, { genre: decodedCategory }],
    });

    if (!audiobooks.length) {
      return res.status(404).json({
        success: false,
        message: `No audiobooks found for category: ${decodedCategory}`,
      });
    }
    const formattedBooks = await Promise.all(
      audiobooks.map(async (book) => {
        console.log("Audiobook before formatting:", book);
        let base64Image = null;
        let base64Audio = null; // Change variable name to base64Audio

        try {
          const bucket = getGridFSBucket();

          // Fetch cover image and convert to base64
          const coverImageFile = await bucket
            .find({ filename: book.coverImage })
            .toArray();

          if (coverImageFile.length > 0) {
            const downloadStream = bucket.openDownloadStreamByName(
              book.coverImage
            );
            const chunks = [];
            for await (const chunk of downloadStream) {
              chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);
            base64Image = buffer.toString("base64");
          }

          // Fetch audio file and convert to base64
          const audioFile = await bucket
            .find({ filename: book.audioFile })
            .toArray();

          if (audioFile.length > 0) {
            const downloadStream = bucket.openDownloadStreamByName(
              book.audioFile
            );
            const chunks = [];
            for await (const chunk of downloadStream) {
              chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);
            base64Audio = buffer.toString("base64"); // Assign to base64Audio
          }
        } catch (error) {
          console.error(
            "Error fetching cover image or audio file from GridFS:",
            error
          );
          // Handle error appropriately
        }

        return {
          id: book._id,
          author: book.authorId,
          coverImageData: base64Image,
          audioBase64Data: base64Audio, // Use base64Audio here
          title: book.title,
          authorName: book.authorName || "Unknown", // Added authorName to response
          rating: book.average_rating,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: formattedBooks,
    });
  } catch (error) {
    console.error("Error in getAudiobooksByCategory:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});
// audiobookController.js
const addRating = async (req, res, next) => {
  const { audiobookId, rating, review, ratingSource, ratingDate } = req.body;

  let userId;
  if (req.user) {
    userId = req.user._id;
  } else if (req.author) {
    userId = req.author._id;
  } else {
    return res
      .status(401)
      .json({ message: "Not authorized, user or author required" });
  }

  try {
    const audiobook = await Audiobook.findById(audiobookId);
    if (!audiobook) {
      return res.status(404).json({ message: "Audiobook not found" });
    }

    // Check if the user/author has already rated this audiobook
    const existingRating = audiobook.ratings.find(
      (rating) =>
        rating.userId && rating.userId.toString() === userId.toString()
    );
    if (existingRating) {
      return res
        .status(400)
        .json({ message: "You have already rated this audiobook" });
    }

    audiobook.ratings.push({
      userId,
      rating,
      review,
      ratingSource,
      ratingDate,
    });

    await audiobook.calculateAverageRating();
    await audiobook.save();

    return res.status(200).json({ message: "Rating added successfully" });
  } catch (error) {
    console.error("Error adding rating:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const removeRating = async (req, res, next) => {
  const { audiobookId } = req.body;
  const userId = req.user ? req.user._id : req.author ? req.author._id : null;

  if (!userId) {
    return res
      .status(401)
      .json({ message: "Not authorized, user or author required" });
  }

  try {
    const audiobook = await Audiobook.findById(audiobookId);
    if (!audiobook) {
      return res.status(404).json({ message: "Audiobook not found" });
    }

    // Find the rating to remove
    const ratingIndex = audiobook.ratings.findIndex(
      (rating) =>
        rating.userId && rating.userId.toString() === userId.toString() //  <--- ADDED CHECK
    );
    if (ratingIndex === -1) {
      return res
        .status(400)
        .json({ message: "Rating not found for this audiobook" });
    }

    // Get the rating details (e.g., rating value) to update total ratings and total count
    const ratingToRemove = audiobook.ratings[ratingIndex];
    const removedRating = ratingToRemove.rating;

    // Remove the rating from the array
    audiobook.ratings.splice(ratingIndex, 1);

    // Update total_ratings and total_count
    audiobook.total_ratings -= removedRating;
    audiobook.total_count -= 1;

    // Recalculate average_rating (if total_count > 0, else set to 0)
    audiobook.average_rating =
      audiobook.total_count > 0
        ? audiobook.total_ratings / audiobook.total_count
        : 0;

    // Save the updated audiobook
    await audiobook.save();

    return res.status(200).json({ message: "Rating removed successfully" });
  } catch (error) {
    console.error("Error removing rating:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const editRating = async (req, res) => {
  const { id } = req.params; // Capture the audiobookId from the route parameter
  const { rating, review } = req.body; // Capture the rating and review from the body

  console.log("Audiobook ID:", id); // Log the captured audiobookId
  console.log("Rating:", rating); // Log the rating
  console.log("Review:", review); // Log the review

  try {
    const audiobook = await Audiobook.findById(id); // Find the audiobook by ID
    if (!audiobook) {
      return res.status(404).json({ error: "Audiobook not found" });
    }

    // Add the new rating and review to the ratings array
    audiobook.ratings.push({ rating, review });

    // Recalculate the average rating
    const totalRatings = audiobook.ratings.length;
    const sumRatings = audiobook.ratings.reduce(
      (acc, ratingObj) => acc + ratingObj.rating,
      0
    );
    audiobook.average_rating = sumRatings / totalRatings;

    // Update the total count of ratings
    audiobook.total_ratings = totalRatings;

    // Save the updated audiobook object
    await audiobook.save();

    res.status(200).json({
      message: "Review updated successfully",
      audiobook: {
        _id: audiobook._id,
        title: audiobook.title,
        ratings: audiobook.ratings,
        average_rating: audiobook.average_rating,
        total_ratings: audiobook.total_ratings,
      },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while updating the review" });
  }
};

export {
  getAudiobooks,
  getCategories,
  uploadAudiobook,
  deleteAudiobook,
  updateAudiobook,
  getAudiobookById,
  getAudiobooksByAuthor,
  searchAudiobooks,
  getAudiobooksByCategory,
  addRating,
  removeRating,
  editRating,
  getAudiobookCoverImage,
  getAudioFile,
};
