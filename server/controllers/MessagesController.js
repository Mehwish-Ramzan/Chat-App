import fs from "fs";
import path from "path";

import Message from "../models/MessagesModel.js";
import ConversationPreference from "../models/ConversationPreferenceModel.js";

const getCurrentUserId = (req) => {
  return (
    req.userId ||
    req.user?.id ||
    req.user?._id
  );
};

/*
 * GET CHAT HISTORY
 */
export const getMessages = async (
  req,
  res,
) => {
  try {
    const userId =
      getCurrentUserId(req);

    const { contactId } =
      req.params;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!contactId) {
      return res.status(400).json({
        message:
          "Contact ID is required",
      });
    }

    const preference =
      await ConversationPreference.findOne(
        {
          user: userId,
          contact: contactId,
        },
      ).lean();

    /*
     * Build filters carefully so:
     *
     * - both conversation directions load
     * - Delete for everyone disappears
     * - Delete for me disappears only for this user
     * - Clear chat hides older messages only for this user
     */
    const filters = [
      {
        $or: [
          {
            sender: userId,
            recipient: contactId,
          },

          {
            sender: contactId,
            recipient: userId,
          },
        ],
      },

      /*
       * Delete for everyone.
       */
      {
        isDeleted: {
          $ne: true,
        },
      },

      /*
       * Delete for me.
       */
      {
        deletedFor: {
          $nin: [userId],
        },
      },
    ];

    /*
     * Clear conversation only
     * affects current user's view.
     */
    if (preference?.clearedAt) {
      filters.push({
        createdAt: {
          $gt: preference.clearedAt,
        },
      });
    }

    const messages =
      await Message.find({
        $and: filters,
      })
        .sort({
          createdAt: 1,
        })

        .populate(
          "sender",
          "_id email firstName lastName image color",
        )

        .populate(
          "recipient",
          "_id email firstName lastName image color",
        );

    return res.status(200).json({
      messages,
    });
  } catch (error) {
    console.error(
      "Get messages error:",
      error,
    );

    return res.status(500).json({
      message:
        "Unable to get messages",
    });
  }
};

/*
 * DIRECT MESSAGE SIDEBAR
 */
export const getUserContacts =
  async (req, res) => {
    try {
      const userId =
        getCurrentUserId(req);

      if (!userId) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      const [
        messages,
        preferences,
      ] = await Promise.all([
        /*
         * Messages visible to
         * this logged-in user.
         */
        Message.find({
          $and: [
            {
              $or: [
                {
                  sender: userId,
                },

                {
                  recipient:
                    userId,
                },
              ],
            },

            /*
             * Globally deleted.
             */
            {
              isDeleted: {
                $ne: true,
              },
            },

            /*
             * Deleted only for
             * current user.
             */
            {
              deletedFor: {
                $nin: [userId],
              },
            },
          ],
        })
          .sort({
            createdAt: -1,
          })

          .populate(
            "sender",
            "_id email firstName lastName image color",
          )

          .populate(
            "recipient",
            "_id email firstName lastName image color",
          ),

        ConversationPreference.find(
          {
            user: userId,
          },
        ).lean(),
      ]);

      const preferenceMap =
        new Map(
          preferences.map(
            (preference) => [
              String(
                preference.contact,
              ),

              preference,
            ],
          ),
        );

      const seenContacts =
        new Set();

      const contacts = [];

      for (
        const message of messages
      ) {
        const senderId =
          String(
            message.sender?._id,
          );

        const currentUserId =
          String(userId);

        const contact =
          senderId ===
          currentUserId
            ? message.recipient
            : message.sender;

        if (!contact?._id) {
          continue;
        }

        const contactId =
          String(contact._id);

        if (
          seenContacts.has(
            contactId,
          )
        ) {
          continue;
        }

        seenContacts.add(
          contactId,
        );

        const preference =
          preferenceMap.get(
            contactId,
          );

        /*
         * Hide conversation
         * only for this user.
         */
        if (
          preference?.hidden
        ) {
          continue;
        }

        let lastMessage =
          message.content || "";

        /*
         * Conversation was cleared
         * after this message.
         */
        if (
          preference?.clearedAt &&
          new Date(
            message.createdAt,
          ) <=
            new Date(
              preference.clearedAt,
            )
        ) {
          lastMessage =
            "Conversation cleared";
        } else if (
          message.messageType ===
          "image"
        ) {
          lastMessage =
            "📷 Image";
        } else if (
          message.messageType ===
          "file"
        ) {
          lastMessage =
            "📎 File";
        } else if (
          message.messageType ===
          "video"
        ) {
          lastMessage =
            "🎥 Video";
        }

        contacts.push({
          ...contact.toObject(),

          lastMessage,

          lastMessageAt:
            message.createdAt,
        });
      }

      return res.status(200).json({
        contacts,
      });
    } catch (error) {
      console.error(
        "Get user contacts error:",
        error,
      );

      return res.status(500).json({
        message:
          "Unable to get user contacts",
      });
    }
  };

