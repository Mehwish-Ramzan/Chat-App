import mongoose from "mongoose";

const conversationPreferenceSchema =
  new mongoose.Schema(
    {
      user: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      contact: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      hidden: {
        type: Boolean,
        default: false,
      },

      clearedAt: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
    },
  );

conversationPreferenceSchema.index(
  {
    user: 1,
    contact: 1,
  },
  {
    unique: true,
  },
);

const ConversationPreference =
  mongoose.model(
    "ConversationPreference",
    conversationPreferenceSchema,
  );

export default ConversationPreference;