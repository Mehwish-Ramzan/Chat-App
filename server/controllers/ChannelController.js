import fs from "fs";
import path from "path";
import mongoose from "mongoose";

import Channel from "../models/ChannelModel.js";
import ChannelMessage from "../models/ChannelMessageModel.js";
import User from "../models/UserModel.js";

const getCurrentUserId = (req) =>
  req.userId ||
  req.user?.id ||
  req.user?._id;

const populateChannel = (query) =>
  query
    .populate(
      "admin",
      "_id email firstName lastName image color",
    )
    .populate(
      "members",
      "_id email firstName lastName image color",
    );

/*
 * CREATE CHANNEL
 */
export const createChannel = async (
  req,
  res,
) => {
  try {
    const userId =
      getCurrentUserId(req);

    const {
      name,
      members = [],
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!name?.trim()) {
      return res.status(400).json({
        message:
          "Channel name is required",
      });
    }

    const uniqueMemberIds = [
      ...new Set(
        members
          .filter(Boolean)
          .map(String),
      ),
    ].filter(
      (memberId) =>
        memberId !== String(userId),
    );

    if (uniqueMemberIds.length) {
      const validUsers =
        await User.find({
          _id: {
            $in: uniqueMemberIds,
          },
        }).select("_id");

      if (
        validUsers.length !==
        uniqueMemberIds.length
      ) {
        return res.status(400).json({
          message:
            "One or more members are invalid",
        });
      }
    }

    const channel =
      await Channel.create({
        name: name.trim(),

        admin: userId,

        members: [
          userId,
          ...uniqueMemberIds,
        ],
      });

    const populatedChannel =
      await populateChannel(
        Channel.findById(
          channel._id,
        ),
      );

    return res.status(201).json({
      message:
        "Channel created successfully",

      channel:
        populatedChannel,
    });
  } catch (error) {
    console.error(
      "Create channel error:",
      error,
    );

    return res.status(500).json({
      message:
        "Unable to create channel",
    });
  }
};

/*
 * GET MY CHANNELS
 */
export const getUserChannels = async (
  req,
  res,
) => {
  try {
    const userId =
      getCurrentUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const channels =
      await populateChannel(
        Channel.find({
          members: userId,
        }).sort({
          updatedAt: -1,
        }),
      );

    return res.status(200).json({
      channels,
    });
  } catch (error) {
    console.error(
      "Get channels error:",
      error,
    );

    return res.status(500).json({
      message:
        "Unable to get channels",
    });
  }
};

/*
 * GET ONE CHANNEL
 */
export const getChannel = async (
  req,
  res,
) => {
  try {
    const userId =
      getCurrentUserId(req);

    const { channelId } =
      req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        channelId,
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid channel ID",
      });
    }

    const channel =
      await populateChannel(
        Channel.findOne({
          _id: channelId,
          members: userId,
        }),
      );

    if (!channel) {
      return res.status(404).json({
        message:
          "Channel not found",
      });
    }

    return res.status(200).json({
      channel,
    });
  } catch (error) {
    console.error(
      "Get channel error:",
      error,
    );

    return res.status(500).json({
      message:
        "Unable to get channel",
    });
  }
};

/*
 * GET CHANNEL MESSAGES
 */
/* 
 * GET CHANNEL MESSAGES 
 */
export const getChannelMessages =
  async (req, res) => {
    try {
      const userId =
        getCurrentUserId(req);

      const { channelId } =
        req.params;

      const channel =
        await Channel.findOne({
          _id: channelId,
          members: userId,
        }).select("_id");

      if (!channel) {
        return res.status(403).json({
          message:
            "You are not a member of this channel",
        });
      }

      /*
       * IMPORTANT:
       *
       * Do NOT filter isDeleted.
       * Soft-deleted messages must
       * still be returned so frontend
       * can show:
       *
       * "This message was deleted"
       *
       * deletedFor hides the message
       * only from the current user.
       */
      const messages =
        await ChannelMessage.find({
          channel: channelId,

          deletedFor: {
            $ne: userId,
          },
        })
          .sort({
            createdAt: 1,
          })
          .populate(
            "sender",
            "_id email firstName lastName image color",
          );

      return res.status(200).json({
        messages,
      });
    } catch (error) {
      console.error(
        "Get channel messages error:",
        error,
      );

      return res.status(500).json({
        message:
          "Unable to get channel messages",
      });
    }
  };

/*
 * RENAME CHANNEL
 * ADMIN ONLY
 */
export const renameChannel = async (
  req,
  res,
) => {
  try {
    const userId =
      getCurrentUserId(req);

    const { channelId } =
      req.params;

    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        message:
          "Channel name is required",
      });
    }

    const channel =
      await Channel.findOne({
        _id: channelId,
        admin: userId,
      });

    if (!channel) {
      return res.status(403).json({
        message:
          "Only the channel admin can rename this channel",
      });
    }

    channel.name = name.trim();

    await channel.save();

    const populatedChannel =
      await populateChannel(
        Channel.findById(
          channel._id,
        ),
      );

    return res.status(200).json({
      message:
        "Channel renamed",

      channel:
        populatedChannel,
    });
  } catch (error) {
    console.error(
      "Rename channel error:",
      error,
    );

    return res.status(500).json({
      message:
        "Unable to rename channel",
    });
  }
};

/*
 * ADD MEMBER
 * ADMIN ONLY
 */
