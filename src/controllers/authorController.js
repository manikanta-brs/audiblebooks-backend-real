import Author from "../models/authorModel.js";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import {
  sendEmailVerificationLink,
  sendPasswordResetLink,
} from "../utils/utils.js";
// import SpotifyWebApi from "spotify-web-api-node";
import Language from "../models/languageModel.js";

// create a new user
const createAuthor = async (req, res, next) => {
  const avatarImages = [
    "https://cdn-icons-png.flaticon.com/512/4322/4322991.png",
    "https://cdn-icons-png.flaticon.com/512/1326/1326377.png",
    "https://cdn-icons-png.flaticon.com/512/2632/2632839.png",
    "https://cdn-icons-png.flaticon.com/512/3940/3940403.png",
    "https://cdn-icons-png.flaticon.com/512/3940/3940417.png",
    "https://cdn-icons-png.flaticon.com/512/1326/1326405.png",
    "https://cdn-icons-png.flaticon.com/512/1326/1326390.png",
    "https://cdn-icons-png.flaticon.com/512/1760/1760998.png",
  ];
  // Select a random avatar
  const randomAvatar =
    avatarImages[Math.floor(Math.random() * avatarImages.length)];

  const { first_name, last_name, email, password } = req.body;
  try {
    if (!first_name || !last_name || !email || !password) {
      const err = new Error(
        "Firstname, Lastname, Email and Password is required"
      );
      err.statusCode = 400;
      return next(err);
    }

    // Check for valid email address
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const err = new Error("Invalid email address");
      res.status(400);
      return next(err);
    }

    // Check for existing user
    const authorExists = await Author.findOne({ email });
    if (authorExists) {
      res.status(409);
      const err = new Error(
        "Author with this email already exists. Please use a different email address"
      );
      err.statusCode = 409;
      return next(err);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Generate token
    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });

    // Send verification email
    const verificationEmailResponse = await sendEmailVerificationLink(
      email,
      token,
      first_name,
      "authors"
    );

    // Handle email sending error
    if (verificationEmailResponse.error) {
      const err = new Error(
        "Failed to send verification email, please try again later"
      );
      err.statusCode = 500;
      return next(err);
    }

    // Save user to DB
    await Author.create({
      avatar: randomAvatar,
      first_name,
      last_name,
      email,
      password: hashedPassword,
      verify_token: token,
      verify_token_expires: Date.now() + 7200000, // 2 hours
    });

    // Respond with success message
    res.status(201).json({
      message:
        "Registered successfully. Please check your email to verify the account",
    });
  } catch (error) {
    return next(error);
  }
};

