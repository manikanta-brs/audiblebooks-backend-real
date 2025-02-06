import { getGridFSBucket } from "./gridfs.js"; // ✅ Use the getter function
import asyncHandler from "express-async-handler";
import Audiobook from "../models/audiobookModel.js";
import Author from "../models/authorModel.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const db = mongoose.connection.db; // Use the default connection's db instance

// upload book
const uploadAudiobook = asyncHandler(async (req, res, next) => {
  try {
    // Extract token from headers
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token is required" });
    }

    const token = authorizationHeader.split(" ")[1];
    let decodedToken;

    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ error: "Not authorized, invalid token" });
    }

    // Check if author exists
    const author = await Author.findById(decodedToken.authorId).select(
      "-password"
    );
    if (!author) {
      return res.status(404).json({ error: "Author not found" });
    }

    req.author = author;

    // Ensure audiobook and image are provided
    if (!req.files || !req.files["audiobook"] || !req.files["image"]) {
      return res
        .status(400)
        .json({ error: "Please upload both audiobook and image files" });
    }

    const audiobookFile = req.files["audiobook"][0];
    const imageFile = req.files["image"][0];

    // Get GridFSBucket instance safely
    let gridfsBucket;
    try {
      gridfsBucket = getGridFSBucket();
    } catch (error) {
      return res.status(500).json({ error: "GridFSBucket is not initialized" });
    }

    // Check if audiobook already exists
    const existingFile = await gridfsBucket
      .find({ filename: audiobookFile.originalname })
      .toArray();
    if (existingFile.length > 0) {
      return res.status(409).json({ error: "Audiobook already exists" });
    }

    // Upload audiobook and image concurrently
    const uploadAudioPromise = new Promise((resolve, reject) => {
      const audioUploadStream = gridfsBucket.openUploadStream(
        audiobookFile.originalname,
        {
          contentType: audiobookFile.mimetype,
        }
      );

      audioUploadStream.on("finish", () => resolve(audioUploadStream.id));
      audioUploadStream.on("error", reject);
      audioUploadStream.end(audiobookFile.buffer);
    });

    const uploadImagePromise = new Promise((resolve, reject) => {
      const imageUploadStream = gridfsBucket.openUploadStream(
        imageFile.originalname,
        {
          contentType: imageFile.mimetype,
        }
      );

      imageUploadStream.on("finish", resolve);
      imageUploadStream.on("error", reject);
      imageUploadStream.end(imageFile.buffer);
    });

    await Promise.all([uploadAudioPromise, uploadImagePromise]);

    // Save metadata in the Audiobook collection
    const newAudiobook = new Audiobook({
      authorId: req.author.id,
      authorName: req.author.first_name,
      title: audiobookFile.originalname,
      coverImage: imageFile.originalname,
      uploadedAt: new Date(),
      description: "Add description here", // Optional
      category: "Add category here", // Required
      genre: "Add genre here", // Optional
    });

    await newAudiobook.save();

    res.status(201).json({
      message: "Files uploaded successfully",
      authorId: req.author._id,
    });
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

// get all books
// const getAudiobooks = asyncHandler(async (req, res) => {
//   try {
//     // Extract token from headers
//     let token;
//     const authorizationHeader = req.headers.authorization;

//     if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
//       return res.status(401).json({ error: "Token is required" });
//     }

//     token = authorizationHeader.split(" ")[1];

//     try {
//       const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

//       // Check if the author exists
//       const author = await Author.findById(decodedToken.authorId).select(
//         "-password"
//       );
//       if (!author) {
//         return res.status(404).json({ error: "Author not found" });
//       }

//       req.author = author;
//     } catch (error) {
//       return res.status(401).json({ error: "Not authorized, invalid token" });
//     }

//     console.log(req.author.first_name); // Logging author name for debugging

//     const audiobooks = await Audiobook.find();

//     if (!audiobooks.length) {
//       return res.status(404).json({
//         success: false,
//         message: "No audiobooks found",
//       });
//     }

