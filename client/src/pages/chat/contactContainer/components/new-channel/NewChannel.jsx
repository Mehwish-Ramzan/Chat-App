import { useState } from "react";

import { FaPlus, FaCheck } from "react-icons/fa";

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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { toast } from "sonner";

import apiClient from "@/lib/api-client";

import { useAppStore } from "@/store";

import { getColor } from "@/lib/utils";

import {
  HOST,
  SEARCH_CONTACTS_ROUTES,
  CREATE_CHANNEL_ROUTE,
} from "@/utils/constants";

const NewChannel = () => {
  const {
    addChannel,
    setSelectedChatData,
    setSelectedChatType,
    setSelectedChatMessages,
  } = useAppStore();

  const [open, setOpen] =
    useState(false);

  const [channelName, setChannelName] =
    useState("");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [
    searchedContacts,
    setSearchedContacts,
  ] = useState([]);

  const [
    selectedMembers,
    setSelectedMembers,
  ] = useState([]);

  const [creating, setCreating] =
    useState(false);

  const getContactName = (contact) => {
    if (
      contact.firstName ||
      contact.lastName
    ) {
      return `${
        contact.firstName ?? ""
      } ${
        contact.lastName ?? ""
      }`.trim();
    }

    return (
      contact.username ||
      contact.email ||
      "User"
    );
  };

  /*
   * SEARCH MEMBERS
   */
  const searchContacts = async (
    value,
  ) => {
    setSearchTerm(value);

    if (!value.trim()) {
      setSearchedContacts([]);

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

      setSearchedContacts(
        response.data.contacts ||
          [],
      );
    } catch (error) {
      console.error(
        "Channel member search failed:",
        error,
      );

      setSearchedContacts([]);
    }
  };

  /*
   * SELECT / UNSELECT MEMBER
   */
  const toggleMember = (
    contact,
  ) => {
    const exists =
      selectedMembers.some(
        (member) =>
          String(member._id) ===
          String(contact._id),
      );

    if (exists) {
      setSelectedMembers(
        (current) =>
          current.filter(
            (member) =>
              String(
                member._id,
              ) !==
              String(
                contact._id,
              ),
          ),
      );

      return;
    }

    setSelectedMembers(
      (current) => [
        ...current,
        contact,
      ],
    );
  };

  /*
   * RESET MODAL
   */
  const resetModal = () => {
    setChannelName("");

    setSearchTerm("");

    setSearchedContacts([]);

    setSelectedMembers([]);
  };

  /*
   * CREATE CHANNEL
   */
  const createChannel =
    async () => {
      const cleanName =
        channelName.trim();

      if (
        cleanName.length < 2
      ) {
        toast.error(
          "Channel name must be at least 2 characters",
        );

        return;
      }

      try {
        setCreating(true);

        const response =
          await apiClient.post(
            CREATE_CHANNEL_ROUTE,
            {
              name: cleanName,

              members:
                selectedMembers.map(
                  (member) =>
                    member._id,
                ),
            },
          );

        const channel =
          response.data.channel;

        if (!channel?._id) {
          throw new Error(
            "Channel was not returned by server",
          );
        }

        /*
         * Sidebar update
         */
        addChannel(channel);

        /*
         * Open newly-created channel
         */
        setSelectedChatMessages(
          [],
        );

        setSelectedChatData(
          channel,
        );

        setSelectedChatType(
          "channel",
        );

        toast.success(
          "Channel created",
        );

        setOpen(false);

        resetModal();
      } catch (error) {
        console.error(
          "Create channel error:",
          error.response?.data ||
            error,
        );

        toast.error(
          error.response?.data
            ?.message ||
            "Unable to create channel",
        );
      } finally {
        setCreating(false);
      }
    };

  return (
    <>
      {/* CHANNEL PLUS BUTTON */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() =>
              setOpen(true)
            }
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <FaPlus />
          </button>
        </TooltipTrigger>

        <TooltipContent className="bg-[#1c1b1e] border-none text-white">
          Create Channel
        </TooltipContent>
      </Tooltip>

      {/* CREATE CHANNEL MODAL */}
      <Dialog
        open={open}
        onOpenChange={(
          value,
        ) => {
          setOpen(value);

          if (!value) {
            resetModal();
          }
        }}
      >
        <DialogContent
          className="
            bg-[#181920]
            border
            border-[#2f303b]
            text-white
            w-[95vw]
            max-w-[660px]
            max-h-[85vh]
            overflow-hidden
            p-0
            flex
            flex-col
          "
        >
          {/* HEADER */}
          <DialogHeader className="px-7 pt-7 pb-4">
            <DialogTitle className="text-2xl font-semibold">
              Create a channel
            </DialogTitle>

            <DialogDescription className="text-neutral-400 text-base">
              Give your channel a
              name and choose
              members.
            </DialogDescription>
          </DialogHeader>

          {/* SCROLLABLE CONTENT */}
          <div
            className="
              flex-1
              min-h-0
              overflow-y-auto
              overflow-x-hidden
              custom-scrollbar
              px-7
              pb-6
            "
          >
            <div className="flex flex-col gap-6">
              {/* CHANNEL NAME */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-3">
                  Channel Name
                </label>

                <input
                  value={
                    channelName
                  }
                  onChange={(
                    event,
                  ) =>
                    setChannelName(
                      event
                        .target
                        .value,
                    )
                  }
                  maxLength={50}
                  placeholder="e.g. Development"
                  className="
                    w-full
                    rounded-xl
                    bg-[#2a2b35]
                    border
                    border-[#3a3b45]
                    px-5
                    py-4
                    text-white
                    placeholder:text-neutral-600
                    outline-none
                    transition-colors
                    focus:border-purple-500
                  "
                />
              </div>

              {/* MEMBER SEARCH */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-3">
                  Add Members
                </label>

                <input
                  value={
                    searchTerm
                  }
                  onChange={(
                    event,
                  ) =>
                    searchContacts(
                      event
                        .target
                        .value,
                    )
                  }
                  placeholder="Search name or email"
                  className="
                    w-full
                    rounded-xl
                    bg-[#2a2b35]
                    border
                    border-[#3a3b45]
                    px-5
                    py-4
                    text-white
                    placeholder:text-neutral-600
                    outline-none
                    transition-colors
                    focus:border-purple-500
                  "
                />
              </div>

              {/* SELECTED MEMBERS */}
              {selectedMembers.length >
                0 && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-neutral-500 mb-3">
                    Selected Members (
                    {
                      selectedMembers.length
                    }
                    )
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {selectedMembers.map(
                      (member) => (
                        <button
                          key={
                            member._id
                          }
                          type="button"
                          onClick={() =>
                            toggleMember(
                              member,
                            )
                          }
                          className="
                            max-w-full
                            flex
                            items-center
                            gap-2
                            text-sm
                            bg-purple-500/15
                            text-purple-300
                            border
                            border-purple-500/30
                            rounded-full
                            px-3
                            py-2
                            hover:bg-purple-500/20
                            transition-colors
                          "
                        >
                          <span className="truncate max-w-[180px]">
                            {getContactName(
                              member,
                            )}
                          </span>

                          <span className="text-purple-300">
                            ×
                          </span>
                        </button>
                      ),
                    )}
                  </div>
                </div>
              )}

              {/* SEARCH RESULTS */}
              {searchTerm.trim() && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-neutral-500 mb-3">
                    Search Results
                  </p>

                  <div className="flex flex-col gap-3">
                    {searchedContacts.map(
                      (
                        contact,
                      ) => {
                        const selected =
                          selectedMembers.some(
                            (
                              member,
                            ) =>
                              String(
                                member._id,
                              ) ===
                              String(
                                contact._id,
                              ),
                          );

                        return (
                          <button
                            type="button"
                            key={
                              contact._id
                            }
                            onClick={() =>
                              toggleMember(
                                contact,
                              )
                            }
                            className={`
                              w-full
                              flex
                              items-center
                              gap-4
                              p-4
                              rounded-xl
                              text-left
                              border
                              transition-colors

                              ${
                                selected
                                  ? "bg-purple-500/10 border-purple-500/40"
                                  : "bg-[#22232c] border-transparent hover:bg-[#282933]"
                              }
                            `}
                          >
                            {/* AVATAR */}
                            <Avatar className="h-12 w-12 shrink-0 rounded-full overflow-hidden">
                              {contact.image ? (
                                <AvatarImage
                                  src={`${HOST}/${contact.image}`}
                                  className="object-cover h-full w-full"
                                />
                              ) : (
                                <div
                                  className={`
                                    h-12
                                    w-12
                                    rounded-full
                                    flex
                                    items-center
                                    justify-center
                                    uppercase
                                    ${getColor(
                                      contact.color ??
                                        0,
                                    )}
                                  `}
                                >
                                  {getContactName(
                                    contact,
                                  )
                                    .charAt(
                                      0,
                                    )
                                    .toUpperCase()}
                                </div>
                              )}
                            </Avatar>

                            {/* USER INFO */}
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-medium text-white truncate">
                                {getContactName(
                                  contact,
                                )}
                              </p>

                              <p className="text-sm text-neutral-500 truncate mt-0.5">
                                {
                                  contact.email
                                }
                              </p>
                            </div>

                            {/* SELECTED */}
                            {selected && (
                              <div
                                className="
                                  shrink-0
                                  h-9
                                  w-9
                                  rounded-full
                                  bg-[#8417ff]
                                  flex
                                  items-center
                                  justify-center
                                "
                              >
                                <FaCheck className="text-sm text-white" />
                              </div>
                            )}
                          </button>
                        );
                      },
                    )}

                    {searchedContacts.length ===
                      0 && (
                      <div className="rounded-xl bg-[#22232c] py-8 px-4">
                        <p className="text-sm text-neutral-500 text-center">
                          No users
                          found.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* EMPTY STATE */}
              {!searchTerm.trim() && (
                <div className="rounded-xl border border-[#2f303b] bg-[#202129] py-7 px-5 text-center">
                  <div className="mx-auto mb-3 h-11 w-11 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                    <FaPlus />
                  </div>

                  <p className="text-sm text-neutral-300">
                    Search for users
                    above to add them
                    to your channel.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* FOOTER */}
          <div
            className="
              shrink-0
              border-t
              border-[#2f303b]
              bg-[#181920]
              px-7
              py-5
              flex
              items-center
              justify-end
              gap-3
            "
          >
            <button
              type="button"
              onClick={() =>
                setOpen(false)
              }
              disabled={creating}
              className="
                px-5
                py-3
                rounded-lg
                bg-[#30313b]
                text-white
                hover:bg-[#3a3b46]
                disabled:opacity-50
                transition-colors
              "
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={
                creating ||
                channelName
                  .trim()
                  .length < 2
              }
              onClick={
                createChannel
              }
              className="
                px-5
                py-3
                rounded-lg
                bg-[#8417ff]
                text-white
                hover:bg-[#741bda]
                disabled:opacity-40
                disabled:cursor-not-allowed
                transition-colors
              "
            >
              {creating
                ? "Creating..."
                : "Create Channel"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NewChannel;