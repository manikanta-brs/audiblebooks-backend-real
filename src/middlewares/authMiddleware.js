import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import Author from "../models/authorModel.js";
import expressAsyncHandler from "express-async-handler";

// const checkUserToken = expressAsyncHandler(async (req, res, next) => {
//   let token;
//   const authorizationHeader = req.headers.authorization;

//   if (authorizationHeader && authorizationHeader.startsWith("Bearer")) {
//     token = authorizationHeader.split(" ")[1];
//     try {
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       console.log("Verified Token:", decoded);

//       // Check if the token has userId
//       if (decoded.userId) {
//         const user = await User.findById(decoded.userId).select("-password");
//         if (!user) {
//           res.status(404);
//           throw new Error("User  not found");
//         }
//         req.user = user; // Attach user object to the request
//       } else if (decoded.authorId) {
//         const author = await Author.findById(decoded.authorId).select(
//           "-password"
//         );
//         if (!author) {
//           res.status(404);
//           throw new Error("Author not found");
//         }
//         req.author = author; // Attach author object to the request
//       } else {
//         res.status(401);
//         throw new Error("Invalid token: no userId or authorId found");
//       }

//       next(); // Proceed to the next middleware
//     } catch (error) {
//       res.status(401);
//       throw new Error("Not authorized, invalid token");
//     }
//   } else {
//     res.status(401);
//     throw new Error("Not authorized, token is required");
//   }
// });
const checkUserToken = expressAsyncHandler(async (req, res, next) => {
  console.log("User attached to request:", req.user);

  let token;
  const authorizationHeader = req.headers.authorization;

  if (authorizationHeader && authorizationHeader.startsWith("Bearer")) {
    token = authorizationHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Verified Token:", decoded);

      // Check if the token has userId
      if (decoded.userId) {
        const user = await User.findById(decoded.userId).select("-password");
        if (!user) {
          res.status(404);
          throw new Error("User  not found");
        }
        req.user = user; // Attach user object to the request
        console.log("User  attached to request:", req.user);
      }
      // Check if the token has authorId
      else if (decoded.authorId) {
        const author = await Author.findById(decoded.authorId).select(
          "-password"
        );
        if (!author) {
          res.status(404);
          throw new Error("Author not found");
        }
        req.author = author; // Attach author object to the request
        console.log("Author attached to request:", req.author);
      } else {
        res.status(401);
        throw new Error("Invalid token: no userId or authorId found");
      }

      next(); // Proceed to the next middleware
    } catch (error) {
      res.status(401);
      throw new Error("Not authorized, invalid token");
    }
  } else {
    res.status(401);
    throw new Error("Not authorized, token is required");
  }
});
const checkAuthorToken = expressAsyncHandler(async (req, res, next) => {
  console.log("Author attached to request:", req.author);

  let token;
  const authorizationHeader = req.headers.authorization;
  console.log("Authorization Header:", req.headers.authorization);

  if (authorizationHeader && authorizationHeader.startsWith("Bearer")) {
    token = authorizationHeader.split(" ")[1];

    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Verified Token in Author Token:", decodedToken);

      // Check if author exists in the database
      const author = await Author.findById(decodedToken.authorId).select(
        "-password"
      );

      if (!author) {
        res.status(404);
        throw new Error("Author not found");
      }

      // Attach the author object to the request
      req.author = author;
      console.log("Author attached to request:", req.author);
      next();
    } catch (error) {
      res.status(401);
      throw new Error("Not authorized, invalid token");
    }
  } else {
    res.status(401);
    throw new Error("Not authorized, token is required");
  }
});

// const checkUserToken = expressAsyncHandler(async (req, res, next) => {
//   let token;
//   const authorizationHeader = req.headers.authorization;

//   if (authorizationHeader && authorizationHeader.startsWith("Bearer")) {
//     token = authorizationHeader.split(" ")[1];
//     try {
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       console.log("Verified Token:", decoded);

//       // Check if the token has userId
//       if (decoded.userId) {
//         const user = await User.findById(decoded.userId).select("-password");
//         if (!user) {
//           res.status(404);
//           throw new Error("User  not found");
//         }
//         req.user = user; // Attach user object to the request
//       }
//       // Check if the token has authorId
//       else if (decoded.authorId) {
//         const author = await Author.findById(decoded.authorId).select(
//           "-password"
//         );
//         if (!author) {
//           res.status(404);
//           throw new Error("Author not found");
//         }
//         req.author = author; // Attach author object to the request
//       } else {
//         res.status(401);
//         throw new Error("Invalid token: no userId or authorId found");
//       }

//       next(); // Proceed to the next middleware
//     } catch (error) {
//       res.status(401);
//       throw new Error("Not authorized, invalid token");
//     }
//   } else {
//     res.status(401);
//     throw new Error("Not authorized, token is required");
//   }
// });
// const checkAuthorToken = expressAsyncHandler(async (req, res, next) => {
//   let token;
//   const authorizationHeader = req.headers.authorization;
//   console.log("Authorization Header:", req.headers.authorization);

//   if (authorizationHeader && authorizationHeader.startsWith("Bearer")) {
//     token = authorizationHeader.split(" ")[1];

//     try {
//       const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

//       // Check if author exists in the database
//       const author = await Author.findById(decodedToken.authorId).select(
//         "-password"
//       );

//       if (!author) {
//         res.status(404);
//         throw new Error("Author not found");
//       }

//       // Attach the author object to the request
//       req.author = author;
//       next();
//     } catch (error) {
//       res.status(401);
//       throw new Error("Not authorized, invalid token");
//     }
//   } else {
//     res.status(401);
//     throw new Error("Not authorized, token is required");
//   }
// });

export { checkUserToken, checkAuthorToken };