//     const formattedBooks = audiobooks.map((book) => ({
//       id: book._id,
//       author: book.authorId,
//       url: `./images/${book.coverImage}`, // Adjusted to use the actual uploaded image
//       name: book.title,
//       publisher: book.authorName || "Unknown", // Using authorName stored during upload
//     }));

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
// get all books
const getAudiobooks = asyncHandler(async (req, res) => {
  try {
    // Extract token from headers
    let token;
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token is required" });
    }

    token = authorizationHeader.split(" ")[1];

    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

      // Check if the author exists
      const author = await Author.findById(decodedToken.authorId).select(
        "-password"
      );
      if (!author) {
        return res.status(404).json({ error: "Author not found" });
      }

      req.author = author;
    } catch (error) {
      return res.status(401).json({ error: "Not authorized, invalid token" });
    }

    console.log(req.author.first_name); // Logging author name for debugging

    const audiobooks = await Audiobook.find();

    if (!audiobooks.length) {
      return res.status(404).json({
        success: false,
        message: "No audiobooks found",
      });
    }

    const formattedBooks = await Promise.all(
      // Use Promise.all to handle asynchronous operations in map
      audiobooks.map(async (book) => {
        // Make the mapping function async
        let base64Image = null;
        try {
          const bucket = getGridFSBucket();
          const coverImageFile = await bucket
            .find({ filename: book.coverImage })
            .toArray();

          if (coverImageFile.length > 0) {
            const downloadStream = bucket.openDownloadStreamByName(
              book.coverImage
            );
            const chunks = [];
            for await (const chunk of downloadStream) {
              // Asynchronously iterate over stream chunks
              chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);
            base64Image = buffer.toString("base64"); // Convert buffer to base64 string
          }
        } catch (error) {
          console.error("Error fetching cover image from GridFS:", error);
          // Handle error appropriately, e.g., set base64Image to null or a default image
        }

        return {
          id: book._id,
          author: book.authorId,
          coverImageData: base64Image, // New field to hold base64 image data
          url: `/api/audiobooks/cover-image/${book.coverImage}`, // Keep the file serving URL for potential future use or fallback
          name: book.title,
          publisher: book.authorName || "Unknown",
        };
      })
    );

    res.status(200).json({
      success: true,
      data: formattedBooks,
    });

    console.log(formattedBooks);
  } catch (error) {
    console.error("Error in getAudiobooks:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
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

    // Check for the file in GridFS using the actual filename
    const audiobookFile = await gridfsBucket
      .find({ filename: "file_example_MP3_700KB.mp3" }) // Use the actual filename here
      .toArray();

    console.log("Audiobook file found:", audiobookFile);

    if (audiobookFile.length > 0) {
      // Delete audiobook file from GridFS
      await gridfsBucket.delete(audiobookFile[0]._id);
      console.log("Audiobook file deleted from GridFS");
    } else {
      console.log("Audiobook file not found in GridFS");
    }

    // Check for the cover image in GridFS
    const coverImageFile = await gridfsBucket
      .find({ filename: audiobook.coverImage })
      .toArray();

    if (coverImageFile.length > 0) {
      await gridfsBucket.delete(coverImageFile[0]._id);
      console.log("Cover image file deleted from GridFS");
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
    if (req.body.title) updateData.title = req.body.title;
    if (req.body.description) updateData.description = req.body.description;
    if (req.body.category) updateData.category = req.body.category;
    if (req.body.genre) updateData.genre = req.body.genre;

    // Handle file uploads if provided
    if (req.files) {
      if (req.files["image"]) {
        const imageFile = req.files["image"][0];

        // Delete old cover image from GridFS
        const oldImageFile = await gridfsBucket
          .find({ filename: audiobook.coverImage })
          .toArray();
        if (oldImageFile.length > 0) {
          await gridfsBucket.delete(oldImageFile[0]._id);
          console.log("Deleted old cover image:", audiobook.coverImage);
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
        const oldAudioFile = await gridfsBucket
          .find({ filename: audiobook.title })
          .toArray();
        if (oldAudioFile.length > 0) {
          await gridfsBucket.delete(oldAudioFile[0]._id);
          console.log("Deleted old audiobook file:", audiobook.title);
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

        updateData.title = audiobookFile.originalname;
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
const getAudiobooksByCategory = asyncHandler(async (req, res) => {
  try {
    const { category } = req.params;

    const audiobooks = await Audiobook.find({
      $or: [{ category: category }, { genre: category }],
    });

    if (!audiobooks.length) {
      return res.status(404).json({
        success: false,
        message: `No audiobooks found for category: ${category}`,
      });
    }

    const formattedBooks = audiobooks.map((book) => ({
      id: book._id,
      title: book.title,
      description: book.description,
      category: book.category,
      genre: book.genre,
      url: `./images/${book.coverImage}`,
    }));

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

const addRating = async (req, res, next) => {
  const { audiobookId, rating, review, ratingSource, ratingDate } = req.body; // New fields
  console.log(req.body);
  console.log(req.user); // Check for user
  console.log(req.author); // Check for author

  // Check if the user is logged in as a user or author
  const userId = req.user ? req.user._id : req.author ? req.author._id : null;

  if (!userId) {
    return res
      .status(401)
      .json({ message: "Not authorized, user or author required" });
  }

  // Here you can proceed to add the rating to the audiobook
  try {
    const audiobook = await Audiobook.findById(audiobookId);
    if (!audiobook) {
      return res.status(404).json({ message: "Audiobook not found" });
    }

    // Check if the user/author has already rated this audiobook
    const existingRating = audiobook.ratings.find(
      (rating) => rating.userId.toString() === userId.toString()
    );
    if (existingRating) {
      return res
        .status(400)
        .json({ message: "You have already rated this audiobook" });
    }

    // Add the new rating to the array, including new fields
    audiobook.ratings.push({
      userId,
      rating,
      review,
      ratingSource, // New field
      ratingDate, // New field
    });

    // Call the method to update the average rating, total ratings, and total count
    await audiobook.calculateAverageRating();

    // Save the updated audiobook
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
      (rating) => rating.userId.toString() === userId.toString()
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
  uploadAudiobook,
  deleteAudiobook,
  updateAudiobook,
  getAudiobookById,
  searchAudiobooks,
  getAudiobooksByCategory,
  addRating,
  removeRating,
  editRating,
  getAudiobookCoverImage, // ✅ Export the new controller function
};
