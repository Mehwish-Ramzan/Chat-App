import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
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

    messageType: {
      type: String,
      enum: [
        "text",
        "image",
        "video",
        "file",
      ],
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

    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    editedAt: {
      type: Date,
      default: null,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  },
);

const Message = mongoose.model(
  "Message",
  messageSchema,
);

export default Message;