import { checkUserToken, checkAuthorToken } from "./authMiddleware.js";

const checkUserOrAuthorToken = async (req, res, next) => {
  console.log("checkUser OrAuthorToken middleware called");
  try {
    // First, try to verify the user token
    await checkUserToken(req, res, next);
  } catch (error) {
    console.log("User  token verification failed, trying author token...");
    // If user verification fails, try verifying the author token
    try {
      await checkAuthorToken(req, res, next);
    } catch (error) {
      return res.status(401).json({ error: "Not authorized, invalid token" });
    }
  }
};
export { checkUserOrAuthorToken };