const verifyAuthorEmail = async (req, res, next) => {
  try {
    const author = await Author.findOne({
      verify_token: req.params.verifyToken,
    });

    // Check if the request expects JSON (like from Postman or API calls)
    const wantsJson =
      req.headers.accept && req.headers.accept.includes("application/json");

    if (!author) {
      const response = {
        success: false,
        message: "Invalid verification token.",
      };

      return wantsJson
        ? res.status(400).json(response)
        : res.render("email_verified", response);
    }

    if (author.verify_token_expires <= Date.now()) {
      if (!author.verified) {
        await author.deleteOne();
      }
      const response = {
        success: false,
        message: "Verification token has expired.",
      };

      return wantsJson
        ? res.status(400).json(response)
        : res.render("email_verified", response);
    }

    if (author.verified) {
      const response = {
        success: true,
        message: "Email already verified. Please login to continue.",
        isAuthor: true,
      };

      return wantsJson
        ? res.status(200).json(response)
        : res.render("email_verified", response);
    }

    // Verify the author
    author.verified = true;
    author.isAuthor = true;
    author.verify_token = undefined;
    author.verify_token_expires = undefined;
    await author.save();

    const response = {
      success: true,
      message: "Email verified successfully. Please login to continue.",
      isAuthor: true,
    };

    return wantsJson
      ? res.status(200).json(response)
      : res.render("email_verified", response);
  } catch (error) {
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

// const verifyAuthorEmail = async (req, res, next) => {
//   try {
//     const author = await Author.findOne({
//       verify_token: req.params.verifyToken,
//     });

//     // Check if the request expects JSON (like from Postman or API calls)
//     const wantsJson =
//       req.headers.accept && req.headers.accept.includes("application/json");

//     if (!author) {
//       const response = {
//         success: false,
//         message: "Invalid verification token.",
//       };

//       return wantsJson
//         ? res.status(400).json(response)
//         : res.render("email_verified", response);
//     }

//     if (author.verify_token_expires <= Date.now()) {
//       if (!author.verified) {
//         await author.deleteOne();
//       }
//       const response = {
//         success: false,
//         message: "Verification token has expired.",
//       };

//       return wantsJson
//         ? res.status(400).json(response)
//         : res.render("email_verified", response);
//     }

//     if (author.verified) {
//       const response = {
//         success: true,
//         message: "Email already verified. Please login to continue.",
//       };

//       return wantsJson
//         ? res.status(200).json(response)
//         : res.render("email_verified", response);
//     }

//     // Verify the author
//     author.verified = true;
//     author.isAuthor = true;
//     author.verify_token = undefined;
//     author.verify_token_expires = undefined;
//     await author.save();

//     const response = {
//       success: true,
//       message: "Email verified successfully. Please login to continue.",
//     };

//     return wantsJson
//       ? res.status(200).json(response)
//       : res.render("email_verified", response);
//   } catch (error) {
//     if (req.headers.accept && req.headers.accept.includes("application/json")) {
//       return res.status(500).json({
//         success: false,
//         message: error.message,
//       });
//     }
//     next(error);
//   }
// };

// Login Author
const loginAuthor = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    const err = new Error("Email & Password are required");
    err.statusCode = 400;
    return next(err);
  }
  // check for valid email adress
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    const err = new Error("Invalid email address");
    return next(err);
  }
  try {
    const author = await Author.findOne({ email });
    if (!author) {
      const err = new Error("Author not found");
      err.statusCode = 400;
      return next(err);
    }
    if (!author.verified) {
      const err = new Error(
        "Your account verification is pending. Please verify your email to continue"
      );
      err.statusCode = 409;
      return next(err);
    }

    // check for password match
    const passwordMatched = await bcrypt.compare(password, author.password);
    console.log(passwordMatched);
    if (!passwordMatched) {
      const err = new Error("Invalid email or password");
      err.statusCode = 400;
      return next(err);
    }

    // generate the token
    // generate the token
    const token = jwt.sign(
      {
        authorId: author._id, // Include authorId in the payload
        email: email, // Use the email variable from the request
      },
      process.env.JWT_SECRET,
      {
        expiresIn: 2592000,
      }
    );
    author.token = token;
    await author.save();

    // our token exp time
    const expiresIn = 2592000;
    res.status(200).json({ token, expiresIn });
  } catch (error) {
    return next(error);
  }
};

// get author  profile
const getAuthorProfile = async (req, res, next) => {
  try {
    const author = await Author.findById(req.author._id);

    if (!author) {
      const err = new Error("author not found");
      err.statusCode = 404;
      return next(err);
    }

    const profileData = {
      _id: author._id,
      first_name: author.first_name,
      last_name: author.last_name,
      email: author.email,
    };

    res.status(200).json({ profileData });
  } catch (error) {
    return next(error);
  }
};

// update author profile
const updateAuthorProfile = async (req, res, next) => {
  const { first_name, last_name, email } = req.body;
  try {
    const author = await Author.findById(req.author._id);
    if (!author) {
      const err = new Error("author not found");
      err.statusCode = 404;
      return next(err);
    }

    if (first_name || last_name) {
      author.first_name = first_name || author.first_name;
      author.last_name = last_name || author.last_name;
    }

    if (email && email !== author.email) {
      const authorExists = await Author.findOne({ email });

      if (authorExists) {
        const err = new Error(
          `${email} is already in use, please choose a different one`
        );
        err.statusCode = 409;
        return next(err);
      }
      author.email = email;
    }
    await author.save();
    res.status(200).json({ message: "updated successfully" });
  } catch (error) {
    return next(error);
  }
};

// update author password
const updatePassword = async (req, res, next) => {
  const { password } = req.body;
  if (!password) {
    const err = new Error("Password is required");
    err.statusCode = 400;
    return next(err);
  }
  try {
    const author = await Author.findById(req.author._id);
    if (!author) {
      const err = new Error("author not found");
      err.statusCode = 404;
      return next(err);
    }
    // password hash
    const hashedPassword = await bcrypt.hash(password, 10);
    author.password = hashedPassword;
    await author.save();
    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    return next(error);
  }
};

