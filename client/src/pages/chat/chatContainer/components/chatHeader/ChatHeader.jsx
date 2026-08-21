import { RiCloseFill } from "react-icons/ri";

import { useAppStore } from "@/store";

import {
  Avatar,
  AvatarImage,
} from "@/components/ui/avatar";

import { getColor } from "@/lib/utils.js";

import {
  HOST,
} from "@/utils/constants.js";

import ChannelSettings from "../channelSettings/ChannelSettings";

const ChatHeader = () => {
  const {
    closeChat,
    selectedChatData,
    selectedChatType,
    onlineUsers,
    typingUsers,
  } = useAppStore();

  if (!selectedChatData) {
    return null;
  }

  /*
   * CHANNEL HEADER
   */
  if (
    selectedChatType ===
    "channel"
  ) {
    return (
      <div className="h-[10vh] mt-3 mx-3 rounded-xl border border-[#2f303b] flex items-center justify-between px-5 bg-[#1b1c24]">
        {/* LEFT SIDE */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-12 w-12 shrink-0 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center text-2xl font-semibold">
            #
          </div>

          <div className="flex flex-col min-w-0">
            <span className="text-white font-medium truncate">
              {
                selectedChatData.name
              }
            </span>

            <span className="text-sm text-neutral-500">
              {selectedChatData
                .members?.length ||
                0}{" "}
              members
            </span>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="ml-auto flex items-center gap-3 shrink-0">
          <ChannelSettings />

          <button
            type="button"
            onClick={
              closeChat
            }
            className="flex items-center justify-center text-neutral-500 hover:text-white transition-colors"
            aria-label="Close channel"
          >
            <RiCloseFill className="text-3xl" />
          </button>
        </div>
      </div>
    );
  }

  /*
   * DIRECT MESSAGE HEADER
   */
  const contactName =
    selectedChatData.firstName ||
    selectedChatData.lastName
      ? `${selectedChatData.firstName ?? ""} ${
          selectedChatData.lastName ??
          ""
        }`.trim()
      : selectedChatData.email;

  const initial =
    selectedChatData.firstName?.charAt(
      0,
    ) ||
    selectedChatData.lastName?.charAt(
      0,
    ) ||
    selectedChatData.email?.charAt(
      0,
    ) ||
    "U";

  const selectedUserId =
    String(
      selectedChatData?._id ||
        selectedChatData?.id,
    );

  const isOnline =
    onlineUsers.includes(
      selectedUserId,
    );

  const isTyping =
    typingUsers.includes(
      selectedUserId,
    );

  return (
    <div className="h-[10vh] mt-3 mx-3 rounded-xl border border-[#2f303b] flex items-center justify-between px-5 bg-[#1b1c24]">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="h-12 w-12 shrink-0 rounded-full overflow-hidden">
          {selectedChatData.image ? (
            <AvatarImage
              src={`${HOST}/${selectedChatData.image}`}
              alt={
                contactName
              }
              className="object-cover h-full w-full"
            />
          ) : (
            <div
              className={`uppercase flex items-center justify-center h-12 w-12 rounded-full ${getColor(
                selectedChatData.color ??
                  0,
              )}`}
            >
              {initial}
            </div>
          )}
        </Avatar>

        <div className="flex flex-col min-w-0">
          <span className="text-white font-medium truncate">
            {contactName}
          </span>

          <span
            className={`text-sm ${
              isTyping
                ? "text-purple-400"
                : isOnline
                  ? "text-green-400"
                  : "text-neutral-500"
            }`}
          >
            {isTyping
              ? "Typing..."
              : isOnline
                ? "Online"
                : "Offline"}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={
          closeChat
        }
        className="ml-auto flex items-center justify-center text-neutral-500 hover:text-white transition-colors"
        aria-label="Close conversation"
      >
        <RiCloseFill className="text-3xl" />
      </button>
    </div>
  );
};

export default ChatHeader;