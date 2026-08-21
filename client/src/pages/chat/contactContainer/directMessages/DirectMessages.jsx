import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Avatar,
  AvatarImage,
} from "@/components/ui/avatar";

import {
  BsThreeDotsVertical,
} from "react-icons/bs";

import {
  FiEyeOff,
  FiTrash2,
} from "react-icons/fi";

import { useAppStore } from "@/store";

import {
  HOST,
  GET_DM_CONTACTS_ROUTE,
  CONVERSATION_ROUTE,
} from "@/utils/constants";

import apiClient from "@/lib/api-client";

import { getColor } from "@/lib/utils";

import ConfirmModal from "@/components/ConfirmModal";

const DirectMessages = () => {
  const {
    userInfo,

    directMessageContacts,
    setDirectMessageContacts,

    selectedChatData,

    setSelectedChatType,
    setSelectedChatData,
    setSelectedChatMessages,

    closeChat,
  } = useAppStore();

  const [
    openMenuId,
    setOpenMenuId,
  ] = useState(null);

  const [
    clearTarget,
    setClearTarget,
  ] = useState(null);

  const currentUserId =
    userInfo?._id ??
    userInfo?.id;

  /*
   * BACKEND IS SOURCE OF TRUTH.
   *
   * We always re-fetch contacts
   * instead of manually keeping
   * "Conversation cleared" state.
   */
  const loadContacts =
    useCallback(async () => {
      if (!currentUserId) {
        setDirectMessageContacts(
          [],
        );

        return;
      }

      try {
        const response =
          await apiClient.get(
            GET_DM_CONTACTS_ROUTE,
          );

        setDirectMessageContacts(
          response.data.contacts ||
            [],
        );
      } catch (error) {
        console.error(
          "Unable to get direct message contacts:",
          error.response?.data ||
            error,
        );

        setDirectMessageContacts(
          [],
        );
      }
    }, [
      currentUserId,
      setDirectMessageContacts,
    ]);

  /*
   * Refetch whenever account
   * changes.
   */
  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  /*
   * OPEN CONVERSATION
   */
  const openConversation = (
    contact,
  ) => {
    const contactId =
      contact?._id ??
      contact?.id;

    if (!contactId) {
      console.error(
        "Cannot open conversation: contact ID missing",
        contact,
      );

      return;
    }

    console.log(
      "Opening conversation:",
      contactId,
    );

    /*
     * Remove any previous chat
     * messages before selecting
     * the new conversation.
     */
    setSelectedChatMessages(
      [],
    );

    /*
     * Set selected contact.
     */
    setSelectedChatData({
      ...contact,

      /*
       * Normalize ID because
       * rest of chat code expects
       * selectedChatData._id.
       */
      _id: contactId,
    });

    /*
     * This is what makes
     * Chat.jsx render
     * <ChatContainer />.
     */
    setSelectedChatType(
      "contact",
    );

    setOpenMenuId(null);
  };

  /*
   * HIDE CONVERSATION
   */
  const hideConversation =
    async (contact) => {
      const contactId =
        contact?._id ??
        contact?.id;

      if (!contactId) {
        return;
      }

      try {
        await apiClient.patch(
          `${CONVERSATION_ROUTE}/${contactId}/hide`,
        );

        /*
         * Close it only when
         * currently opened.
         */
        const selectedId =
          selectedChatData?._id ??
          selectedChatData?.id;

        if (
          String(selectedId) ===
          String(contactId)
        ) {
          closeChat();
        }

        /*
         * Do NOT manually filter
         * Zustand.
         *
         * Get fresh backend state.
         */
        await loadContacts();

        setOpenMenuId(null);
      } catch (error) {
        console.error(
          "Unable to hide conversation:",
          error.response?.data ||
            error,
        );
      }
    };

  /*
   * CLEAR CONVERSATION
   */
  const clearConversation =
    async (contact) => {
      const contactId =
        contact?._id ??
        contact?.id;

      if (!contactId) {
        return;
      }

      try {
        await apiClient.patch(
          `${CONVERSATION_ROUTE}/${contactId}/clear`,
        );

        const selectedId =
          selectedChatData?._id ??
          selectedChatData?.id;

        if (
          String(selectedId) ===
          String(contactId)
        ) {
          setSelectedChatMessages(
            [],
          );
        }

        /*
         * Important:
         * Don't manually write
         * "Conversation cleared".
         *
         * Backend response decides
         * sidebar state.
         */
        await loadContacts();

        setOpenMenuId(null);
      } catch (error) {
        console.error(
          "Unable to clear conversation:",
          error.response?.data ||
            error,
        );
      }
    };

  return (
    <>
      <div className="flex flex-col gap-1 mt-2">
        {directMessageContacts.map(
          (contact) => {
            const contactId =
              contact?._id ??
              contact?.id;

            const contactName =
              contact.firstName ||
              contact.lastName
                ? `${
                    contact.firstName ??
                    ""
                  } ${
                    contact.lastName ??
                    ""
                  }`.trim()
                : contact.email;

            const menuOpen =
              String(
                openMenuId,
              ) ===
              String(
                contactId,
              );

            return (
              <div
                key={contactId}
                className="relative"
              >
                {/* CONTACT */}
                <button
                  type="button"
                  onClick={() =>
                    openConversation(
                      contact,
                    )
                  }
                  className="w-full flex items-center gap-3 px-3 py-2 pr-10 rounded-md hover:bg-[#202129] text-left transition-colors"
                >
                  <Avatar className="h-9 w-9 rounded-full overflow-hidden shrink-0">
                    {contact.image ? (
                      <AvatarImage
                        src={`${HOST}/${contact.image}`}
                        className="object-cover h-full w-full"
                      />
                    ) : (
                      <div
                        className={`uppercase flex h-9 w-9 rounded-full items-center justify-center ${getColor(
                          contact.color ??
                            0,
                        )}`}
                      >
                        {contactName
                          ?.charAt(0)
                          ?.toUpperCase() ||
                          "U"}
                      </div>
                    )}
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white truncate">
                      {contactName}
                    </p>

                    <p className="text-xs text-neutral-500 truncate">
                      {contact.lastMessage ||
                        contact.email}
                    </p>
                  </div>
                </button>

                {/* OPTIONS */}
                <button
                  type="button"
                  aria-label="Conversation options"
                  onClick={(
                    event,
                  ) => {
                    event.preventDefault();

                    event.stopPropagation();

                    setOpenMenuId(
                      menuOpen
                        ? null
                        : contactId,
                    );
                  }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white p-2 z-20"
                >
                  <BsThreeDotsVertical className="text-lg" />
                </button>

                {/* MENU */}
                {menuOpen && (
                  <div className="absolute z-50 right-2 top-11 w-48 rounded-lg border border-[#34353f] bg-[#202129] shadow-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={(
                        event,
                      ) => {
                        event.stopPropagation();

                        setClearTarget(
                          contact,
                        );

                        setOpenMenuId(
                          null,
                        );
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-neutral-200 hover:bg-[#2a2b33]"
                    >
                      <FiTrash2 />

                      Clear chat
                    </button>

                    <button
                      type="button"
                      onClick={(
                        event,
                      ) => {
                        event.stopPropagation();

                        hideConversation(
                          contact,
                        );
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-neutral-200 hover:bg-[#2a2b33]"
                    >
                      <FiEyeOff />

                      Hide conversation
                    </button>
                  </div>
                )}
              </div>
            );
          },
        )}
      </div>

      <ConfirmModal
        open={Boolean(
          clearTarget,
        )}
        onOpenChange={(
          value,
        ) => {
          if (!value) {
            setClearTarget(
              null,
            );
          }
        }}
        title="Clear conversation?"
        description={`This clears the conversation from your view only. ${
          clearTarget?.firstName ||
          clearTarget?.email ||
          "The other person"
        } will keep their copy.`}
        confirmText="Clear chat"
        destructive
        onConfirm={() => {
          if (
            clearTarget
          ) {
            clearConversation(
              clearTarget,
            );
          }
        }}
      />
    </>
  );
};

export default DirectMessages;