import mongoose from "mongoose";

const channelSchema =
  new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50,
      },

      admin: {
        type:
          mongoose.Schema.Types
            .ObjectId,
        ref: "User",
        required: true,
      },

      members: [
        {
          type:
            mongoose.Schema.Types
              .ObjectId,
          ref: "User",
        },
      ],
    },

    {
      timestamps: true,
    },
  );

const Channel =
  mongoose.model(
    "Channel",
    channelSchema,
  );

export default Channel;