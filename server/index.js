import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/AuthRoutes.js";
import contactRoutes from "./routes/ContactRoutes.js";
import messageRoutes from "./routes/MessageRoutes.js";
import chatRequestRoutes from "./routes/ChatRequestRoutes.js";

import setupSocket from "./socket.js";
import channelRoutes from "./routes/ChannelRoutes.js";

dotenv.config();

const app = express();

const port = process.env.PORT || 5000;

const databaseURL =
  process.env.DATABASE_URI || "mongodb://localhost:27017/chat-app";

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,

    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],

    credentials: true,

    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(cookieParser());

app.use(express.json());

/*
 * STATIC FILES
 */
app.use("/uploads/profiles", express.static("uploads/profiles"));

app.use("/uploads/messages", express.static("uploads/messages"));

/*
 * API ROUTES
 */
app.use("/api/auth", authRoutes);

app.use("/api/contacts", contactRoutes);

app.use("/api/messages", messageRoutes);

app.use("/api/chat-requests", chatRequestRoutes);

app.use("/api/channels", channelRoutes);
/*
 * DATABASE + HTTP + SOCKET SERVER
 */
mongoose
  .connect(databaseURL)

  .then(() => {
    console.log("Connected to Database successfully");
    const server = app.listen(port, "0.0.0.0", () => {
      console.log(`Server is running on port ${port}`);
    });

    setupSocket(server);
  })

  .catch((error) => {
    console.error("Database connection error:", error);

    process.exit(1);
  });
