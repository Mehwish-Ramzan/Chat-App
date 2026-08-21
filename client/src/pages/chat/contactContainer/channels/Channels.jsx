import { useEffect } from "react";
import { Hash } from "lucide-react";

import { useAppStore } from "@/store";
import apiClient from "@/lib/api-client";

import { GET_USER_CHANNELS_ROUTE } from "@/utils/constants";

const Channels = () => {
  const {
    channels,
    setChannels,

    selectedChatData,
    selectedChatType,

    setSelectedChatData,
    setSelectedChatType,
    setSelectedChatMessages,
  } = useAppStore();

  useEffect(() => {
    const loadChannels = async () => {
      try {
        const response = await apiClient.get(GET_USER_CHANNELS_ROUTE);

        setChannels(response.data.channels || []);
      } catch (error) {
        console.error(
          "Unable to load channels:",
          error.response?.data || error,
        );
      }
    };

    loadChannels();
  }, [setChannels]);

  const openChannel = (channel) => {
    /*
     * IMPORTANT:
     * Data first, type second.
     */
    setSelectedChatMessages([]);

    setSelectedChatData(channel);

    setSelectedChatType("channel");
  };

  return (
    <div className="flex flex-col gap-1 mt-2 max-h-[32vh] overflow-y-auto custom-scrollbar pr-1">
      {channels.map((channel) => {
        const isSelected =
          selectedChatType === "channel" &&
          String(selectedChatData?._id) === String(channel._id);

        return (
          <button
            key={channel._id}
            type="button"
            onClick={() => openChannel(channel)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${
              isSelected ? "bg-[#252631]" : "hover:bg-[#202129]"
            }`}
          >
            <div className="h-9 w-9 rounded-lg bg-[#2a1d3d] flex items-center justify-center text-purple-400">
              <Hash size={18} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm text-white truncate">{channel.name}</p>

              <p className="text-xs text-neutral-500 truncate">
                {channel.members?.length || 0} members
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default Channels;
