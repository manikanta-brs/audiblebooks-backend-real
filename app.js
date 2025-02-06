import express from "express";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import { errHandler, notFound } from "./src/middlewares/errMiddleware.js";
import languageRoute from "./src/routes/languageRoute.js";
import categoryRoute from "./src/routes/categoryRoute.js";
import userRoute from "./src/routes/userRoute.js";
import cors from "cors";
import useragent from "express-useragent";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import authorRoute from "./src/routes/authorRoute.js";
import audiobookRoute from "./src/routes/audiobookRoute.js";
import compression from "compression";
// Load environment variables
dotenv.config();
const port = process.env.PORT || 4000;

// Connect to the database
await connectDB();

// Initialize Express app
const app = express();

// Middleware
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production" ? "http://localhost:4000" : "*", // Restrict origins in production
  })
);
app.use(useragent.express());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(compression());

// Routes
app.get("/", (req, res) => {
  res.send("Hello, World!");
});
app.use("/api/languages", languageRoute);
app.use("/api/categories", categoryRoute);
app.use("/api/users", userRoute);
app.use("/api/authors", authorRoute);
app.use("/api/audiobooks", audiobookRoute);

// Test route to trigger error
app.get("/test", (req, res, next) => {
  const err = new Error("Something went wrong");
  next(err);
});

// Fix for ES modules __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// // Use absolute path for production
// const viewsPath =
//   process.env.NODE_ENV === "production"
//     ? "/opt/render/project/src/src/templates"
//     : path.join(__dirname, "src", "templates");
// console.log("Views Path:", viewsPath);

// app.set("views", viewsPath);
// app.set("view engine", "ejs");
// Set EJS as the templating engine
app.set("view engine", "ejs");

// Explicitly set the views directory to your templates folder
app.set("views", path.join(__dirname, "src/templates"));

console.log("Views Path:", path.join(__dirname, "src/templates"));

// Debugging for development (Make sure to remove or disable this in production)
if (process.env.NODE_ENV === "development") {
  app.get("/debug-paths", (req, res) => {
    const debug = {
      viewsPath,
      viewsExists: fs.existsSync(viewsPath),
      cwd: process.cwd(),
      dirname: __dirname,
      viewsContents: fs.existsSync(viewsPath)
        ? fs.readdirSync(viewsPath)
        : "Directory not found",
      env: process.env.NODE_ENV,
    };
    res.json(debug);
  });
}

// Error handling middleware
app.use(notFound);
app.use(errHandler);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
