import express from "express";

import {
  createChannel,
  getUserChannels,
  getChannel,
  getChannelMessages,
  downloadChannelFile,
  renameChannel,
  addChannelMember,
  removeChannelMember,
  leaveChannel,
  deleteChannel,
} from "../controllers/ChannelController.js";

import {
  verifyToken,
} from "../middlewares/AuthMiddleware.js";

const router = express.Router();

router.post(
  "/",
  verifyToken,
  createChannel,
);

router.get(
  "/",
  verifyToken,
  getUserChannels,
);

router.get(
  "/download/:messageId",
  verifyToken,
  downloadChannelFile,
);

router.patch(
  "/:channelId/name",
  verifyToken,
  renameChannel,
);

router.patch(
  "/:channelId/members/add",
  verifyToken,
  addChannelMember,
);

router.patch(
  "/:channelId/members/remove",
  verifyToken,
  removeChannelMember,
);

router.patch(
  "/:channelId/leave",
  verifyToken,
  leaveChannel,
);

router.delete(
  "/:channelId",
  verifyToken,
  deleteChannel,
);

router.get(
  "/:channelId/messages",
  verifyToken,
  getChannelMessages,
);

router.get(
  "/:channelId",
  verifyToken,
  getChannel,
);

export default router;