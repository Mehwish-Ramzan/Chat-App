import {
  useEffect,
  useState,
} from "react";

import {
  BsThreeDotsVertical,
} from "react-icons/bs";

import {
  FiTrash2,
  FiLogOut,
  FiUserMinus,
  FiUserPlus,
  FiEdit2,
} from "react-icons/fi";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Avatar,
  AvatarImage,
} from "@/components/ui/avatar";

import {
  toast,
} from "sonner";

import {
  useAppStore,
} from "@/store";

import apiClient from "@/lib/api-client";

import {
  HOST,
  SEARCH_CONTACTS_ROUTES,
  CHANNELS_ROUTE,
} from "@/utils/constants";

import {
  getColor,
} from "@/lib/utils";

import ConfirmModal from "@/components/ConfirmModal";

const ChannelSettings = () => {
  const {
    selectedChatData,
    selectedChatType,
    userInfo,
    setSelectedChatData,
  } = useAppStore();

  const [
    open,
    setOpen,
  ] = useState(false);

  const [
    channelName,
    setChannelName,
  ] = useState("");

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    searchResults,
    setSearchResults,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    confirmAction,
    setConfirmAction,
  ] = useState(null);

  const currentUserId =
    userInfo?._id ??
    userInfo?.id;

  const channelId =
    selectedChatData?._id;

  const adminId =
    selectedChatData?.admin?._id ??
    selectedChatData?.admin;

  const isAdmin =
    String(adminId) ===
    String(currentUserId);

  const members =
    selectedChatData?.members ||
    [];

  useEffect(() => {
    if (open) {
      setChannelName(
        selectedChatData?.name ||
          "",
      );

      setSearchTerm("");

      setSearchResults([]);
    }
  }, [
    open,
    selectedChatData,
  ]);

  if (
    selectedChatType !==
      "channel" ||
    !channelId
  ) {
    return null;
  }

  const getName = (
    user,
  ) => {
    if (
      user?.firstName ||
      user?.lastName
    ) {
      return `${user.firstName ?? ""} ${
        user.lastName ?? ""
      }`.trim();
    }

    return (
      user?.email ||
      "User"
    );
  };

  /*
   * KEEP CHANNEL LIST +
   * OPEN CHAT UPDATED
   */
  const syncChannel = (
    channel,
  ) => {
    if (!channel) {
      return;
    }

    const state =
      useAppStore.getState();

    state.setSelectedChatData?.(
      channel,
    );

    if (
      Array.isArray(
        state.channels,
      ) &&
      state.setChannels
    ) {
      state.setChannels(
        state.channels.map(
          (item) =>
            String(item._id) ===
            String(channel._id)
              ? channel
              : item,
        ),
      );
    }
  };

  /*
   * REMOVE CHANNEL FROM
   * CURRENT USER UI
   */
  const removeChannelLocally =
    () => {
      const state =
        useAppStore.getState();

      if (
        Array.isArray(
          state.channels,
        ) &&
        state.setChannels
      ) {
        state.setChannels(
          state.channels.filter(
            (channel) =>
              String(
                channel._id,
              ) !==
              String(channelId),
          ),
        );
      }

      if (
        typeof state.closeChat ===
        "function"
      ) {
        state.closeChat();

        return;
      }

      state.setSelectedChatType?.(
        undefined,
      );

      state.setSelectedChatData?.(
        undefined,
      );

      state.setSelectedChatMessages?.(
        [],
      );
    };

  /*
   * RENAME
   */
  const renameChannel =
    async () => {
      const name =
        channelName.trim();

      if (!name) {
        return;
      }

      try {
        setLoading(true);

        const response =
          await apiClient.patch(
            `${CHANNELS_ROUTE}/${channelId}/name`,

            {
              name,
            },
          );

        syncChannel(
          response.data.channel,
        );

        toast.success(
          "Channel renamed",
        );
      } catch (error) {
        toast.error(
          error.response?.data
            ?.message ||
            "Unable to rename channel",
        );
      } finally {
        setLoading(false);
      }
    };

  /*
   * SEARCH USERS
   */
  const searchUsers =
    async (value) => {
      setSearchTerm(value);

      if (!value.trim()) {
        setSearchResults([]);

        return;
      }

      try {
        const response =
          await apiClient.post(
            SEARCH_CONTACTS_ROUTES,

            {
              searchTerm:
                value.trim(),
            },
          );

        const existingIds =
          new Set(
            members.map(
              (member) =>
                String(
                  member?._id ??
                    member,
                ),
            ),
          );

        setSearchResults(
          (
            response.data
              .contacts || []
          ).filter(
            (user) =>
              !existingIds.has(
                String(
                  user._id,
                ),
              ),
          ),
        );
      } catch (error) {
        console.error(
          "Member search failed:",
          error,
        );

        setSearchResults([]);
      }
    };

  /*
   * ADD MEMBER
   */
  const addMember =
    async (memberId) => {
      try {
        setLoading(true);

        const response =
          await apiClient.patch(
            `${CHANNELS_ROUTE}/${channelId}/members/add`,

            {
              memberId,
            },
          );

        syncChannel(
          response.data.channel,
        );

        setSearchTerm("");

        setSearchResults([]);

        toast.success(
          "Member added",
        );
      } catch (error) {
        toast.error(
          error.response?.data
            ?.message ||
            "Unable to add member",
        );
      } finally {
        setLoading(false);
      }
    };

  /*
   * REMOVE MEMBER
   */
  const removeMember =
    async (memberId) => {
      try {
        setLoading(true);

        const response =
          await apiClient.patch(
            `${CHANNELS_ROUTE}/${channelId}/members/remove`,

            {
              memberId,
            },
          );

        syncChannel(
          response.data.channel,
        );

        toast.success(
          "Member removed",
        );
      } catch (error) {
        toast.error(
          error.response?.data
            ?.message ||
            "Unable to remove member",
        );
      } finally {
        setLoading(false);

        setConfirmAction(
          null,
        );
      }
    };

  /*
   * LEAVE
   */
  const leaveChannel =
    async () => {
      try {
        setLoading(true);

        await apiClient.patch(
          `${CHANNELS_ROUTE}/${channelId}/leave`,
        );

        toast.success(
          "You left the channel",
        );

        setOpen(false);

        removeChannelLocally();
      } catch (error) {
        toast.error(
          error.response?.data
            ?.message ||
            "Unable to leave channel",
        );
      } finally {
        setLoading(false);

        setConfirmAction(
          null,
        );
      }
    };

  /*
   * DELETE CHANNEL
   */
  const deleteChannel =
    async () => {
      try {
        setLoading(true);

        await apiClient.delete(
          `${CHANNELS_ROUTE}/${channelId}`,
        );

        toast.success(
          "Channel deleted",
        );

        setOpen(false);

        removeChannelLocally();
      } catch (error) {
        toast.error(
          error.response?.data
            ?.message ||
            "Unable to delete channel",
        );
      } finally {
        setLoading(false);

        setConfirmAction(
          null,
        );
      }
    };

  return (
    <>
      {/* HEADER THREE DOTS */}
      <button
        type="button"
        onClick={() =>
          setOpen(true)
        }
        className="text-neutral-500 hover:text-white p-2 rounded-md hover:bg-[#292a33] transition-colors"
        title="Channel settings"
      >
        <BsThreeDotsVertical className="text-xl" />
      </button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
      >
        <DialogContent className="bg-[#181920] border border-[#30313b] text-white w-[95vw] max-w-[520px] max-h-[85vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle>
              Channel Settings
            </DialogTitle>

            <DialogDescription className="text-neutral-400">
              Manage the channel
              and its members.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-6 mt-3">
            {/* RENAME */}
            <section>
              <p className="text-xs uppercase tracking-wider text-neutral-500 mb-2">
                Channel Name
              </p>

              <div className="flex gap-2">
                <input
                  value={
                    channelName
                  }
                  onChange={(
                    event,
                  ) =>
                    setChannelName(
                      event.target
                        .value,
                    )
                  }
                  disabled={
                    !isAdmin ||
                    loading
                  }
                  className="flex-1 bg-[#2a2b33] rounded-md px-4 py-3 outline-none disabled:opacity-50"
                />

                {isAdmin && (
                  <button
                    type="button"
                    onClick={
                      renameChannel
                    }
                    disabled={
                      loading ||
                      !channelName.trim()
                    }
                    className="bg-[#8417ff] hover:bg-[#741bda] px-4 rounded-md disabled:opacity-40"
                  >
                    <FiEdit2 />
                  </button>
                )}
              </div>
            </section>

            {/* MEMBERS */}
            <section>
              <p className="text-xs uppercase tracking-wider text-neutral-500 mb-3">
                Members (
                {members.length})
              </p>

              <div className="flex flex-col gap-2">
                {members.map(
                  (member) => {
                    const memberId =
                      member?._id ??
                      member;

                    const isChannelAdmin =
                      String(
                        memberId,
                      ) ===
                      String(
                        adminId,
                      );

                    return (
                      <div
                        key={
                          memberId
                        }
                        className="flex items-center gap-3 bg-[#22232c] rounded-lg p-3"
                      >
                        <Avatar className="h-10 w-10">
                          {member.image ? (
                            <AvatarImage
                              src={`${HOST}/${member.image}`}
                            />
                          ) : (
                            <div
                              className={`h-10 w-10 flex items-center justify-center rounded-full ${getColor(
                                member.color ??
                                  0,
                              )}`}
                            >
                              {getName(
                                member,
                              )
                                .charAt(
                                  0,
                                )
                                .toUpperCase()}
                            </div>
                          )}
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">
                            {getName(
                              member,
                            )}
                          </p>

                          <p className="text-xs text-neutral-500 truncate">
                            {
                              member.email
                            }
                          </p>
                        </div>

                        {isChannelAdmin ? (
                          <span className="text-xs text-purple-400">
                            Admin
                          </span>
                        ) : (
                          isAdmin && (
                            <button
                              type="button"
                              disabled={
                                loading
                              }
                              onClick={() =>
                                setConfirmAction(
                                  {
                                    type: "remove",
                                    memberId,
                                    name: getName(
                                      member,
                                    ),
                                  },
                                )
                              }
                              className="text-red-400 hover:text-red-300"
                            >
                              <FiUserMinus />
                            </button>
                          )
                        )}
                      </div>
                    );
                  },
                )}
              </div>
            </section>

            {/* ADD MEMBER */}
            {isAdmin && (
              <section>
                <p className="text-xs uppercase tracking-wider text-neutral-500 mb-2">
                  Add Member
                </p>

                <input
                  value={
                    searchTerm
                  }
                  onChange={(
                    event,
                  ) =>
                    searchUsers(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Search users..."
                  className="w-full bg-[#2a2b33] rounded-md px-4 py-3 outline-none"
                />

                {searchResults.length >
                  0 && (
                  <div className="flex flex-col gap-2 mt-2">
                    {searchResults.map(
                      (user) => (
                        <div
                          key={
                            user._id
                          }
                          className="flex items-center gap-3 bg-[#22232c] rounded-lg p-3"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">
                              {getName(
                                user,
                              )}
                            </p>

                            <p className="text-xs text-neutral-500 truncate">
                              {
                                user.email
                              }
                            </p>
                          </div>

                          <button
                            type="button"
                            disabled={
                              loading
                            }
                            onClick={() =>
                              addMember(
                                user._id,
                              )
                            }
                            className="text-purple-400 hover:text-purple-300"
                          >
                            <FiUserPlus />
                          </button>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </section>
            )}

            {/* LEAVE */}
            <button
              type="button"
              disabled={loading}
              onClick={() =>
                setConfirmAction(
                  {
                    type: "leave",
                  },
                )
              }
              className="flex items-center justify-center gap-2 bg-[#30313b] hover:bg-[#393a45] rounded-md py-3"
            >
              <FiLogOut />

              Leave Channel
            </button>

            {/* DELETE */}
            {isAdmin && (
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  setConfirmAction(
                    {
                      type: "delete",
                    },
                  )
                }
                className="flex items-center justify-center gap-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-md py-3"
              >
                <FiTrash2 />

                Delete Channel
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* REMOVE MEMBER CONFIRM */}
      <ConfirmModal
        open={
          confirmAction?.type ===
          "remove"
        }
        onOpenChange={(
          value,
        ) => {
          if (!value) {
            setConfirmAction(
              null,
            );
          }
        }}
        title="Remove member?"
        description={`Remove ${
          confirmAction?.name ||
          "this member"
        } from the channel?`}
        confirmText="Remove"
        destructive
        onConfirm={() =>
          removeMember(
            confirmAction
              ?.memberId,
          )
        }
      />

      {/* LEAVE CONFIRM */}
      <ConfirmModal
        open={
          confirmAction?.type ===
          "leave"
        }
        onOpenChange={(
          value,
        ) => {
          if (!value) {
            setConfirmAction(
              null,
            );
          }
        }}
        title="Leave channel?"
        description="You will no longer receive messages from this channel."
        confirmText="Leave"
        destructive
        onConfirm={
          leaveChannel
        }
      />

      {/* DELETE CHANNEL CONFIRM */}
      <ConfirmModal
        open={
          confirmAction?.type ===
          "delete"
        }
        onOpenChange={(
          value,
        ) => {
          if (!value) {
            setConfirmAction(
              null,
            );
          }
        }}
        title="Delete channel?"
        description="This permanently deletes the channel and its messages for every member."
        confirmText="Delete Channel"
        destructive
        onConfirm={
          deleteChannel
        }
      />
    </>
  );
};

export default ChannelSettings;