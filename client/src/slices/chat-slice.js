export const createChatSlice = (set) => ({
  selectedChatType: undefined,

  selectedChatData: undefined,

  selectedChatMessages: [],

  directMessageContacts: [],

  onlineUsers: [],
  typingUsers: [],
  channels: [],

  setOnlineUsers: (onlineUsers) => set({ onlineUsers }),

  addTypingUser: (userId) =>
    set((state) => ({
      typingUsers: state.typingUsers.includes(String(userId))
        ? state.typingUsers
        : [...state.typingUsers, String(userId)],
    })),

  removeTypingUser: (userId) =>
    set((state) => ({
      typingUsers: state.typingUsers.filter((id) => id !== String(userId)),
    })),

  markMessagesReadByUser: (userId) =>
    set((state) => ({
      selectedChatMessages: state.selectedChatMessages.map((message) => {
        const recipientId = message.recipient?._id ?? message.recipient;

        if (String(recipientId) !== String(userId)) {
          return message;
        }

        const currentReadBy = (message.readBy || []).map((id) =>
          String(id?._id ?? id),
        );

        if (currentReadBy.includes(String(userId))) {
          return message;
        }

        return {
          ...message,
          readBy: [...(message.readBy || []), userId],
        };
      }),
    })),

  updateMessage: (updatedMessage) =>
    set((state) => ({
      selectedChatMessages: state.selectedChatMessages.map((message) =>
        String(message._id) === String(updatedMessage._id)
          ? updatedMessage
          : message,
      ),
    })),
  removeMessage: (messageId) =>
    set((state) => ({
      selectedChatMessages: state.selectedChatMessages.filter(
        (message) => String(message._id) !== String(messageId),
      ),
    })),

  setSelectedChatType: (selectedChatType) =>
    set({
      selectedChatType,
    }),

  setSelectedChatData: (selectedChatData) =>
    set({
      selectedChatData,
    }),

  setSelectedChatMessages: (selectedChatMessages) =>
    set({
      selectedChatMessages,
    }),

  setDirectMessageContacts: (directMessageContacts) =>
    set({
      directMessageContacts,
    }),

  addDirectMessageContact: (contact) =>
    set((state) => {
      const exists = state.directMessageContacts.some(
        (item) => String(item._id) === String(contact._id),
      );

      if (exists) {
        return state;
      }

      return {
        directMessageContacts: [contact, ...state.directMessageContacts],
      };
    }),

  updateDirectMessageContact: (message, currentUserId) =>
    set((state) => {
      const sender = message.sender;

      const recipient = message.recipient;

      if (!sender || !recipient || !currentUserId) {
        return state;
      }

      const senderId = String(sender._id || sender);

      const currentId = String(currentUserId);

      const contact = senderId === currentId ? recipient : sender;

      if (!contact?._id) {
        return state;
      }

      let lastMessage = message.content || "";

      if (!message.isDeleted && message.messageType === "image") {
        lastMessage = "📷 Image";
      }

      if (!message.isDeleted && message.messageType === "file") {
        lastMessage = "📎 File";
      }

      if (!message.isDeleted && message.messageType === "video") {
        lastMessage = "🎥 Video";
      }

      const updatedContact = {
        ...contact,

        lastMessage,

        lastMessageAt: message.createdAt,
      };

      const remaining = state.directMessageContacts.filter(
        (item) => String(item._id) !== String(contact._id),
      );

      return {
        directMessageContacts: [updatedContact, ...remaining],
      };
    }),

  addMessage: (message) =>
    set((state) => ({
      selectedChatMessages: [...state.selectedChatMessages, message],
    })),

  closeChat: () =>
    set({
      selectedChatType: undefined,

      selectedChatData: undefined,

      selectedChatMessages: [],
    }),

  resetChatState: () =>
    set({
      selectedChatType: undefined,
      selectedChatData: undefined,
      selectedChatMessages: [],
      directMessageContacts: [],
      onlineUsers: [],
      typingUsers: [],
      channels: [],
    }),
  setChannels: (channels) =>
    set({
      channels,
    }),

  addChannel: (channel) =>
    set((state) => {
      const exists = state.channels.some(
        (item) => String(item._id) === String(channel._id),
      );

      if (exists) {
        return state;
      }

      return {
        channels: [channel, ...state.channels],
      };
    }),
});
