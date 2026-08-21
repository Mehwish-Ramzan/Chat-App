import mongoose from "mongoose";

const channelMessageSchema = new mongoose.Schema(
  {
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    messageType: {
      type: String,
      enum: ["text", "image", "video", "file"],
      default: "text",
      required: true,
    },

    content: {
      type: String,
      default: "",
      required: function () {
        return (
          this.messageType === "text" &&
          !this.isDeleted
        );
      },
    },

    fileUrl: {
      type: String,
      default: null,
      required: function () {
        return (
          this.messageType !== "text" &&
          !this.isDeleted
        );
      },
    },

    originalFileName: {
      type: String,
      default: null,
    },

    mimeType: {
      type: String,
      default: null,
    },

    fileSize: {
      type: Number,
      default: null,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    editedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const ChannelMessage = mongoose.model(
  "ChannelMessage",
  channelMessageSchema,
);

export default ChannelMessage;