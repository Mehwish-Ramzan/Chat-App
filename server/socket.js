import { Server as SocketIOServer } from "socket.io";

import Message from "./models/MessagesModel.js";
import jwt from "jsonwebtoken";
import ChatRequest from "./models/ChatRequestModel.js";

import ConversationPreference from "./models/ConversationPreferenceModel.js";
import Channel from "./models/ChannelModel.js";
import ChannelMessage from "./models/ChannelMessageModel.js";


const makePairKey = (userOne, userTwo) => {
  return [String(userOne), String(userTwo)].sort().join(":");
};

const getCookieValue = (cookieHeader, cookieName) => {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";");

  for (const cookieItem of cookies) {
    const trimmedCookie = cookieItem.trim();

    if (trimmedCookie.startsWith(`${cookieName}=`)) {
      return decodeURIComponent(
        trimmedCookie.slice(cookieName.length + 1),
      );
    }
  }

  return null;
};

const setupSocket = (server) => {
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    process.env.CLIENT_URL,
  ].filter(Boolean);

  const io = new SocketIOServer(server, {
    cors: {
      origin: allowedOrigins,

      methods: ["GET", "POST"],

      credentials: true,
    },
  });

  /*
   * SOCKET AUTHENTICATION
   *
   * User ID now comes from the
   * verified JWT cookie.
   *
   * We do NOT trust a userId
   * supplied by the frontend.
   */
  io.use((socket, next) => {
    try {
     const cookies = cookie.parse(socket.request.headers.cookie || "");

      const token = cookies.jwt;

      if (!token) {
        return next(
          new Error(
            "Authentication required",
          ),
        );
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET,
      );

      if (!decoded?.id) {
        return next(
          new Error(
            "Invalid authentication token",
          ),
        );
      }

      socket.userId = String(
        decoded.id,
      );

      next();
    } catch (error) {
      console.error(
        "Socket authentication failed:",
        error.message,
      );

      next(
        new Error(
          "Authentication failed",
        ),
      );
    }
  });

  const userSocketMap =
    new Map();

  const removeDisconnectedSocket = (
    socket,
  ) => {
    for (
      const [
        userId,
        socketId,
      ] of userSocketMap.entries()
    ) {
      if (
        socketId ===
        socket.id
      ) {
        userSocketMap.delete(
          userId,
        );

        break;
      }
    }
  };

  io.on(
    "connection",
    (socket) => {
      /*
       * IMPORTANT:
       *
       * This userId was already
       * verified by io.use().
       *
       * Do NOT use:
       *
       * socket.handshake.query.userId
       */
      const userId =
        socket.userId;

      if (!userId) {
        console.error(
          "Socket connection rejected: authenticated user ID missing",
        );

        socket.disconnect(
          true,
        );

        return;
      }

      const normalizedUserId =
        String(userId);

      userSocketMap.set(
        normalizedUserId,
        socket.id,
      );

      /*
       * TELL EVERYONE WHO IS ONLINE
       */
      io.emit(
        "onlineUsers",
        Array.from(
          userSocketMap.keys(),
        ),
      );

      /*
       * TYPING
       */
      socket.on(
        "typing",
        ({ recipient }) => {
          if (!recipient) {
            return;
          }

          const recipientSocketId =
            userSocketMap.get(
              String(
                recipient,
              ),
            );

          if (
            recipientSocketId
          ) {
            io.to(
              recipientSocketId,
            ).emit(
              "typing",
              {
                sender:
                  normalizedUserId,
              },
            );
          }
        },
      );

      /*
       * STOP TYPING
       */
      socket.on(
        "stopTyping",
        ({ recipient }) => {
          if (!recipient) {
            return;
          }

          const recipientSocketId =
            userSocketMap.get(
              String(
                recipient,
              ),
            );

          if (
            recipientSocketId
          ) {
            io.to(
              recipientSocketId,
            ).emit(
              "stopTyping",
              {
                sender:
                  normalizedUserId,
              },
            );
          }
        },
      );

      /*
       * MARK READ
       */
      socket.on(
        "markMessagesRead",
        async ({
          senderId,
        }) => {
          try {
            if (!senderId) {
              return;
            }

            await Message.updateMany(
              {
                sender:
                  senderId,

                recipient:
                  normalizedUserId,

                readBy: {
                  $ne:
                    normalizedUserId,
                },
              },

              {
                $addToSet: {
                  readBy:
                    normalizedUserId,
                },
              },
            );

            const senderSocketId =
              userSocketMap.get(
                String(
                  senderId,
                ),
              );

            if (
              senderSocketId
            ) {
              io.to(
                senderSocketId,
              ).emit(
                "messagesRead",
                {
                  readerId:
                    normalizedUserId,
                },
              );
            }
          } catch (error) {
            console.error(
              "markMessagesRead error:",
              error,
            );
          }
        },
      );

      /*
       * SEND MESSAGE
       */
      socket.on(
        "sendMessage",
        async (
          messageData,
          callback,
        ) => {
          try {
            const {
              recipient,

              content = "",

              messageType =
                "text",

              fileUrl = null,

              originalFileName =
                null,

              mimeType = null,

              fileSize = null,
            } =
              messageData;

            if (
              !recipient
            ) {
              throw new Error(
                "Recipient ID is required",
              );
            }

            if (
              String(
                recipient,
              ) ===
              normalizedUserId
            ) {
              throw new Error(
                "You cannot message yourself",
              );
            }

            if (
              messageType ===
                "text" &&
              !content?.trim()
            ) {
              throw new Error(
                "Message content is required",
              );
            }

            /*
             * OLD conversation?
             * Allow without a new
             * request.
             */
            const existingConversation =
              await Message.exists(
                {
                  $or: [
                    {
                      sender:
                        normalizedUserId,

                      recipient,
                    },

                    {
                      sender:
                        recipient,

                      recipient:
                        normalizedUserId,
                    },
                  ],
                },
              );

            /*
             * Completely new pair
             * requires accepted
             * request.
             */
            if (
              !existingConversation
            ) {
              const pairKey =
                makePairKey(
                  normalizedUserId,
                  recipient,
                );

              const acceptedRequest =
                await ChatRequest.findOne(
                  {
                    pairKey,

                    status:
                      "accepted",
                  },
                );

              if (
                !acceptedRequest
              ) {
                throw new Error(
                  "Chat request must be accepted before messaging",
                );
              }
            }

            const createdMessage =
              await Message.create(
                {
                  sender:
                    normalizedUserId,

                  recipient,

                  content:
                    content?.trim?.() ||
                    "",

                  messageType,

                  fileUrl,

                  originalFileName,

                  mimeType,

                  fileSize,
                },
              );

            /*
             * New message makes
             * previously hidden chat
             * visible again.
             */
            await Promise.all(
              [
                ConversationPreference.findOneAndUpdate(
                  {
                    user:
                      normalizedUserId,

                    contact:
                      recipient,
                  },

                  {
                    $set: {
                      hidden:
                        false,
                    },
                  },

                  {
                    upsert:
                      true,
                    new: true,
                  },
                ),

                ConversationPreference.findOneAndUpdate(
                  {
                    user:
                      recipient,

                    contact:
                      normalizedUserId,
                  },

                  {
                    $set: {
                      hidden:
                        false,
                    },
                  },

                  {
                    upsert:
                      true,
                    new: true,
                  },
                ),
              ],
            );

            const populatedMessage =
              await Message.findById(
                createdMessage._id,
              )
                .populate(
                  "sender",
                  "_id email firstName lastName image color",
                )

                .populate(
                  "recipient",
                  "_id email firstName lastName image color",
                );

            if (
              !populatedMessage
            ) {
              throw new Error(
                "Created message could not be loaded",
              );
            }

            const senderSocketId =
              userSocketMap.get(
                normalizedUserId,
              );

            const recipientSocketId =
              userSocketMap.get(
                String(
                  recipient,
                ),
              );

            if (
              recipientSocketId
            ) {
              io.to(
                recipientSocketId,
              ).emit(
                "receiveMessage",
                populatedMessage,
              );
            }

            if (
              senderSocketId &&
              senderSocketId !==
                recipientSocketId
            ) {
              io.to(
                senderSocketId,
              ).emit(
                "receiveMessage",
                populatedMessage,
              );
            }

            callback?.({
              success: true,

              message:
                populatedMessage,
            });
          } catch (error) {
            console.error(
              "sendMessage error:",
              error,
            );

            callback?.({
              success: false,

              error:
                error.message,
            });
          }
        },
      );

      /*
       * SEND UPDATED MESSAGE
       * TO BOTH USERS
       */
      const emitUpdatedMessage =
        async (
          messageId,
        ) => {
          const updatedMessage =
            await Message.findById(
              messageId,
            )
              .populate(
                "sender",
                "_id email firstName lastName image color",
              )

              .populate(
                "recipient",
                "_id email firstName lastName image color",
              );

          if (
            !updatedMessage
          ) {
            throw new Error(
              "Message not found",
            );
          }

          const senderId =
            String(
              updatedMessage
                .sender._id,
            );

          const recipientId =
            String(
              updatedMessage
                .recipient._id,
            );

          const senderSocketId =
            userSocketMap.get(
              senderId,
            );

          const recipientSocketId =
            userSocketMap.get(
              recipientId,
            );

          if (
            senderSocketId
          ) {
            io.to(
              senderSocketId,
            ).emit(
              "messageUpdated",
              updatedMessage,
            );
          }

          if (
            recipientSocketId &&
            recipientSocketId !==
              senderSocketId
          ) {
            io.to(
              recipientSocketId,
            ).emit(
              "messageUpdated",
              updatedMessage,
            );
          }

          return updatedMessage;
        };

      /*
       * EDIT
       */
      socket.on(
        "editMessage",
        async (
          {
            messageId,
            content,
          },

          callback,
        ) => {
          try {
            const trimmedContent =
              content?.trim();

            if (
              !messageId
            ) {
              throw new Error(
                "Message ID is required",
              );
            }

            if (
              !trimmedContent
            ) {
              throw new Error(
                "Message cannot be empty",
              );
            }

            const message =
              await Message.findById(
                messageId,
              );

            if (!message) {
              throw new Error(
                "Message not found",
              );
            }

            if (
              String(
                message.sender,
              ) !==
              normalizedUserId
            ) {
              throw new Error(
                "You can only edit your own messages",
              );
            }

            if (
              message.messageType !==
              "text"
            ) {
              throw new Error(
                "Only text messages can be edited",
              );
            }

            if (
              message.isDeleted
            ) {
              throw new Error(
                "Deleted messages cannot be edited",
              );
            }

            message.content =
              trimmedContent;

            message.editedAt =
              new Date();

            await message.save();

            const updatedMessage =
              await emitUpdatedMessage(
                messageId,
              );

            callback?.({
              success: true,

              message:
                updatedMessage,
            });
          } catch (error) {
            console.error(
              "editMessage error:",
              error,
            );

            callback?.({
              success: false,

              error:
                error.message,
            });
          }
        },
      );

      /*
       * DELETE
       */
      socket.on(
        "deleteMessage",
        async (
          { messageId },

          callback,
        ) => {
          try {
            if (
              !messageId
            ) {
              throw new Error(
                "Message ID is required",
              );
            }

            const message =
              await Message.findById(
                messageId,
              );

            if (!message) {
              throw new Error(
                "Message not found",
              );
            }

            if (
              String(
                message.sender,
              ) !==
              normalizedUserId
            ) {
              throw new Error(
                "You can only delete your own messages",
              );
            }

            if (
              message.isDeleted
            ) {
              throw new Error(
                "Message is already deleted",
              );
            }

            message.isDeleted =
              true;

            /*
             * Do NOT clear content before save.
             *
             * Message remains soft-deleted
             * in database but disappears
             * from both users' UI.
             */
            await message.save();

            const updatedMessage =
              await emitUpdatedMessage(
                messageId,
              );

            callback?.({
              success: true,

              message:
                updatedMessage,
            });
          } catch (error) {
            console.error(
              "deleteMessage error:",
              error,
            );

            callback?.({
              success: false,

              error:
                error.message,
            });
          }
        },
      );

      /*
       * DELETE MESSAGE FOR CURRENT USER ONLY
       */
      socket.on(
        "deleteMessageForMe",
        async (
          { messageId },
          callback,
        ) => {
          try {
            if (
              !messageId
            ) {
              throw new Error(
                "Message ID is required",
              );
            }

            const message =
              await Message.findOne(
                {
                  _id:
                    messageId,

                  $or: [
                    {
                      sender:
                        normalizedUserId,
                    },

                    {
                      recipient:
                        normalizedUserId,
                    },
                  ],
                },
              );

            if (!message) {
              throw new Error(
                "Message not found",
              );
            }

            await Message.updateOne(
              {
                _id:
                  messageId,
              },

              {
                $addToSet: {
                  deletedFor:
                    normalizedUserId,
                },
              },
            );

            callback?.({
              success: true,

              messageId,
            });
          } catch (error) {
            console.error(
              "deleteMessageForMe error:",
              error,
            );

            callback?.({
              success: false,

              error:
                error.message,
            });
          }
        },
      );

      /*
       * SEND CHANNEL MESSAGE
       */
      socket.on(
        "sendChannelMessage",
        async (
          messageData,
          callback,
        ) => {
          try {
            const {
              channelId,
              content = "",
              messageType =
                "text",
              fileUrl = null,
              originalFileName =
                null,
              mimeType = null,
              fileSize = null,
            } =
              messageData;

            if (
              !channelId
            ) {
              throw new Error(
                "Channel ID is required",
              );
            }

            if (
              messageType ===
                "text" &&
              !content?.trim()
            ) {
              throw new Error(
                "Message content is required",
              );
            }

            /*
             * User MUST belong
             * to channel.
             */
            const channel =
              await Channel.findOne(
                {
                  _id:
                    channelId,

                  members:
                    normalizedUserId,
                },
              ).select(
                "_id members",
              );

            if (!channel) {
              throw new Error(
                "You are not a member of this channel",
              );
            }

            const createdMessage =
              await ChannelMessage.create(
                {
                  channel:
                    channelId,

                  sender:
                    normalizedUserId,

                  content:
                    content?.trim?.() ||
                    "",

                  messageType,

                  fileUrl,

                  originalFileName,

                  mimeType,

                  fileSize,
                },
              );

            const populatedMessage =
              await ChannelMessage.findById(
                createdMessage._id,
              )
                .populate(
                  "sender",
                  "_id email firstName lastName image color",
                )

                .populate(
                  "channel",
                  "_id name",
                );

            /*
             * Emit to every online
             * member.
             */
            for (
              const memberId of
              channel.members
            ) {
              const memberSocketId =
                userSocketMap.get(
                  String(
                    memberId,
                  ),
                );

              if (
                memberSocketId
              ) {
                io.to(
                  memberSocketId,
                ).emit(
                  "receiveChannelMessage",
                  populatedMessage,
                );
              }
            }

            callback?.({
              success: true,

              message:
                populatedMessage,
            });
          } catch (error) {
            console.error(
              "sendChannelMessage error:",
              error,
            );

            callback?.({
              success: false,

              error:
                error.message,
            });
          }
        },
      );

      /*
       * DELETE OWN CHANNEL MESSAGE
       */
      socket.on(
        "deleteChannelMessage",
        async (
          { messageId },
          callback,
        ) => {
          try {
            if (
              !messageId
            ) {
              throw new Error(
                "Message ID is required",
              );
            }

            const message =
              await ChannelMessage.findById(
                messageId,
              );

            if (!message) {
              throw new Error(
                "Channel message not found",
              );
            }

            /*
             * Only original sender
             * can delete for everyone.
             */
            if (
              String(
                message.sender,
              ) !==
              String(
                normalizedUserId,
              )
            ) {
              throw new Error(
                "You can only delete your own channel messages for everyone",
              );
            }

            if (
              message.isDeleted
            ) {
              throw new Error(
                "Message is already deleted",
              );
            }

            const channel =
              await Channel.findOne(
                {
                  _id:
                    message.channel,

                  members:
                    normalizedUserId,
                },
              ).select(
                "_id members",
              );

            if (!channel) {
              throw new Error(
                "You are not a member of this channel",
              );
            }

            /*
             * SOFT DELETE.
             *
             * Do NOT delete document.
             * Do NOT remove content before save.
             */
            message.isDeleted =
              true;

            await message.save();

            const updatedMessage =
              await ChannelMessage.findById(
                message._id,
              )
                .populate(
                  "sender",
                  "_id email firstName lastName image color",
                )
                .populate(
                  "channel",
                  "_id name",
                );

            /*
             * Tell every online
             * channel member.
             */
            for (
              const memberId of
              channel.members
            ) {
              const memberSocketId =
                userSocketMap.get(
                  String(
                    memberId,
                  ),
                );

              if (
                memberSocketId
              ) {
                io.to(
                  memberSocketId,
                ).emit(
                  "channelMessageUpdated",
                  updatedMessage,
                );
              }
            }

            callback?.({
              success: true,

              message:
                updatedMessage,
            });
          } catch (error) {
            console.error(
              "deleteChannelMessage error:",
              error,
            );

            callback?.({
              success: false,

              error:
                error.message,
            });
          }
        },
      );

      /*
       * DELETE CHANNEL MESSAGE
       * FOR CURRENT USER ONLY
       */
      socket.on(
        "deleteChannelMessageForMe",
        async (
          { messageId },
          callback,
        ) => {
          try {
            if (
              !messageId
            ) {
              throw new Error(
                "Message ID is required",
              );
            }

            const message =
              await ChannelMessage.findById(
                messageId,
              );

            if (!message) {
              throw new Error(
                "Channel message not found",
              );
            }

            /*
             * User must belong
             * to this channel.
             */
            const channel =
              await Channel.findOne(
                {
                  _id:
                    message.channel,

                  members:
                    normalizedUserId,
                },
              ).select(
                "_id",
              );

            if (!channel) {
              throw new Error(
                "You are not a member of this channel",
              );
            }

            await ChannelMessage.updateOne(
              {
                _id:
                  messageId,
              },

              {
                $addToSet: {
                  deletedFor:
                    normalizedUserId,
                },
              },
            );

            callback?.({
              success: true,

              messageId,
            });
          } catch (error) {
            console.error(
              "deleteChannelMessageForMe error:",
              error,
            );

            callback?.({
              success: false,

              error:
                error.message,
            });
          }
        },
      );

      /*
       * EMIT UPDATED CHANNEL MESSAGE
       */
      const emitUpdatedChannelMessage =
        async (
          messageId,
        ) => {
          const updatedMessage =
            await ChannelMessage.findById(
              messageId,
            )
              .populate(
                "sender",
                "_id email firstName lastName image color",
              )
              .populate(
                "channel",
                "_id name members",
              );

          if (
            !updatedMessage
          ) {
            throw new Error(
              "Channel message not found",
            );
          }

          const channel =
            await Channel.findById(
              updatedMessage
                .channel._id,
            ).select(
              "members",
            );

          if (!channel) {
            throw new Error(
              "Channel not found",
            );
          }

          for (
            const memberId of
            channel.members
          ) {
            const socketId =
              userSocketMap.get(
                String(
                  memberId,
                ),
              );

            if (socketId) {
              io.to(
                socketId,
              ).emit(
                "channelMessageUpdated",
                updatedMessage,
              );
            }
          }

          return updatedMessage;
        };

      /*
       * EDIT OWN CHANNEL MESSAGE
       */
      socket.on(
        "editChannelMessage",
        async (
          {
            messageId,
            content,
          },
          callback,
        ) => {
          try {
            const trimmedContent =
              content?.trim();

            if (
              !messageId
            ) {
              throw new Error(
                "Message ID is required",
              );
            }

            if (
              !trimmedContent
            ) {
              throw new Error(
                "Message cannot be empty",
              );
            }

            const message =
              await ChannelMessage.findById(
                messageId,
              );

            if (!message) {
              throw new Error(
                "Channel message not found",
              );
            }

            if (
              String(
                message.sender,
              ) !==
              normalizedUserId
            ) {
              throw new Error(
                "You can only edit your own channel messages",
              );
            }

            if (
              message.messageType !==
              "text"
            ) {
              throw new Error(
                "Only text messages can be edited",
              );
            }

            if (
              message.isDeleted
            ) {
              throw new Error(
                "Deleted messages cannot be edited",
              );
            }

            const channel =
              await Channel.findOne(
                {
                  _id:
                    message.channel,

                  members:
                    normalizedUserId,
                },
              ).select(
                "_id",
              );

            if (!channel) {
              throw new Error(
                "You are not a member of this channel",
              );
            }

            message.content =
              trimmedContent;

            message.editedAt =
              new Date();

            await message.save();

            const updatedMessage =
              await emitUpdatedChannelMessage(
                messageId,
              );

            callback?.({
              success: true,

              message:
                updatedMessage,
            });
          } catch (error) {
            console.error(
              "editChannelMessage error:",
              error,
            );

            callback?.({
              success: false,

              error:
                error.message,
            });
          }
        },
      );

      /*
       * DISCONNECT
       */
      socket.on(
        "disconnect",
        () => {
          removeDisconnectedSocket(
            socket,
          );

          io.emit(
            "onlineUsers",
            Array.from(
              userSocketMap.keys(),
            ),
          );
        },
      );
    },
  );

  return io;
};

export default setupSocket;