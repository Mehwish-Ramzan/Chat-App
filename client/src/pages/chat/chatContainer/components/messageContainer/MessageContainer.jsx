import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  BsThreeDotsVertical,
} from "react-icons/bs";

import {
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiX,
} from "react-icons/fi";

import { useAppStore } from "@/store";

import apiClient from "@/lib/api-client";

import {
  useSocket,
} from "@/context/SocketContext";

import {
  HOST,
  GET_MESSAGES_ROUTE,
  DOWNLOAD_MESSAGE_ROUTE,
  DOWNLOAD_CHANNEL_FILE_ROUTE,
} from "@/utils/constants";

import ConfirmModal from "@/components/ConfirmModal";

const MessageContainer = () => {
  const {
    selectedChatMessages,
    selectedChatData,
    selectedChatType,
    setSelectedChatMessages,
    userInfo,
    typingUsers,
    removeMessage,
  } = useAppStore();

  const socket = useSocket();

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    openMenuId,
    setOpenMenuId,
  ] = useState(null);

  const [
    editingMessageId,
    setEditingMessageId,
  ] = useState(null);

  const [
    editValue,
    setEditValue,
  ] = useState("");

  const [
    deleteTarget,
    setDeleteTarget,
  ] = useState(null);

  const bottomRef =
    useRef(null);

  const currentUserId =
    userInfo?._id ??
    userInfo?.id;

  const selectedUserId =
    selectedChatData?._id ??
    selectedChatData?.id;

  const isSelectedUserTyping =
    selectedChatType === "contact" &&
    selectedUserId &&
    (typingUsers || []).includes(
      String(selectedUserId),
    );

  /*
   * LOAD DM / CHANNEL HISTORY
   */
  useEffect(() => {
    const loadMessages =
      async () => {
        if (
          !selectedChatData?._id ||
          ![
            "contact",
            "channel",
          ].includes(
            selectedChatType,
          )
        ) {
          return;
        }

        try {
          setLoading(true);

          setSelectedChatMessages(
            [],
          );

          let response;

          if (
            selectedChatType ===
            "contact"
          ) {
            response =
              await apiClient.get(
                `${GET_MESSAGES_ROUTE}/${selectedChatData._id}`,
              );
          } else {
            response =
              await apiClient.get(
                `/api/channels/${selectedChatData._id}/messages`,
              );
          }

          setSelectedChatMessages(
            response.data.messages ||
              [],
          );
        } catch (error) {
          console.error(
            "Unable to load messages:",
            error,
          );

          setSelectedChatMessages(
            [],
          );
        } finally {
          setLoading(false);
        }
      };

    loadMessages();
  }, [
    selectedChatData?._id,
    selectedChatType,
    setSelectedChatMessages,
  ]);

  /*
   * DM READ RECEIPTS ONLY
   */
  useEffect(() => {
    const markCurrentChatAsRead =
      () => {
        if (
          selectedChatType !==
            "contact" ||
          !selectedChatData?._id ||
          !socket?.connected ||
          loading
        ) {
          return;
        }

        const isViewingApp =
          document.visibilityState ===
            "visible" &&
          document.hasFocus();

        if (!isViewingApp) {
          return;
        }

        socket.emit(
          "markMessagesRead",
          {
            senderId:
              selectedChatData._id,
          },
        );
      };

    markCurrentChatAsRead();

    const handleVisibilityChange =
      () => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          markCurrentChatAsRead();
        }
      };

    const handleWindowFocus =
      () => {
        markCurrentChatAsRead();
      };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    window.addEventListener(
      "focus",
      handleWindowFocus,
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );

      window.removeEventListener(
        "focus",
        handleWindowFocus,
      );
    };
  }, [
    socket,
    selectedChatData?._id,
    selectedChatType,
    loading,
    selectedChatMessages.length,
  ]);

  /*
   * AUTO SCROLL
   */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [
    selectedChatMessages,
  ]);

  /*
   * CLOSE MENU WHEN
   * CLICKING OUTSIDE
   */
  useEffect(() => {
    if (!openMenuId) {
      return;
    }

    const handleOutsideClick =
      (event) => {
        const inside =
          event.target.closest(
            "[data-message-menu]",
          );

        if (!inside) {
          setOpenMenuId(null);
        }
      };

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
    };
  }, [
    openMenuId,
  ]);

  /*
   * RESET LOCAL MESSAGE STATE
   * WHEN CHAT CHANGES
   */
  useEffect(() => {
    setOpenMenuId(null);

    setEditingMessageId(null);

    setEditValue("");

    setDeleteTarget(null);
  }, [
    selectedChatData?._id,
    selectedChatType,
  ]);

  /*
   * DOWNLOAD DM / CHANNEL FILE
   */
  const downloadFile =
    async (message) => {
      try {
        const downloadUrl =
          selectedChatType ===
          "channel"
            ? `${DOWNLOAD_CHANNEL_FILE_ROUTE}/${message._id}`
            : `${DOWNLOAD_MESSAGE_ROUTE}/${message._id}`;

        const response =
          await apiClient.get(
            downloadUrl,
            {
              responseType:
                "blob",
            },
          );

        const blobUrl =
          window.URL.createObjectURL(
            response.data,
          );

        const anchor =
          document.createElement(
            "a",
          );

        anchor.href =
          blobUrl;

        anchor.download =
          message.originalFileName ||
          "download";

        document.body.appendChild(
          anchor,
        );

        anchor.click();

        anchor.remove();

        window.URL.revokeObjectURL(
          blobUrl,
        );
      } catch (error) {
        console.error(
          "Download failed:",
          error,
        );
      }
    };

  /*
   * START EDIT
   *
   * Own DM text
   * Own channel text
   */
  const startEditing =
    (message) => {
      const senderId =
        message.sender?._id ??
        message.sender;

      if (
        String(senderId) !==
        String(currentUserId)
      ) {
        return;
      }

      if (
        message.messageType !==
          "text" ||
        message.isDeleted
      ) {
        return;
      }

      setEditingMessageId(
        message._id,
      );

      setEditValue(
        message.content || "",
      );

      setOpenMenuId(null);
    };

  const cancelEditing = () => {
    setEditingMessageId(null);

    setEditValue("");
  };

  /*
   * SAVE DM / CHANNEL EDIT
   */
  const saveEditedMessage =
    (message) => {
      const trimmedValue =
        editValue.trim();

      if (
        !trimmedValue ||
        !socket?.connected
      ) {
        return;
      }

      const eventName =
        selectedChatType ===
        "channel"
          ? "editChannelMessage"
          : "editMessage";

      socket.emit(
        eventName,

        {
          messageId:
            message._id,

          content:
            trimmedValue,
        },

        (response) => {
          if (
            !response?.success
          ) {
            console.error(
              "Edit failed:",
              response?.error,
            );

            return;
          }

          setEditingMessageId(
            null,
          );

          setEditValue("");
        },
      );
    };

  /*
   * DM DELETE FOR EVERYONE
   */
  const deleteMessageForEveryone =
    (message) => {
      if (!socket?.connected) {
        return;
      }

      socket.emit(
        "deleteMessage",

        {
          messageId:
            message._id,
        },

        (response) => {
          if (
            !response?.success
          ) {
            console.error(
              "Delete failed:",
              response?.error,
            );

            return;
          }

          setDeleteTarget(
            null,
          );
        },
      );
    };

  /*
   * DM DELETE FOR ME
   */
  const deleteMessageForMe =
    (message) => {
      if (!socket?.connected) {
        return;
      }

      socket.emit(
        "deleteMessageForMe",

        {
          messageId:
            message._id,
        },

        (response) => {
          if (
            !response?.success
          ) {
            console.error(
              "Delete for me failed:",
              response?.error,
            );

            return;
          }

          removeMessage(
            message._id,
          );

          setDeleteTarget(
            null,
          );
        },
      );
    };

  /*
   * CHANNEL DELETE FOR EVERYONE
   *
   * IMPORTANT:
   * Do NOT remove locally.
   *
   * channelMessageUpdated will
   * update isDeleted=true and show
   * "This message was deleted".
   */
  const deleteChannelMessageForEveryone =
    (message) => {
      if (!socket?.connected) {
        return;
      }

      socket.emit(
        "deleteChannelMessage",

        {
          messageId:
            message._id,
        },

        (response) => {
          if (
            !response?.success
          ) {
            console.error(
              "Channel delete for everyone failed:",
              response?.error,
            );

            return;
          }

          setDeleteTarget(
            null,
          );
        },
      );
    };

  /*
   * CHANNEL DELETE FOR ME
   */
  const deleteChannelMessageForMe =
    (message) => {
      if (!socket?.connected) {
        return;
      }

      socket.emit(
        "deleteChannelMessageForMe",

        {
          messageId:
            message._id,
        },

        (response) => {
          if (
            !response?.success
          ) {
            console.error(
              "Channel delete for me failed:",
              response?.error,
            );

            return;
          }

          removeMessage(
            message._id,
          );

          setDeleteTarget(
            null,
          );
        },
      );
    };

  const deleteTargetSenderId =
    deleteTarget?.sender?._id ??
    deleteTarget?.sender;

  const deleteTargetIsOwn =
    Boolean(deleteTarget) &&
    String(
      deleteTargetSenderId,
    ) ===
      String(currentUserId);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-neutral-500">
        Loading messages...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 px-8 md:w-[65vw] lg:w-[70vw] xl:w-[80vw] w-full">
      <div className="flex flex-col gap-3">
        {selectedChatMessages.map(
          (message) => {
            const senderId =
              message.sender?._id ??
              message.sender;

            const senderName =
              message.sender
                ?.firstName ||
              message.sender
                ?.lastName
                ? `${message.sender?.firstName ?? ""} ${
                    message.sender?.lastName ??
                    ""
                  }`.trim()
                : message.sender
                    ?.email ||
                  "User";

            const isOwnMessage =
              String(
                senderId,
              ) ===
              String(
                currentUserId,
              );

            const fileSource =
              message.fileUrl
                ? `${HOST}${message.fileUrl}`
                : null;

            /*
             * DM READ RECEIPT
             */
            const readByIds =
              (
                message.readBy ||
                []
              ).map((id) =>
                String(
                  id?._id ??
                    id,
                ),
              );

            const recipientId =
              String(
                message
                  .recipient
                  ?._id ??
                  message
                    .recipient ??
                  "",
              );

            const isRead =
              selectedChatType ===
                "contact" &&
              isOwnMessage &&
              readByIds.includes(
                recipientId,
              );

            const isEditing =
              String(
                editingMessageId,
              ) ===
              String(
                message._id,
              );

            /*
             * BOTH DM AND CHANNEL
             * messages get a menu.
             *
             * Own:
             * Edit + Delete
             *
             * Received:
             * Delete
             */
            const canShowMenu =
              selectedChatType ===
                "contact" ||
              selectedChatType ===
                "channel";

            const menuOpen =
              String(
                openMenuId,
              ) ===
              String(
                message._id,
              );

            return (
              <div
                key={
                  message._id
                }
                className={`flex ${
                  isOwnMessage
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div className="relative group max-w-[70%]">
                  {/* THREE DOT BUTTON */}
                  {!message.isDeleted &&
                    canShowMenu && (
                      <button
                        type="button"
                        data-message-menu
                        onClick={(
                          event,
                        ) => {
                          event.stopPropagation();

                          setOpenMenuId(
                            menuOpen
                              ? null
                              : message._id,
                          );
                        }}
                        className={`absolute top-2 opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-white transition ${
                          isOwnMessage
                            ? "-left-8"
                            : "-right-8"
                        }`}
                      >
                        <BsThreeDotsVertical />
                      </button>
                    )}

                  {/* THREE DOT MENU */}
                  {menuOpen &&
                    !message.isDeleted &&
                    canShowMenu && (
                      <div
                        data-message-menu
                        onClick={(
                          event,
                        ) =>
                          event.stopPropagation()
                        }
                        className={`absolute top-0 z-30 min-w-[160px] rounded-lg border border-[#3a3b45] bg-[#20212a] shadow-xl overflow-hidden ${
                          isOwnMessage
                            ? "right-full mr-2"
                            : "left-full ml-2"
                        }`}
                      >
                        {/* OWN TEXT EDIT */}
                        {isOwnMessage &&
                          message.messageType ===
                            "text" && (
                            <button
                              type="button"
                              onClick={() =>
                                startEditing(
                                  message,
                                )
                              }
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left text-white hover:bg-[#2c2d36] transition-colors"
                            >
                              <FiEdit2 />

                              Edit
                            </button>
                          )}

                        {/* DELETE */}
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteTarget(
                              message,
                            );

                            setOpenMenuId(
                              null,
                            );
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 text-left hover:bg-[#2c2d36] transition-colors"
                        >
                          <FiTrash2 />

                          Delete
                        </button>
                      </div>
                    )}

                  {/* MESSAGE BUBBLE */}
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      isOwnMessage
                        ? "bg-[#8417ff] text-white"
                        : "bg-[#2a2b33] text-white"
                    }`}
                  >
                    {/* CHANNEL SENDER */}
                    {selectedChatType ===
                      "channel" &&
                      !isOwnMessage && (
                        <p className="text-xs text-purple-300 font-medium mb-1">
                          {
                            senderName
                          }
                        </p>
                      )}

                    {/* SOFT DELETED */}
                    {message.isDeleted ? (
                      <p className="italic text-sm opacity-70">
                        This message was deleted
                      </p>
                    ) : (
                      <>
                        {/* EDIT MODE */}
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              autoFocus
                              value={
                                editValue
                              }
                              onChange={(
                                event,
                              ) =>
                                setEditValue(
                                  event
                                    .target
                                    .value,
                                )
                              }
                              onKeyDown={(
                                event,
                              ) => {
                                if (
                                  event.key ===
                                  "Enter"
                                ) {
                                  event.preventDefault();

                                  saveEditedMessage(
                                    message,
                                  );
                                }

                                if (
                                  event.key ===
                                  "Escape"
                                ) {
                                  cancelEditing();
                                }
                              }}
                              className="bg-black/20 rounded-md px-3 py-2 outline-none min-w-[200px]"
                            />

                            <button
                              type="button"
                              onClick={() =>
                                saveEditedMessage(
                                  message,
                                )
                              }
                              className="hover:opacity-70"
                            >
                              <FiCheck />
                            </button>

                            <button
                              type="button"
                              onClick={
                                cancelEditing
                              }
                              className="hover:opacity-70"
                            >
                              <FiX />
                            </button>
                          </div>
                        ) : (
                          <>
                            {/* TEXT */}
                            {message.messageType ===
                              "text" && (
                              <p className="break-words">
                                {
                                  message.content
                                }
                              </p>
                            )}

                            {/* IMAGE */}
                            {message.messageType ===
                              "image" &&
                              fileSource && (
                                <div className="flex flex-col gap-2">
                                  <img
                                    src={
                                      fileSource
                                    }
                                    alt={
                                      message.originalFileName ||
                                      "Shared image"
                                    }
                                    className="max-w-[350px] max-h-[350px] rounded-md object-cover"
                                  />

                                  <button
                                    type="button"
                                    onClick={() =>
                                      downloadFile(
                                        message,
                                      )
                                    }
                                    className="text-xs underline text-left"
                                  >
                                    Download image
                                  </button>
                                </div>
                              )}

                            {/* FILE / VIDEO */}
                            {(message.messageType ===
                              "file" ||
                              message.messageType ===
                                "video") && (
                              <button
                                type="button"
                                onClick={() =>
                                  downloadFile(
                                    message,
                                  )
                                }
                                className="flex flex-col text-left"
                              >
                                <span className="font-medium">
                                  📎{" "}
                                  {message.originalFileName ||
                                    "Download file"}
                                </span>

                                {message.fileSize && (
                                  <span className="text-xs opacity-70">
                                    {(
                                      message.fileSize /
                                      1024 /
                                      1024
                                    ).toFixed(
                                      2,
                                    )}{" "}
                                    MB
                                  </span>
                                )}
                              </button>
                            )}

                            {/* CAPTION */}
                            {message.messageType !==
                              "text" &&
                              message.content && (
                                <p className="mt-2 break-words">
                                  {
                                    message.content
                                  }
                                </p>
                              )}
                          </>
                        )}
                      </>
                    )}

                    {/* TIME / EDITED / DM TICKS */}
                    {message.createdAt && (
                      <div className="mt-1 flex items-center justify-end gap-1 text-xs text-neutral-300">
                        {!message.isDeleted &&
                          message.editedAt && (
                            <span className="opacity-70">
                              edited
                            </span>
                          )}

                        <span>
                          {new Date(
                            message.createdAt,
                          ).toLocaleTimeString(
                            [],
                            {
                              hour:
                                "2-digit",

                              minute:
                                "2-digit",
                            },
                          )}
                        </span>

                        {/* DM ONLY */}
                        {selectedChatType ===
                          "contact" &&
                          isOwnMessage &&
                          !message.isDeleted && (
                            <span
                              className={
                                isRead
                                  ? "text-blue-300"
                                  : "text-neutral-300"
                              }
                            >
                              {isRead
                                ? "✓✓"
                                : "✓"}
                            </span>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          },
        )}

        {/* DM TYPING INDICATOR */}
        {isSelectedUserTyping && (
          <div className="flex justify-start">
            <div className="bg-[#2a2b33] rounded-2xl px-4 py-3 flex items-center gap-1">
              <span className="typing-dot h-2 w-2 rounded-full bg-neutral-400" />

              <span className="typing-dot typing-dot-delay-1 h-2 w-2 rounded-full bg-neutral-400" />

              <span className="typing-dot typing-dot-delay-2 h-2 w-2 rounded-full bg-neutral-400" />
            </div>
          </div>
        )}

        <div
          ref={
            bottomRef
          }
        />
      </div>

      {/* DELETE MODAL */}
      <ConfirmModal
        open={
          Boolean(
            deleteTarget,
          )
        }

        onOpenChange={(
          value,
        ) => {
          if (!value) {
            setDeleteTarget(
              null,
            );
          }
        }}

        title={
          selectedChatType ===
          "channel"
            ? "Delete channel message?"
            : "Delete message?"
        }

        description={
          selectedChatType ===
          "channel"
            ? deleteTargetIsOwn
              ? "Delete this message only for yourself, or remove it for everyone in the channel."
              : "Delete this message from your view?"
            : deleteTargetIsOwn
              ? "Delete this message only for yourself, or remove it for everyone in the conversation."
              : "Delete this message from your view?"
        }

        cancelText="Cancel"

        secondaryText={
          deleteTargetIsOwn
            ? "Delete for me"
            : undefined
        }

        onSecondary={
          deleteTargetIsOwn
            ? () => {
                if (
                  !deleteTarget
                ) {
                  return;
                }

                if (
                  selectedChatType ===
                  "channel"
                ) {
                  deleteChannelMessageForMe(
                    deleteTarget,
                  );
                } else {
                  deleteMessageForMe(
                    deleteTarget,
                  );
                }
              }
            : undefined
        }

        confirmText={
          deleteTargetIsOwn
            ? "Delete for everyone"
            : "Delete for me"
        }

        destructive

        onConfirm={() => {
          if (!deleteTarget) {
            return;
          }

          /*
           * CHANNEL
           */
          if (
            selectedChatType ===
            "channel"
          ) {
            if (
              deleteTargetIsOwn
            ) {
              deleteChannelMessageForEveryone(
                deleteTarget,
              );
            } else {
              deleteChannelMessageForMe(
                deleteTarget,
              );
            }

            return;
          }

          /*
           * DM
           */
          if (
            deleteTargetIsOwn
          ) {
            deleteMessageForEveryone(
              deleteTarget,
            );
          } else {
            deleteMessageForMe(
              deleteTarget,
            );
          }
        }}
      />
    </div>
  );
};

export default MessageContainer;