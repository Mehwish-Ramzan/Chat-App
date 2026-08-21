import EmojiPicker from "emoji-picker-react";

import { useEffect, useRef, useState } from "react";

import { GrAttachment } from "react-icons/gr";
import { IoSend } from "react-icons/io5";

import { RiEmojiStickerLine, RiCloseLine } from "react-icons/ri";

import { useAppStore } from "@/store";

import { useSocket } from "@/context/SocketContext";

import apiClient from "@/lib/api-client";

import { UPLOAD_MESSAGE_FILE_ROUTE } from "@/utils/constants";

const MessageBar = () => {
  const { selectedChatType, selectedChatData } = useAppStore();

  const socket = useSocket();

  const [message, setMessage] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);

  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const [uploadingFile, setUploadingFile] = useState(false);

  const emojiRef = useRef(null);

  const fileInputRef = useRef(null);

  const typingTimeoutRef = useRef(null);

  /*
   * Close emoji picker
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setEmojiPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /*
   * Stop DM typing when
   * switching conversation.
   *
   * Channel typing is not
   * implemented yet.
   */
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (
        socket?.connected &&
        selectedChatType === "contact" &&
        selectedChatData?._id
      ) {
        socket.emit("stopTyping", {
          recipient: selectedChatData._id,
        });
      }
    };
  }, [socket, selectedChatType, selectedChatData?._id]);

  const handleAddEmoji = (emojiData) => {
    setMessage((currentMessage) => currentMessage + emojiData.emoji);
  };

  /*
   * TYPING
   *
   * Keep current typing
   * behaviour for DMs only.
   */
  const handleMessageChange = (event) => {
    const value = event.target.value;

    setMessage(value);

    if (selectedChatType !== "contact") {
      return;
    }

    if (!socket?.connected || !selectedChatData?._id) {
      return;
    }

    if (!value.trim()) {
      socket.emit("stopTyping", {
        recipient: selectedChatData._id,
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = null;
      }

      return;
    }

    socket.emit("typing", {
      recipient: selectedChatData._id,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", {
        recipient: selectedChatData._id,
      });
    }, 1000);
  };

  /*
   * SELECT FILE ONLY.
   *
   * Does NOT automatically
   * upload or send.
   */
  const handleFileSelected = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSelectedFile(file);

    /*
     * Allows selecting same file
     * again later.
     */
    event.target.value = "";
  };

  /*
   * SEND THROUGH CORRECT
   * SOCKET EVENT.
   */
  const emitMessage = (payload) => {
    return new Promise((resolve, reject) => {
      if (!socket?.connected) {
        reject(new Error("Socket is not connected"));

        return;
      }

      const socketEvent =
        selectedChatType === "channel" ? "sendChannelMessage" : "sendMessage";

      socket.emit(socketEvent, payload, (response) => {
        if (response?.success) {
          resolve(response.message);
        } else {
          reject(new Error(response?.error || "Message could not be sent"));
        }
      });
    });
  };

  const handleSendMessage = async () => {
    const trimmedMessage = message.trim();

    /*
     * Allow:
     *
     * text
     * file
     * file + caption
     */
    if (!trimmedMessage && !selectedFile) {
      return;
    }

    /*
     * Both DM and Channel
     * are valid now.
     */
    if (!["contact", "channel"].includes(selectedChatType)) {
      console.error("No valid chat selected");

      return;
    }

    if (!selectedChatData?._id) {
      console.error("Selected chat ID is missing");

      return;
    }

    if (!socket?.connected) {
      console.error("Socket is not connected");

      return;
    }

    try {
      setUploadingFile(true);

      /*
       * Target differs:
       *
       * DM      -> recipient
       * Channel -> channelId
       */
      const destination =
        selectedChatType === "channel"
          ? {
              channelId: selectedChatData._id,
            }
          : {
              recipient: selectedChatData._id,
            };

      /*
       * FILE / IMAGE
       */
      if (selectedFile) {
        const formData = new FormData();

        formData.append("file", selectedFile);

        const response = await apiClient.post(
          UPLOAD_MESSAGE_FILE_ROUTE,
          formData,
        );

        const { fileUrl, originalFileName, mimeType, fileSize, messageType } =
          response.data;

        if (!fileUrl || !messageType) {
          throw new Error("Invalid upload response");
        }

        await emitMessage({
          ...destination,

          /*
           * Optional caption
           */
          content: trimmedMessage,

          messageType,

          fileUrl,

          originalFileName,

          mimeType,

          fileSize,
        });
      } else {
        /*
         * TEXT MESSAGE
         */
        await emitMessage({
          ...destination,

          content: trimmedMessage,

          messageType: "text",

          fileUrl: null,
        });
      }

      /*
       * DM typing ends after
       * message is sent.
       */
      if (selectedChatType === "contact") {
        socket.emit("stopTyping", {
          recipient: selectedChatData._id,
        });
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = null;
      }

      setMessage("");

      setSelectedFile(null);

      setEmojiPickerOpen(false);
    } catch (error) {
      console.error(
        "Send failed:",
        error.response?.data || error.message || error,
      );
    } finally {
      setUploadingFile(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      handleSendMessage();
    }
  };

  const sendDisabled =
    uploadingFile ||
    !socket?.connected ||
    !selectedChatData?._id ||
    (!message.trim() && !selectedFile);

  return (
    <div className="mb-3 mx-3 bg-[#1c1d25] px-5 py-3 rounded-xl flex flex-col gap-3">
      {/* FILE CONFIRMATION */}
      {selectedFile && (
        <div className="flex items-center justify-between gap-4 bg-[#2a2b33] px-4 py-3 rounded-lg">
          <div className="min-w-0">
            <p className="text-sm text-white truncate">{selectedFile.name}</p>

            <p className="text-xs text-neutral-500 mt-1">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSelectedFile(null)}
            disabled={uploadingFile}
            className="text-neutral-500 hover:text-white transition-colors"
          >
            <RiCloseLine className="text-xl" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-6">
        <div className="flex-1 flex bg-[#2a2b33] rounded-md items-center">
          <input
            type="text"
            className="p-5 bg-transparent rounded-md focus:border-none focus:outline-none text-white placeholder:text-neutral-500 flex-1"
            placeholder={
              selectedFile
                ? "Add a caption..."
                : selectedChatType === "channel"
                  ? `Message #${selectedChatData?.name || "channel"}`
                  : "Enter Message"
            }
            value={message}
            onChange={handleMessageChange}
            onKeyDown={handleKeyDown}
          />

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelected}
          />

          <button
            type="button"
            disabled={uploadingFile}
            onClick={() => fileInputRef.current?.click()}
            className="text-neutral-500 hover:text-white px-3 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <GrAttachment className="text-2xl" />
          </button>

          <div ref={emojiRef} className="relative">
            <button
              type="button"
              className="text-neutral-500 hover:text-white px-3"
              onClick={() => setEmojiPickerOpen((current) => !current)}
            >
              <RiEmojiStickerLine className="text-2xl" />
            </button>

            {emojiPickerOpen && (
              <div className="absolute bottom-14 right-0 z-50">
                <EmojiPicker onEmojiClick={handleAddEmoji} />
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSendMessage}
          disabled={sendDisabled}
          className="bg-[#8417ff] disabled:opacity-40 disabled:cursor-not-allowed rounded-md flex items-center justify-center p-5 hover:bg-[#741bda] transition-all"
        >
          <IoSend className="text-2xl text-white" />
        </button>
      </div>
    </div>
  );
};

export default MessageBar;
