// import mongoose from "mongoose";
// import multer from "multer";
// import { GridFSBucket } from "mongodb";

// // MongoDB Connection
// const conn = mongoose.connection;

// // Initialize GridFSBucket
// let gridfsBucket;

// conn.once("open", () => {
//   gridfsBucket = new GridFSBucket(conn.db, { bucketName: "uploads" });
// });

// // Set up Multer Storage for file uploads
// const storage = multer.memoryStorage(); // Store files in memory first
// const upload = multer({ storage });

// export { gridfsBucket, upload };
import mongoose from "mongoose";
import multer from "multer";
import { GridFSBucket } from "mongodb";

// MongoDB Connection
const conn = mongoose.connection;

let gridfsBucket;

// Wait for the connection to open and initialize GridFSBucket
conn.once("open", () => {
  gridfsBucket = new GridFSBucket(conn.db, {
    bucketName: "uploads",
    chunkSizeBytes: 1048576, // Set chunk size to 1MB
  });
  console.log("✅ GridFSBucket initialized");
});

// Getter function to safely retrieve gridfsBucket
const getGridFSBucket = () => {
  if (!gridfsBucket) {
    throw new Error("GridFSBucket is not initialized yet.");
  }
  return gridfsBucket;
};

// Set up Multer to store files in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // Max file size of 100MB
}).fields([
  { name: "audiobook", maxCount: 1 }, // Audiobook field
  { name: "image", maxCount: 1 }, // Image field
]);

export { getGridFSBucket, upload };
