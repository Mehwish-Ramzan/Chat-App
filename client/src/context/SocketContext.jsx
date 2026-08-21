import { createContext, useContext, useEffect, useState } from "react";

import { io } from "socket.io-client";

import { useAppStore } from "@/store";

import { HOST } from "@/utils/constants.js";

const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  const userInfo = useAppStore((state) => state.userInfo);

  useEffect(() => {
    const userId = userInfo?._id || userInfo?.id;


    if (!userId) {
      setSocket(null);

      return;
    }

    const socketInstance = io(HOST, {
      withCredentials: true,

      reconnection: true,

      reconnectionAttempts: 10,

      reconnectionDelay: 1000,
    });

    setSocket(socketInstance);

    /*
     * CONNECT
     */
    const handleConnect = () => {
    
    };

    /*
     * DISCONNECT
     */
    const handleDisconnect = (reason) => {

      const { setOnlineUsers } = useAppStore.getState();

      setOnlineUsers([]);
    };

    /*
     * CONNECTION ERROR
     */
    const handleConnectError = (error) => {
      console.error("Socket connection error:", error.message);
    };

    /*
     * ONLINE USERS
     */
    const handleOnlineUsers = (users) => {
    

      const { setOnlineUsers } = useAppStore.getState();

      setOnlineUsers(users.map((id) => String(id)));
    };

    /*
     * USER STARTED TYPING
     */
    const handleTyping = ({ sender }) => {
      

      const { addTypingUser } = useAppStore.getState();

      addTypingUser(sender);
    };

    /*
     * USER STOPPED TYPING
     */
    const handleStopTyping = ({ sender }) => {
   

      const { removeTypingUser } = useAppStore.getState();

      removeTypingUser(sender);
    };

    /*
     * READ RECEIPTS
     */
    const handleMessagesRead = ({ readerId }) => {

      const { markMessagesReadByUser } = useAppStore.getState();

      markMessagesReadByUser(readerId);
    };

    /*
     * EDIT / DELETE MESSAGE
     */
    const handleMessageUpdated = (updatedMessage) => {

      const { updateMessage } = useAppStore.getState();

      /*
       * Edit OR Delete for everyone:
       * keep the message in the chat and update its state.
       *
       * If isDeleted is true, MessageContainer will show:
       * "This message was deleted"
       */
      updateMessage(updatedMessage);
    };
    /*
     * RECEIVE MESSAGE
     */
    const handleReceiveMessage = (message) => {

      const {
        selectedChatType,

        selectedChatData,

        addMessage,

        updateDirectMessageContact,

        removeTypingUser,
      } = useAppStore.getState();

      /*
       * Sidebar preview
       */
      updateDirectMessageContact(message, userId);

      const senderId = message.sender?._id || message.sender;

      /*
       * Message received,
       * therefore sender is
       * no longer typing.
       */
      if (String(senderId) !== String(userId)) {
        removeTypingUser(senderId);
      }

      /*
       * No conversation open
       */
      if (selectedChatType !== "contact" || !selectedChatData?._id) {
        return;
      }

      const selectedContactId = String(selectedChatData._id);

      const normalizedSenderId = String(senderId);

      const recipientId = String(message.recipient?._id || message.recipient);

      const belongsToSelectedChat =
        selectedContactId === normalizedSenderId ||
        selectedContactId === recipientId;

      if (!belongsToSelectedChat) {
        return;
      }

      /*
       * Add to currently
       * visible conversation
       */
      addMessage(message);

      /*
       * Mark read ONLY if user
       * is actually looking at
       * browser/app.
       */
      const isViewingApp =
        document.visibilityState === "visible" && document.hasFocus();

      if (normalizedSenderId !== String(userId) && isViewingApp) {
        socketInstance.emit("markMessagesRead", {
          senderId: normalizedSenderId,
        });
      }
    };

    const handleReceiveChannelMessage = (message) => {

      const { selectedChatType, selectedChatData, addMessage } =
        useAppStore.getState();

      if (selectedChatType !== "channel") {
        return;
      }

      const currentChannelId = String(selectedChatData?._id);

      const messageChannelId = String(message.channel?._id || message.channel);

      if (currentChannelId !== messageChannelId) {
        return;
      }

      addMessage(message);
    };

    const handleChannelMessageUpdated = (updatedMessage) => {

      const { selectedChatType, selectedChatData, updateMessage } =
        useAppStore.getState();

      if (selectedChatType !== "channel" || !selectedChatData?._id) {
        return;
      }

      const messageChannelId =
        updatedMessage.channel?._id ?? updatedMessage.channel;

      if (String(messageChannelId) !== String(selectedChatData._id)) {
        return;
      }

      updateMessage(updatedMessage);
    };
    /*
     * REGISTER LISTENERS
     */
    socketInstance.on("connect", handleConnect);

    socketInstance.on("disconnect", handleDisconnect);

    socketInstance.on("connect_error", handleConnectError);

    socketInstance.on("onlineUsers", handleOnlineUsers);

    socketInstance.on("typing", handleTyping);

    socketInstance.on("stopTyping", handleStopTyping);

    socketInstance.on("messagesRead", handleMessagesRead);

    socketInstance.on("messageUpdated", handleMessageUpdated);

    socketInstance.on("receiveMessage", handleReceiveMessage);
    socketInstance.on("receiveChannelMessage", handleReceiveChannelMessage);
    socketInstance.on("channelMessageUpdated", handleChannelMessageUpdated);

    /*
     * CLEANUP
     */
    return () => {
      socketInstance.off("connect", handleConnect);

      socketInstance.off("disconnect", handleDisconnect);

      socketInstance.off("connect_error", handleConnectError);

      socketInstance.off("onlineUsers", handleOnlineUsers);

      socketInstance.off("typing", handleTyping);

      socketInstance.off("stopTyping", handleStopTyping);

      socketInstance.off("messagesRead", handleMessagesRead);

      socketInstance.off("messageUpdated", handleMessageUpdated);

      socketInstance.off("receiveMessage", handleReceiveMessage);
      socketInstance.off("receiveChannelMessage", handleReceiveChannelMessage);
      socketInstance.off("channelMessageUpdated", handleChannelMessageUpdated);

      socketInstance.disconnect();

      setSocket(null);

    };
  }, [userInfo?._id, userInfo?.id]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
