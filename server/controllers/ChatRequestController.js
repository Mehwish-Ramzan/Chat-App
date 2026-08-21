import User from "../models/UserModel.js";
import ChatRequest from "../models/ChatRequestModel.js";

const makePairKey = (
  firstUserId,
  secondUserId,
) => {
  return [
    String(firstUserId),
    String(secondUserId),
  ]
    .sort()
    .join(":");
};

/*
 * GET ALL PENDING REQUESTS
 * incoming + outgoing
 */
export const getChatRequests = async (
  req,
  res,
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const requests =
      await ChatRequest.find({
        status: "pending",

        $or: [
          {
            sender: userId,
          },
          {
            recipient: userId,
          },
        ],
      })
        .sort({
          updatedAt: -1,
        })

        .populate(
          "sender",
          "_id email username firstName lastName image color",
        )

        .populate(
          "recipient",
          "_id email username firstName lastName image color",
        );

    const incoming =
      requests.filter(
        (request) =>
          String(
            request.recipient?._id,
          ) === String(userId),
      );

    const outgoing =
      requests.filter(
        (request) =>
          String(
            request.sender?._id,
          ) === String(userId),
      );

    return res.status(200).json({
      incoming,
      outgoing,
    });
  } catch (error) {
    console.error(
      "Get chat requests error:",
      error,
    );

    return res.status(500).json({
      message:
        "Unable to get chat requests",
    });
  }
};

/*
 * SEND CHAT REQUEST
 */
export const sendChatRequest = async (
  req,
  res,
) => {
  try {
    console.log(
  "📨 sendChatRequest route HIT",
  {
    senderId:
      req.userId,

    recipientId:
      req.params.recipientId,
  },
);
    const senderId = req.userId;

    const { recipientId } =
      req.params;

    if (!senderId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!recipientId) {
      return res.status(400).json({
        message:
          "Recipient ID is required",
      });
    }

    if (
      String(senderId) ===
      String(recipientId)
    ) {
      return res.status(400).json({
        message:
          "You cannot send a chat request to yourself",
      });
    }

    const recipient =
      await User.findById(
        recipientId,
      ).select("_id");

    if (!recipient) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const pairKey = makePairKey(
      senderId,
      recipientId,
    );

    const existing =
      await ChatRequest.findOne({
        pairKey,
      });

    /*
     * Already accepted
     */
    if (
      existing?.status ===
      "accepted"
    ) {
      return res.status(409).json({
        message:
          "You can already chat with this user",
      });
    }

    /*
     * Request already pending
     */
    if (
      existing?.status ===
      "pending"
    ) {
      const sameDirection =
        String(existing.sender) ===
        String(senderId);

      return res.status(409).json({
        message: sameDirection
          ? "Request is already pending"
          : "This user has already sent you a chat request",
      });
    }

    let chatRequest;

    /*
     * Re-use declined request
     */
    if (existing) {
      existing.sender =
        senderId;

      existing.recipient =
        recipientId;

      existing.status =
        "pending";

      chatRequest =
        await existing.save();
    } else {
      chatRequest =
        await ChatRequest.create({
          pairKey,

          sender: senderId,

          recipient:
            recipientId,

          status: "pending",
        });
    }

    return res.status(201).json({
      message:
        "Chat request sent",

      request: chatRequest,
    });
  } catch (error) {
    console.error(
      "Send chat request error:",
      error,
    );

    return res.status(500).json({
      message:
        "Unable to send chat request",
    });
  }
};

/*
 * ACCEPT CHAT REQUEST
 */
export const acceptChatRequest =
  async (req, res) => {
    try {
      const userId = req.userId;

      const { requestId } =
        req.params;

      if (!userId) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      const request =
        await ChatRequest.findOne({
          _id: requestId,

          recipient: userId,

          status: "pending",
        });

      if (!request) {
        return res.status(404).json({
          message:
            "Pending chat request not found",
        });
      }

      request.status =
        "accepted";

      await request.save();

      const populatedRequest =
        await ChatRequest.findById(
          request._id,
        )
          .populate(
            "sender",
            "_id email username firstName lastName image color",
          )
          .populate(
            "recipient",
            "_id email username firstName lastName image color",
          );

      return res.status(200).json({
        message:
          "Chat request accepted",

        request:
          populatedRequest,
      });
    } catch (error) {
      console.error(
        "Accept chat request error:",
        error,
      );

      return res.status(500).json({
        message:
          "Unable to accept chat request",
      });
    }
  };

/*
 * DECLINE CHAT REQUEST
 */
export const declineChatRequest =
  async (req, res) => {
    try {
      const userId = req.userId;

      const { requestId } =
        req.params;

      if (!userId) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      const request =
        await ChatRequest.findOne({
          _id: requestId,

          recipient: userId,

          status: "pending",
        });

      if (!request) {
        return res.status(404).json({
          message:
            "Pending chat request not found",
        });
      }

      request.status =
        "declined";

      await request.save();

      return res.status(200).json({
        message:
          "Chat request declined",
      });
    } catch (error) {
      console.error(
        "Decline chat request error:",
        error,
      );

      return res.status(500).json({
        message:
          "Unable to decline chat request",
      });
    }
  };

/*
 * CANCEL OUTGOING REQUEST
 */
export const cancelChatRequest =
  async (req, res) => {
    try {
      const userId = req.userId;

      const { requestId } =
        req.params;

      if (!userId) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      const request =
        await ChatRequest.findOne({
          _id: requestId,

          sender: userId,

          status: "pending",
        });

      if (!request) {
        return res.status(404).json({
          message:
            "Pending chat request not found",
        });
      }

      await request.deleteOne();

      return res.status(200).json({
        message:
          "Chat request cancelled",
      });
    } catch (error) {
      console.error(
        "Cancel chat request error:",
        error,
      );

      return res.status(500).json({
        message:
          "Unable to cancel chat request",
      });
    }
  };