/*
 * HIDE CONVERSATION
 */
export const hideConversation =
  async (req, res) => {
    try {
      const userId =
        getCurrentUserId(req);

      const { contactId } =
        req.params;

      if (!userId) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      if (!contactId) {
        return res.status(400).json({
          message:
            "Contact ID is required",
        });
      }

      await ConversationPreference.findOneAndUpdate(
        {
          user: userId,
          contact: contactId,
        },

        {
          $set: {
            hidden: true,
          },
        },

        {
          upsert: true,
          new: true,
        },
      );

      return res.status(200).json({
        message:
          "Conversation hidden",
      });
    } catch (error) {
      console.error(
        "Hide conversation error:",
        error,
      );

      return res.status(500).json({
        message:
          "Unable to hide conversation",
      });
    }
  };

/*
 * CLEAR CONVERSATION FOR ME
 */
export const clearConversation =
  async (req, res) => {
    try {
      const userId =
        getCurrentUserId(req);

      const { contactId } =
        req.params;

      if (!userId) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      if (!contactId) {
        return res.status(400).json({
          message:
            "Contact ID is required",
        });
      }

      const clearedAt =
        new Date();

      await ConversationPreference.findOneAndUpdate(
        {
          user: userId,
          contact: contactId,
        },

        {
          $set: {
            clearedAt,
            hidden: false,
          },
        },

        {
          upsert: true,
          new: true,
        },
      );

      return res.status(200).json({
        message:
          "Conversation cleared",

        clearedAt,
      });
    } catch (error) {
      console.error(
        "Clear conversation error:",
        error,
      );

      return res.status(500).json({
        message:
          "Unable to clear conversation",
      });
    }
  };

/*
 * FILE UPLOAD
 */
export const uploadMessageFile =
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message:
            "No file uploaded",
        });
      }

      const isImage =
        req.file.mimetype.startsWith(
          "image/",
        );

      const isVideo =
        req.file.mimetype.startsWith(
          "video/",
        );

      let messageType =
        "file";

      if (isImage) {
        messageType =
          "image";
      } else if (isVideo) {
        messageType =
          "video";
      }

      return res.status(200).json({
        fileUrl:
          `/uploads/messages/${req.file.filename}`,

        originalFileName:
          req.file.originalname,

        mimeType:
          req.file.mimetype,

        fileSize:
          req.file.size,

        messageType,
      });
    } catch (error) {
      console.error(
        "Upload message file error:",
        error,
      );

      return res.status(500).json({
        message:
          "File upload failed",
      });
    }
  };

/*
 * FILE DOWNLOAD
 */
export const downloadMessageFile =
  async (req, res) => {
    try {
      const userId =
        getCurrentUserId(req);

      const { messageId } =
        req.params;

      if (!userId) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      const message =
        await Message.findById(
          messageId,
        );

      if (!message) {
        return res.status(404).json({
          message:
            "Message not found",
        });
      }

      /*
       * Delete for everyone.
       */
      if (message.isDeleted) {
        return res.status(410).json({
          message:
            "This message was deleted",
        });
      }

      const allowed =
        String(message.sender) ===
          String(userId) ||
        String(
          message.recipient,
        ) === String(userId);

      if (!allowed) {
        return res.status(403).json({
          message:
            "Access denied",
        });
      }

      /*
       * Delete for me means
       * this user should no longer
       * access the attachment either.
       */
      const deletedForCurrentUser =
        (
          message.deletedFor ||
          []
        ).some(
          (deletedUserId) =>
            String(
              deletedUserId,
            ) ===
            String(userId),
        );

      if (
        deletedForCurrentUser
      ) {
        return res.status(404).json({
          message:
            "File not found",
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

      if (
        !fs.existsSync(filePath)
      ) {
        return res.status(404).json({
          message:
            "File not found",
        });
      }

      return res.download(
        filePath,

        message.originalFileName ||
          path.basename(
            filePath,
          ),
      );
    } catch (error) {
      console.error(
        "Download file error:",
        error,
      );

      return res.status(500).json({
        message:
          "Download failed",
      });
    }
  };