export const addChannelMember =
  async (req, res) => {
    try {
      const userId =
        getCurrentUserId(req);

      const { channelId } =
        req.params;

      const { memberId } =
        req.body;

      if (!memberId) {
        return res.status(400).json({
          message:
            "Member ID is required",
        });
      }

      const channel =
        await Channel.findOne({
          _id: channelId,
          admin: userId,
        });

      if (!channel) {
        return res.status(403).json({
          message:
            "Only the channel admin can add members",
        });
      }

      const user =
        await User.findById(
          memberId,
        ).select("_id");

      if (!user) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      const alreadyMember =
        channel.members.some(
          (id) =>
            String(id) ===
            String(memberId),
        );

      if (alreadyMember) {
        return res.status(409).json({
          message:
            "User is already a channel member",
        });
      }

      channel.members.push(
        memberId,
      );

      await channel.save();

      const populatedChannel =
        await populateChannel(
          Channel.findById(
            channel._id,
          ),
        );

      return res.status(200).json({
        message:
          "Member added",

        channel:
          populatedChannel,
      });
    } catch (error) {
      console.error(
        "Add member error:",
        error,
      );

      return res.status(500).json({
        message:
          "Unable to add member",
      });
    }
  };

/*
 * REMOVE MEMBER
 * ADMIN ONLY
 */
export const removeChannelMember =
  async (req, res) => {
    try {
      const userId =
        getCurrentUserId(req);

      const { channelId } =
        req.params;

      const { memberId } =
        req.body;

      if (!memberId) {
        return res.status(400).json({
          message:
            "Member ID is required",
        });
      }

      const channel =
        await Channel.findOne({
          _id: channelId,
          admin: userId,
        });

      if (!channel) {
        return res.status(403).json({
          message:
            "Only the channel admin can remove members",
        });
      }

      if (
        String(memberId) ===
        String(userId)
      ) {
        return res.status(400).json({
          message:
            "Admin cannot remove themselves. Use Leave Channel instead.",
        });
      }

      const isMember =
        channel.members.some(
          (id) =>
            String(id) ===
            String(memberId),
        );

      if (!isMember) {
        return res.status(404).json({
          message:
            "User is not a channel member",
        });
      }

      channel.members =
        channel.members.filter(
          (id) =>
            String(id) !==
            String(memberId),
        );

      await channel.save();

      const populatedChannel =
        await populateChannel(
          Channel.findById(
            channel._id,
          ),
        );

      return res.status(200).json({
        message:
          "Member removed",

        channel:
          populatedChannel,
      });
    } catch (error) {
      console.error(
        "Remove member error:",
        error,
      );

      return res.status(500).json({
        message:
          "Unable to remove member",
      });
    }
  };

/*
 * LEAVE CHANNEL
 */
export const leaveChannel = async (
  req,
  res,
) => {
  try {
    const userId =
      getCurrentUserId(req);

    const { channelId } =
      req.params;

    const channel =
      await Channel.findOne({
        _id: channelId,
        members: userId,
      });

    if (!channel) {
      return res.status(404).json({
        message:
          "Channel not found",
      });
    }

    const remainingMembers =
      channel.members.filter(
        (id) =>
          String(id) !==
          String(userId),
      );

    /*
     * Last member leaving:
     * delete channel.
     */
    if (
      remainingMembers.length === 0
    ) {
      await ChannelMessage.deleteMany(
        {
          channel: channel._id,
        },
      );

      await channel.deleteOne();

      return res.status(200).json({
        message:
          "Channel deleted because no members remain",

        deleted: true,
      });
    }

    /*
     * Admin leaves:
     * transfer admin to first
     * remaining member.
     */
    if (
      String(channel.admin) ===
      String(userId)
    ) {
      channel.admin =
        remainingMembers[0];
    }

    channel.members =
      remainingMembers;

    await channel.save();

    return res.status(200).json({
      message:
        "You left the channel",

      deleted: false,
    });
  } catch (error) {
    console.error(
      "Leave channel error:",
      error,
    );

    return res.status(500).json({
      message:
        "Unable to leave channel",
    });
  }
};

/*
 * DELETE CHANNEL
 * ADMIN ONLY
 */
export const deleteChannel = async (
  req,
  res,
) => {
  try {
    const userId =
      getCurrentUserId(req);

    const { channelId } =
      req.params;

    const channel =
      await Channel.findOne({
        _id: channelId,
        admin: userId,
      });

    if (!channel) {
      return res.status(403).json({
        message:
          "Only the channel admin can delete this channel",
      });
    }

    await ChannelMessage.deleteMany({
      channel: channel._id,
    });

    await channel.deleteOne();

    return res.status(200).json({
      message:
        "Channel deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete channel error:",
      error,
    );

    return res.status(500).json({
      message:
        "Unable to delete channel",
    });
  }
};

/*
 * DOWNLOAD CHANNEL FILE
 */
export const downloadChannelFile =
  async (req, res) => {
    try {
      const userId =
        getCurrentUserId(req);

      const { messageId } =
        req.params;

      const message =
        await ChannelMessage.findById(
          messageId,
        ).populate("channel");

      if (!message) {
        return res.status(404).json({
          message:
            "Channel message not found",
        });
      }

      if (message.isDeleted) {
        return res.status(410).json({
          message:
            "Message was deleted",
        });
      }

      const isMember =
        message.channel.members.some(
          (memberId) =>
            String(memberId) ===
            String(userId),
        );

      if (!isMember) {
        return res.status(403).json({
          message:
            "You are not a member of this channel",
        });
      }

      if (!message.fileUrl) {
        return res.status(404).json({
          message:
            "This message has no file",
        });
      }

      const relativePath =
        message.fileUrl.replace(
          "/uploads/messages/",
          "",
        );

      const filePath =
        path.resolve(
          "uploads/messages",
          relativePath,
        );

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          message:
            "File not found",
        });
      }

      return res.download(
        filePath,

        message.originalFileName ||
          path.basename(filePath),
      );
    } catch (error) {
      console.error(
        "Channel file download error:",
        error,
      );

      return res.status(500).json({
        message:
          "Download failed",
      });
    }
  };