import mongoose from "mongoose";

const chatRequestSchema =
  new mongoose.Schema(
    {
      pairKey: {
        type: String,
        required: true,
        unique: true,
        index: true,
      },

      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      status: {
        type: String,

        enum: [
          "pending",
          "accepted",
          "declined",
        ],

        default: "pending",

        required: true,
      },
    },

    {
      timestamps: true,
    },
  );

const ChatRequest =
  mongoose.model(
    "ChatRequest",
    chatRequestSchema,
  );

export default ChatRequest;