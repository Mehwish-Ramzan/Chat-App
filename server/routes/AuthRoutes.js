import { Router } from "express";
import {
  getUserInfo,
  signup,
  login,
  updateProfile,
  addProfileImage,
  removeProfileImage,
  logOut,
} from "../controllers/AuthController.js";
import { verifyToken } from "../middlewares/AuthMiddleware.js";

import multer from "multer";

const AuthRoutes = Router();

const upload = multer({ dest: "uploads/profiles/" });

AuthRoutes.post("/signup", signup);
AuthRoutes.post("/login", login);
AuthRoutes.get("/user-info", verifyToken, getUserInfo);
AuthRoutes.post("/update-profile", verifyToken, updateProfile); // Placeholder for update profile logic
AuthRoutes.post(
  "/add-profile-image",
  verifyToken,
  upload.single("profile-image"),
  addProfileImage
); // Placeholder for add profile image logic

AuthRoutes.delete("/delete-profile-image", verifyToken, removeProfileImage);
AuthRoutes.post("/logout", logOut);



export default AuthRoutes;
