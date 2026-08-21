export const HOST = import.meta.env.VITE_SERVER_URL;

export const AUTH_ROUTES = `/api/auth`;
export const SIGNUP_ROUTE = `${AUTH_ROUTES}/signup`;
export const LOGIN_ROUTE = `${AUTH_ROUTES}/login`;

export const GET_USER_INFO = `${AUTH_ROUTES}/user-info`;
export const UPDATE_PROFILE_ROUTE = `${AUTH_ROUTES}/update-profile`;
export const ADD_PROFILE_IMAGE_ROUTE = `${AUTH_ROUTES}/add-profile-image`;
export const DELETE_PROFILE_IMAGE_ROUTE = `${AUTH_ROUTES}/delete-profile-image`;
export const LOGOUT_ROUTE = `${AUTH_ROUTES}/logout`;
export const CONTACTS_ROUTES = `/api/contacts`;
export const SEARCH_CONTACTS_ROUTES = `${CONTACTS_ROUTES}/search`;
export const GET_MESSAGES_ROUTE = "/api/messages";
export const GET_DM_CONTACTS_ROUTE = "/api/messages/contacts";
export const UPLOAD_MESSAGE_FILE_ROUTE = "/api/messages/upload";
export const DOWNLOAD_MESSAGE_ROUTE = "/api/messages/download";
export const CONVERSATION_ROUTE = "/api/messages/conversation";

export const GET_CHAT_REQUESTS_ROUTE = "/api/chat-requests";

export const SEND_CHAT_REQUEST_ROUTE = "/api/chat-requests/send";

export const ACCEPT_CHAT_REQUEST_ROUTE = "/api/chat-requests/accept";

export const DECLINE_CHAT_REQUEST_ROUTE = "/api/chat-requests/decline";

export const CANCEL_CHAT_REQUEST_ROUTE = "/api/chat-requests/cancel";

export const CHANNELS_ROUTE = "/api/channels";

export const CREATE_CHANNEL_ROUTE = CHANNELS_ROUTE;

export const GET_USER_CHANNELS_ROUTE = CHANNELS_ROUTE;

export const GET_CHANNEL_MESSAGES_ROUTE = CHANNELS_ROUTE;
export const DOWNLOAD_CHANNEL_FILE_ROUTE = `${CHANNELS_ROUTE}/download`;

export const RENAME_CHANNEL_ROUTE = CHANNELS_ROUTE;

export const ADD_CHANNEL_MEMBER_ROUTE = CHANNELS_ROUTE;

export const REMOVE_CHANNEL_MEMBER_ROUTE = CHANNELS_ROUTE;

export const LEAVE_CHANNEL_ROUTE = CHANNELS_ROUTE;
export const DELETE_CHANNEL_ROUTE = CHANNELS_ROUTE;
