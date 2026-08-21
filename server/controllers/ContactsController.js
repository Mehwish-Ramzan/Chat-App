import User from "../models/UserModel.js";
import Message from "../models/MessagesModel.js";
import ChatRequest from "../models/ChatRequestModel.js";

const makePairKey = (
  firstUserId,
  secondUserId,
) => {
  return [
    String(firstUserId),
    String(secondUserId),
  ]
    .sort()
    .join(":");
};

export const SearchContacts = async (
  request,
  response,
) => {
  try {
    const {
      searchTerm,
    } = request.body;

    if (
      !searchTerm ||
      !searchTerm.trim()
    ) {
      return response.status(400).json({
        message:
          "SearchTerm is required.",
      });
    }

    const sanitizedSearchTerm =
      searchTerm.replace(
        /[-[\]{}()*+?.,\\^$|#\s]/g,
        "\\$&",
      );

    const regex =
      new RegExp(
        sanitizedSearchTerm,
        "i",
      );

    /*
     * Get matching users.
     *
     * Only return fields needed
     * by the frontend.
     */
    const contacts =
      await User.find({
        $and: [
          {
            _id: {
              $ne:
                request.userId,
            },
          },

          {
            $or: [
              {
                firstName:
                  regex,
              },

              {
                lastName:
                  regex,
              },

              {
                email:
                  regex,
              },

              /*
               * If your UserModel
               * has username this
               * also searches it.
               */
              {
                username:
                  regex,
              },
            ],
          },
        ],
      })
        .select(
          "_id email username firstName lastName image color profileSetup",
        )
        .lean();

    /*
     * Add relationship information
     * for every search result.
     */
    const enrichedContacts =
      await Promise.all(
        contacts.map(
          async (contact) => {
            const pairKey =
              makePairKey(
                request.userId,
                contact._id,
              );

            const [
              chatRequest,
              existingConversation,
            ] =
              await Promise.all([
                ChatRequest.findOne(
                  {
                    pairKey,
                  },
                ).lean(),

                Message.exists({
                  $or: [
                    {
                      sender:
                        request.userId,

                      recipient:
                        contact._id,
                    },

                    {
                      sender:
                        contact._id,

                      recipient:
                        request.userId,
                    },
                  ],
                }),
              ]);

            let direction =
              null;

            if (chatRequest) {
              direction =
                String(
                  chatRequest.sender,
                ) ===
                String(
                  request.userId,
                )
                  ? "outgoing"
                  : "incoming";
            }

            /*
             * Old conversations
             * remain usable even
             * without request model.
             */
            const canChat =
              Boolean(
                existingConversation,
              ) ||
              chatRequest?.status ===
                "accepted";

            return {
              ...contact,

              chatRequest: {
                status:
                  chatRequest?.status ||
                  "none",

                direction,

                requestId:
                  chatRequest?._id ||
                  null,

                canChat,
              },
            };
          },
        ),
      );

    return response.status(200).json({
      message:
        "Contacts fetched successfully",

      contacts:
        enrichedContacts,
    });
  } catch (error) {
    console.error(
      "Search contacts error:",
      error,
    );

    return response.status(500).json({
      message:
        "Internal server error",
    });
  }
};