import express from "express";

import {
  getMessages,
  getUserContacts,
  uploadMessageFile,
  downloadMessageFile,
  hideConversation,
  clearConversation,
} from "../controllers/MessagesController.js";

import messageUpload from "../middlewares/MessageUploadMiddleware.js";

import {
  verifyToken,
} from "../middlewares/AuthMiddleware.js";

const router = express.Router();

/*
 * SIDEBAR CONTACTS
 */
router.get(
  "/contacts",
  verifyToken,
  getUserContacts,
);

/*
 * CLEAR / HIDE CONVERSATION
 *
 * IMPORTANT:
 * Dynamic /:contactId route se
 * PEHLE ye routes hone chahiye.
 */
router.patch(
  "/conversation/:contactId/clear",
  verifyToken,
  clearConversation,
);

router.patch(
  "/conversation/:contactId/hide",
  verifyToken,
  hideConversation,
);

/*
 * FILE UPLOAD
 */
router.post(
  "/upload",
  verifyToken,
  messageUpload.single("file"),
  uploadMessageFile,
);

/*
 * FILE DOWNLOAD
 */
router.get(
  "/download/:messageId",
  verifyToken,
  downloadMessageFile,
);

/*
 * CHAT HISTORY
 * KEEP THIS LAST.
 */
router.get(
  "/:contactId",
  verifyToken,
  getMessages,
);

export default router;