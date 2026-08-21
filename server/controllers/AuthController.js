import User from "../models/UserModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import fs from "fs";

const maxAge = 1000 * 60 * 60 * 24 * 3;

const isProduction = process.env.NODE_ENV === "production";

const getCookieOptions = () => ({
  httpOnly: true,

  secure: isProduction,

  sameSite: isProduction ? "none" : "lax",

  path: "/",
});

const createToken = ({ email, id }) => {
  return jwt.sign({ email, id }, process.env.JWT_SECRET, {
    expiresIn: maxAge / 1000, // Convert milliseconds to seconds
  });
};

export const signup = async (request, response, next) => {
  try {
    const { email, password } = request.body;
    if (!email || !password) {
      return response
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Add duplicate check
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return response.status(400).json({ message: "Email already exists" });
    }

    const user = await User.create({ email, password });
    const token = createToken({ email: user.email, id: user.id });
    response.cookie("jwt", token, {
      ...getCookieOptions(),
      maxAge,
    });

    return response.status(201).json({
      message: "User created successfully",
      user: {
        email: user.email,
        id: user.id,
        profileSetup: user.profileSetup,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image,
      },
    });

    // await newUser.save();
    // res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error) {
    console.error("Error during signup:", error);
    response.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (request, response, next) => {
  try {
    const { email, password } = request.body;
    if (!email || !password) {
      return response
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return response
        .status(401)
        .json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return response.status(401).json({ message: "Password is incorrect" });

    const token = createToken({ email: user.email, id: user.id });
    response.cookie("jwt", token, {
      ...getCookieOptions(),
      maxAge,
    });

    return response.status(201).json({
      message: "Login successful",
      user: {
        email: user.email,
        id: user.id,
        profileSetup: user.profileSetup,
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image,
        color: user.color,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    response.status(500).json({ message: "Internal server error" });
  }
};

export const getUserInfo = async (request, response, next) => {
  try {
    const userData = await User.findById(request.userId);
    if (!userData) {
      return response
        .status(404)
        .json({ message: "User with the given ID not found" });
    }

    return response.status(200).json({
      message: "User Info Fetched Successfully",
      user: {
        email: userData.email,
        id: userData.id,
        profileSetup: userData.profileSetup,
        firstName: userData.firstName,
        lastName: userData.lastName,
        image: userData.image,
        color: userData.color,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    response.status(500).json({ message: "Internal server error" });
  }
};

export const updateProfile = async (request, response, next) => {
  try {

    const userID = request.userId;
    const { firstName, lastName, color } = request.body;

    if (!firstName || !lastName) {
      return response.status(400).json({
        message: "First name and last name are required.",
      });
    }

    const userData = await User.findByIdAndUpdate(
      userID,
      {
        firstName,
        lastName,
        color,
        profileSetup: true,
      },
      { new: true, runValidators: true },
    );

    if (!userData) {
      return response.status(404).json({
        message: "User with the given ID not found",
      });
    }

    return response.status(200).json({
      message: "Profile updated successfully",
      user: {
        email: userData.email,
        id: userData.id,
        profileSetup: userData.profileSetup,
        firstName: userData.firstName,
        lastName: userData.lastName,
        image: userData.image,
        color: userData.color,
      },
    });
  } catch (error) {
    console.error("Error during profile update:", error);
    return response.status(500).json({ message: "Internal server error" });
  }
};

export const addProfileImage = async (request, response, next) => {
  try {
  

    if (!request.file) {
      return response.status(400).json({ message: "No file uploaded" });
    }

    const date = Date.now();
    const fileName = `uploads/profiles/${date}-${request.file.originalname}`;

    fs.renameSync(request.file.path, fileName);

    const updatedUser = await User.findByIdAndUpdate(
      request.userId,
      {
        image: fileName,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedUser) {
      return response.status(404).json({
        message: "User with the given ID not found",
      });
    }

    return response.status(200).json({
      message: "Profile image updated successfully",
      user: {
        email: updatedUser.email,
        id: updatedUser.id,
        profileSetup: updatedUser.profileSetup,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        image: updatedUser.image,
        color: updatedUser.color,
      },
    });
  } catch (error) {
    console.error("Error during updating image:", error);
    return response.status(500).json({ message: "Internal server error" });
  }
};

export const removeProfileImage = async (request, response, next) => {
  try {
    const { userId } = request;

    const user = await User.findById(userId);
    if (!user) {
      return response
        .status(404)
        .json({ message: "User with the given ID not found" });
    }

    // Delete the image file from the server
    if (user.image && fs.existsSync(user.image)) {
      fs.unlinkSync(user.image);
    }

    user.image = null;
    await user.save();

    // Update the user to remove the image reference
    // const updatedUser = await User.findByIdAndUpdate(
    //   userId,
    //   { image: null },
    //   { new: true, runValidators: true }
    // );

    return response.status(200).json({
      message: "Profile image removed successfully",
    });
  } catch (error) {
    console.error("Error during image removal:", error);
    response.status(500).json({ message: "Internal server error" });
  }
};

export const logOut = async (request, response, next) => {
  try {
    response.clearCookie("jwt", getCookieOptions());

    return response.status(200).json({
      message: "LogOut successful.",
    });
  } catch (error) {
    console.error({ error });

    return response.status(500).json({
      message: "Internal server error",
    });
  }
};
