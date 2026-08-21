import express from "express";

import {
  getChatRequests,
  sendChatRequest,
  acceptChatRequest,
  declineChatRequest,
  cancelChatRequest,
} from "../controllers/ChatRequestController.js";

import {
  verifyToken,
} from "../middlewares/AuthMiddleware.js";

const router = express.Router();

router.get(
  "/",
  verifyToken,
  getChatRequests,
);

router.post(
  "/send/:recipientId",
  verifyToken,
  sendChatRequest,
);

router.patch(
  "/accept/:requestId",
  verifyToken,
  acceptChatRequest,
);

router.patch(
  "/decline/:requestId",
  verifyToken,
  declineChatRequest,
);

router.delete(
  "/cancel/:requestId",
  verifyToken,
  cancelChatRequest,
);

export default router;