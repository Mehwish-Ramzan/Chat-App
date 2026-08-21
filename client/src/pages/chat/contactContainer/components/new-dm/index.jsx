import { useEffect, useState } from "react";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

import { FaPlus } from "react-icons/fa";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { ScrollArea } from "@/components/ui/scroll-area";

import { Avatar, AvatarImage } from "@/components/ui/avatar";

import Lottie from "react-lottie";

import { toast } from "sonner";

import { animationDefaultOptions, getColor } from "@/lib/utils.js";

import { useAppStore } from "@/store";

import apiClient from "@/lib/api-client.js";

import {
  HOST,
  SEARCH_CONTACTS_ROUTES,
  GET_CHAT_REQUESTS_ROUTE,
  SEND_CHAT_REQUEST_ROUTE,
  ACCEPT_CHAT_REQUEST_ROUTE,
  DECLINE_CHAT_REQUEST_ROUTE,
  CANCEL_CHAT_REQUEST_ROUTE,
} from "@/utils/constants.js";

const NewDM = () => {
  const {
    setSelectedChatType,

    setSelectedChatData,

    setSelectedChatMessages,
  } = useAppStore();

  const [openNewContactModal, setOpenNewContactModal] = useState(false);

  const [searchedContacts, setSearchedContacts] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");

  const [incomingRequests, setIncomingRequests] = useState([]);

  const [outgoingRequests, setOutgoingRequests] = useState([]);

  const [loadingRequests, setLoadingRequests] = useState(false);

  const [actionLoading, setActionLoading] = useState(null);

  const getContactName = (contact) => {
    if (!contact) {
      return "Unknown user";
    }

    if (contact.firstName || contact.lastName) {
      return `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim();
    }

    return contact.username || contact.email || "User";
  };

  /*
   * LOAD PENDING REQUESTS
   */
  const loadRequests = async () => {
    try {
      setLoadingRequests(true);

      const response = await apiClient.get(GET_CHAT_REQUESTS_ROUTE);

      setIncomingRequests(response.data.incoming || []);

      setOutgoingRequests(response.data.outgoing || []);
    } catch (error) {
      console.error(
        "Unable to load chat requests:",
        error.response?.data || error,
      );
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (!openNewContactModal) {
      return;
    }

    loadRequests();
  }, [openNewContactModal]);

  /*
   * SEARCH
   */
  const searchContacts = async (value) => {
    setSearchTerm(value);

    if (!value.trim()) {
      setSearchedContacts([]);

      return;
    }

    try {
      const response = await apiClient.post(
        SEARCH_CONTACTS_ROUTES,

        {
          searchTerm: value.trim(),
        },
      );

      setSearchedContacts(response.data.contacts || []);
    } catch (error) {
      console.error("Search contacts error:", error);

      setSearchedContacts([]);
    }
  };

  /*
   * REFRESH REQUEST +
   * SEARCH DATA
   */
  const refreshData = async () => {
    await loadRequests();

    if (searchTerm.trim()) {
      await searchContacts(searchTerm);
    }
  };

  /*
   * OPEN CHAT
   */
  const openChat = (contact) => {
    if (!contact?._id) {
      return;
    }

    setSelectedChatMessages([]);

    setSelectedChatType("contact");

    setSelectedChatData(contact);

    setOpenNewContactModal(false);

    setSearchTerm("");

    setSearchedContacts([]);
    setSearchTerm("");

    setSearchedContacts([]);
  };

  /*
   * SEND REQUEST
   */
  const sendRequest = async (contact) => {
    try {
      if (!contact?._id) {
        toast.error("User ID is missing");

        return;
      }

      setActionLoading(contact._id);

      console.log("📨 Sending chat request to:", contact._id);

      const requestUrl = `${SEND_CHAT_REQUEST_ROUTE}/${contact._id}`;

      console.log("🌐 POST:", requestUrl);

      const response = await apiClient.post(
        requestUrl,
        {},
        {
          withCredentials: true,
        },
      );

      console.log("✅ Chat request response:", response.status, response.data);

      if (response.status !== 201 && response.status !== 200) {
        throw new Error("Unexpected response");
      }

      const request = response.data?.request;

      /*
       * Update search UI immediately.
       *
       * User should see:
       * Pending + Cancel
       * without reopening modal.
       */
      setSearchedContacts((currentContacts) =>
        currentContacts.map((item) =>
          String(item._id) === String(contact._id)
            ? {
                ...item,

                chatRequest: {
                  status: "pending",

                  direction: "outgoing",

                  requestId: request?._id || null,

                  canChat: false,
                },
              }
            : item,
        ),
      );

      toast.success("Chat request sent");

      /*
       * Fetch actual backend
       * request state.
       */
      await loadRequests();
    } catch (error) {
      console.error("❌ Send request failed:", {
        status: error.response?.status,

        data: error.response?.data,

        message: error.message,
      });

      toast.error(
        error.response?.data?.message || "Unable to send chat request",
      );
    } finally {
      setActionLoading(null);
    }
  };

  /*
   * CANCEL REQUEST
   */
  const cancelRequest = async (requestId) => {
    try {
      setActionLoading(requestId);

      await apiClient.delete(`${CANCEL_CHAT_REQUEST_ROUTE}/${requestId}`);

      toast.success("Request cancelled");

      await refreshData();
    } catch (error) {
      toast.error("Unable to cancel request");
    } finally {
      setActionLoading(null);
    }
  };

  /*
   * ACCEPT REQUEST
   */
  const acceptRequest = async (request, openAfter = true) => {
    try {
      setActionLoading(request._id);

      await apiClient.patch(`${ACCEPT_CHAT_REQUEST_ROUTE}/${request._id}`);

      toast.success("Chat request accepted");

      await refreshData();

      if (openAfter && request.sender) {
        openChat(request.sender);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to accept request");
    } finally {
      setActionLoading(null);
    }
  };

  /*
   * DECLINE
   */
  const declineRequest = async (requestId) => {
    try {
      setActionLoading(requestId);

      await apiClient.patch(`${DECLINE_CHAT_REQUEST_ROUTE}/${requestId}`);

      toast.success("Chat request declined");

      await refreshData();
    } catch (error) {
      toast.error("Unable to decline request");
    } finally {
      setActionLoading(null);
    }
  };

  /*
   * ACCEPT REQUEST FROM
   * SEARCH RESULT
   */
  const acceptSearchRequest = async (contact) => {
    const requestId = contact.chatRequest?.requestId;

    if (!requestId) {
      return;
    }

    await acceptRequest(
      {
        _id: requestId,

        sender: contact,
      },

      true,
    );
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => setOpenNewContactModal(true)}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <FaPlus />
          </button>
        </TooltipTrigger>

        <TooltipContent className="bg-[#1c1b1e] border-none text-white mb-2 p-3">
          <p>Select New Contact</p>
        </TooltipContent>
      </Tooltip>

      <Dialog
        open={openNewContactModal}
        onOpenChange={(value) => {
          setOpenNewContactModal(value);

          if (!value) {
            setSearchTerm("");

            setSearchedContacts([]);
          }
        }}
      >
        <DialogContent className="bg-[#181920] border border-[#2f303b] text-white w-[95vw] max-w-[560px] max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl">Start a conversation</DialogTitle>

            <DialogDescription className="text-neutral-400">
              Search users and send a chat request before starting a new
              conversation.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[70vh] pr-2">
            <div className="flex flex-col gap-5">
              {/* INCOMING REQUESTS */}
              {incomingRequests.length > 0 && (
                <section>
                  <p className="text-xs uppercase tracking-wider text-purple-400 mb-3">
                    Chat Requests
                  </p>

                  <div className="flex flex-col gap-2">
                    {incomingRequests.map((request) => {
                      const contact = request.sender;

                      const busy = actionLoading === request._id;

                      return (
                        <div
                          key={request._id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-[#22232c]"
                        >
                          <Avatar className="h-11 w-11 rounded-full overflow-hidden">
                            {contact?.image ? (
                              <AvatarImage
                                src={`${HOST}/${contact.image}`}
                                className="object-cover h-full w-full"
                              />
                            ) : (
                              <div
                                className={`uppercase flex h-11 w-11 rounded-full items-center justify-center ${getColor(
                                  contact?.color ?? 0,
                                )}`}
                              >
                                {getContactName(contact)
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                            )}
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {getContactName(contact)}
                            </p>

                            <p className="text-xs text-neutral-500 truncate">
                              {contact?.email}
                            </p>
                          </div>

                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => acceptRequest(request)}
                            className="text-xs px-3 py-2 rounded-md bg-[#8417ff] hover:bg-[#741bda] disabled:opacity-50"
                          >
                            Accept
                          </button>

                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => declineRequest(request._id)}
                            className="text-xs px-3 py-2 rounded-md bg-[#30313b] hover:bg-[#393a45] disabled:opacity-50"
                          >
                            Decline
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* OUTGOING REQUESTS */}
              {outgoingRequests.length > 0 && (
                <section>
                  <p className="text-xs uppercase tracking-wider text-neutral-500 mb-3">
                    Sent Requests
                  </p>

                  <div className="flex flex-col gap-2">
                    {outgoingRequests.map((request) => {
                      const contact = request.recipient;

                      const busy = actionLoading === request._id;

                      return (
                        <div
                          key={request._id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-[#202129]"
                        >
                          <Avatar className="h-10 w-10 rounded-full overflow-hidden">
                            {contact?.image ? (
                              <AvatarImage
                                src={`${HOST}/${contact.image}`}
                                className="object-cover h-full w-full"
                              />
                            ) : (
                              <div
                                className={`uppercase flex h-10 w-10 rounded-full items-center justify-center ${getColor(
                                  contact?.color ?? 0,
                                )}`}
                              >
                                {getContactName(contact)
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                            )}
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">
                              {getContactName(contact)}
                            </p>

                            <p className="text-xs text-neutral-500">Pending</p>
                          </div>

                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => cancelRequest(request._id)}
                            className="text-xs px-3 py-2 rounded-md bg-[#30313b] hover:bg-[#393a45] disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* SEARCH */}
              <section>
                <p className="text-xs uppercase tracking-wider text-neutral-500 mb-3">
                  Find Users
                </p>

                <input
                  value={searchTerm}
                  placeholder="Search name, username or email"
                  className="rounded-lg p-3 w-full bg-[#2c2e3b] border border-transparent focus:border-purple-500 focus:outline-none"
                  onChange={(event) => searchContacts(event.target.value)}
                />

                <div className="flex flex-col gap-2 mt-3">
                  {searchedContacts.map((contact) => {
                    const relation = contact.chatRequest || {};

                    const canChat = Boolean(relation.canChat);

                    const pendingOutgoing =
                      relation.status === "pending" &&
                      relation.direction === "outgoing";

                    const pendingIncoming =
                      relation.status === "pending" &&
                      relation.direction === "incoming";

                    const busy =
                      actionLoading !== null &&
                      (String(actionLoading) === String(contact._id) ||
                        (relation.requestId != null &&
                          String(actionLoading) ===
                            String(relation.requestId)));

                    return (
                      <div
                        key={contact._id}
                        className="flex gap-3 items-center rounded-xl p-3 hover:bg-[#22232c] transition-colors"
                      >
                        <Avatar className="h-11 w-11 rounded-full overflow-hidden">
                          {contact.image ? (
                            <AvatarImage
                              src={`${HOST}/${contact.image}`}
                              className="object-cover h-full w-full"
                            />
                          ) : (
                            <div
                              className={`uppercase flex h-11 w-11 rounded-full items-center justify-center ${getColor(
                                contact.color ?? 0,
                              )}`}
                            >
                              {getContactName(contact).charAt(0).toUpperCase()}
                            </div>
                          )}
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {getContactName(contact)}
                          </p>

                          <p className="text-xs text-neutral-500 truncate">
                            {contact.email}
                          </p>
                        </div>

                        {canChat ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => openChat(contact)}
                            className="text-xs bg-[#8417ff] hover:bg-[#741bda] px-4 py-2 rounded-md disabled:opacity-50"
                          >
                            Chat
                          </button>
                        ) : pendingOutgoing ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-500">
                              Pending
                            </span>

                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => cancelRequest(relation.requestId)}
                              className="text-xs bg-[#30313b] hover:bg-[#393a45] px-3 py-2 rounded-md disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : pendingIncoming ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => acceptSearchRequest(contact)}
                              className="text-xs bg-[#8417ff] hover:bg-[#741bda] px-3 py-2 rounded-md disabled:opacity-50"
                            >
                              Accept
                            </button>

                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => declineRequest(relation.requestId)}
                              className="text-xs bg-[#30313b] hover:bg-[#393a45] px-3 py-2 rounded-md disabled:opacity-50"
                            >
                              Decline
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={async (event) => {
                              event.preventDefault();
                              event.stopPropagation();

                              console.log(
                                "🟣 Send request button clicked:",
                                contact._id,
                              );

                              await sendRequest(contact);
                            }}
                            className="text-xs bg-[#8417ff] hover:bg-[#741bda] px-3 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {busy ? "Sending..." : "Send request"}
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {/* NO SEARCH RESULTS */}
                  {searchTerm.trim() && searchedContacts.length === 0 && (
                    <p className="text-sm text-neutral-500 text-center py-6">
                      No contacts found.
                    </p>
                  )}

                  {/* YOUR ORIGINAL ANIMATION IS BACK */}
                  {!searchTerm.trim() && !loadingRequests && (
                    <div className="py-6 flex flex-col items-center justify-center">
                      <Lottie
                        isClickToPauseDisabled={true}
                        height={100}
                        width={100}
                        options={animationDefaultOptions.loading}
                      />

                      <div className="text-center text-white mt-4">
                        <h3 className="text-lg font-medium">
                          Hi
                          <span className="text-purple-500">! </span>
                          Search new
                          <span className="text-purple-500"> Contacts.</span>
                        </h3>

                        <p className="text-xs text-neutral-500 mt-2">
                          Send a request to start a new conversation.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NewDM;