// forgot password
const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    const err = new Error("Email is required");
    err.statusCode = 400;
    return next(err);
  }
  try {
    const author = await Author.findOne({ email });
    if (!author) {
      const err = new Error("Email not found");
      err.statusCode = 400;
      return next(err);
    }
    // generate token
    const token = jwt.sign(
      { authorId: author._id, email },
      process.env.JWT_SECRET,
      {
        expiresIn: "2h",
      }
    );
    // save token in DB
    author.reset_password_token = token;
    author.reset_password_expires = Date.now() + 7200000;
    await author.save();
    // send mail
    const verificationEmailResponse = await sendPasswordResetLink(
      email,
      token,
      author.first_name
    );
    // handle err
    if (verificationEmailResponse.error) {
      const err = new Error(
        "Failed to send password reset link, please try again later"
      );
      err.statusCode = 500;
      return next(err);
    }
    res.status(200).json({
      message: "Password reset link sent successfully, please check your email",
    });
  } catch (error) {
    return next(error);
  }
};

// reset password
const resetPassword = async (req, res, next) => {
  const { token } = req.params; // token is passed via URL parameter
  const { password } = req.body;

  if (!token) {
    const err = new Error("Token is required");
    err.statusCode = 400;
    return next(err);
  }
  if (!password) {
    const err = new Error("Password is required");
    err.statusCode = 400;
    return next(err);
  }

  try {
    // Find the author by token and check if the reset token has expired
    const author = await Author.findOne({
      reset_password_token: token,
      reset_password_expires: { $gt: Date.now() }, // Check if token is still valid
    });

    // Log the token, current time, and token expiry for debugging
    console.log("Reset Token:", token); // Log the reset token
    console.log("Current Time:", Date.now()); // Log the current time
    console.log("Token Expiry:", user?.reset_password_expires); // Log the token expiry date

    if (!author) {
      console.log("author not found or token expired");

      const err = new Error(
        "Password reset link is invalid or expired, please try again"
      );
      err.statusCode = 400;
      return next(err);
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password and clear the reset token and expiry
    author.password = hashedPassword;
    author.reset_password_token = undefined;
    author.reset_password_expires = undefined;

    // Save the updated user object
    await author.save();

    res.status(200).json({
      message: "Password updated successfully, please login to continue",
    });
  } catch (error) {
    return next(error); // Pass any errors to the error-handling middleware
  }
};

// const uploadAudiobook = asyncHandler(async (req, res, next) => {
//   try {
//     // Extract token from headers
//     let token;
//     const authorizationHeader = req.headers.authorization;

//     if (authorizationHeader && authorizationHeader.startsWith("Bearer")) {
//       token = authorizationHeader.split(" ")[1];
//       try {
//         const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

//         // Check if the author exists
//         const author = await Author.findById(decodedToken.authorId).select(
//           "-password"
//         );
//         if (!author) {
//           return res.status(404).json({ error: "Author not found" });
//         }

//         req.author = author;
//       } catch (error) {
//         return res.status(401).json({ error: "Not authorized, invalid token" });
//       }
//     } else {
//       return res
//         .status(401)
//         .json({ error: "Not authorized, token is required" });
//     }

//     // Ensure audiobook and image are provided
//     if (!req.files || !req.files["audiobook"] || !req.files["image"]) {
//       return res
//         .status(400)
//         .json({ error: "Please upload both audiobook and image files" });
//     }

//     const audiobookFile = req.files["audiobook"][0];
//     const imageFile = req.files["image"][0];

//     // Check if an audiobook with the same filename already exists in GridFS
//     const existingFile = await gridfsBucket
//       .find({ filename: audiobookFile.originalname })
//       .toArray();
//     if (existingFile.length > 0) {
//       return res.status(409).json({ error: "Audiobook already exists" });
//     }

//     // Upload audiobook and image concurrently using Promise.all
//     const uploadAudioPromise = new Promise((resolve, reject) => {
//       const audioUploadStream = gridfsBucket.openUploadStream(
//         audiobookFile.originalname,
//         {
//           contentType: audiobookFile.mimetype,
//         }
//       );

//       audioUploadStream.on("finish", function () {
//         if (!audioUploadStream.id) {
//           return reject(new Error("Failed to retrieve file ID from GridFS"));
//         }
//         resolve(audioUploadStream.id); // ✅ Get the correct _id
//       });

//       audioUploadStream.on("error", reject);
//       audioUploadStream.end(audiobookFile.buffer);
//     });

//     // const uploadAudioPromise = new Promise((resolve, reject) => {
//     //   const audioUploadStream = gridfsBucket.openUploadStream(
//     //     audiobookFile.originalname,
//     //     {
//     //       contentType: audiobookFile.mimetype,
//     //     }
//     //   );
//     //   audioUploadStream.end(audiobookFile.buffer);
//     //   audioUploadStream.on("finish", async (file) => {
//     //     resolve(file._id); // Capture the GridFS file _id as bookId
//     //   });
//     //   audioUploadStream.on("error", reject);
//     // });

//     const uploadImagePromise = new Promise((resolve, reject) => {
//       const imageUploadStream = gridfsBucket.openUploadStream(
//         imageFile.originalname,
//         {
//           contentType: imageFile.mimetype,
//         }
//       );
//       imageUploadStream.end(imageFile.buffer);
//       imageUploadStream.on("finish", resolve);
//       imageUploadStream.on("error", reject);
//     });

//     // Wait for both uploads to finish
//     const [bookId] = await Promise.all([
//       uploadAudioPromise,
//       uploadImagePromise,
//     ]);

//     // Save metadata in the Audiobook collection
//     const newAudiobook = new Audiobook({
//       bookId, // Assign the GridFS file ID as bookId
//       authorId: req.author._id,
//       title: audiobookFile.originalname,
//       coverImage: imageFile.originalname,
//       uploadedAt: new Date(),
//     });

//     await newAudiobook.save();

//     res.status(201).json({
//       message: "Files uploaded successfully",
//       bookId,
//       authorId: req.author._id,
//     });
//   } catch (error) {
//     console.error(error);
//     return next(error);
//   }
// });

// const uploadAudiobook = async (req, res, next) => {
//   try {
//     // Extract token from headers
//     let token;
//     const authorizationHeader = req.headers.authorization;

//     if (authorizationHeader && authorizationHeader.startsWith("Bearer")) {
//       token = authorizationHeader.split(" ")[1];
//       try {
//         const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

//         // Check if user exists
//         const author = await Author.findById(decodedToken.authorId).select(
//           "-password"
//         );
//         if (!author) {
//           return res.status(404).json({ error: "Author not found" });
//         }

//         req.author = author;
//       } catch (error) {
//         return res.status(401).json({ error: "Not authorized, invalid token" });
//       }
//     } else {
//       return res
//         .status(401)
//         .json({ error: "Not authorized, token is required" });
//     }

//     // Ensure both audiobook and image are provided
//     if (!req.files || !req.files["audiobook"] || !req.files["image"]) {
//       return res
//         .status(400)
//         .json({ error: "Please upload both audiobook and image files" });
//     }

//     const audiobookFile = req.files["audiobook"][0];
//     const imageFile = req.files["image"][0];

//     // Check if an audiobook with the same filename already exists in GridFS
//     const existingFile = await gridfsBucket
//       .find({ filename: audiobookFile.originalname })
//       .toArray();
//     if (existingFile.length > 0) {
//       return res.status(409).json({ error: "Audiobook already exists" });
//     }

//     // Upload audiobook and image concurrently using Promise.all
//     const uploadAudioPromise = new Promise((resolve, reject) => {
//       const audioUploadStream = gridfsBucket.openUploadStream(
//         audiobookFile.originalname,
//         {
//           contentType: audiobookFile.mimetype,
//         }
//       );
//       audioUploadStream.end(audiobookFile.buffer);
//       audioUploadStream.on("finish", resolve);
//       audioUploadStream.on("error", reject);
//     });

//     const uploadImagePromise = new Promise((resolve, reject) => {
//       const imageUploadStream = gridfsBucket.openUploadStream(
//         imageFile.originalname,
//         {
//           contentType: imageFile.mimetype,
//         }
//       );
//       imageUploadStream.end(imageFile.buffer);
//       imageUploadStream.on("finish", resolve);
//       imageUploadStream.on("error", reject);
//     });

//     // Wait for both uploads to finish
//     await Promise.all([uploadAudioPromise, uploadImagePromise]);

//     res.status(200).json({
//       message: "Files uploaded successfully",
//       authorId: req.author._id,
//     });
//   } catch (error) {
//     console.error(error);
//     return next(error);
//   }
// }; // this works fine

export {
  createAuthor,
  verifyAuthorEmail,
  loginAuthor,
  getAuthorProfile,
  updateAuthorProfile,
  updatePassword,
  forgotPassword,
  resetPassword,
};
